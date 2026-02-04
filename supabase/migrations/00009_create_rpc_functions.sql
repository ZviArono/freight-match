-- 00009_create_rpc_functions.sql
-- Negotiation state-machine RPC functions with optimistic locking.

-- ============================================================
-- propose_price
-- ============================================================
-- Either party can propose/counter a price.
-- The last proposer cannot propose again (the other party must respond).
CREATE OR REPLACE FUNCTION public.propose_price(
    p_negotiation_id    UUID,
    p_price             NUMERIC,
    p_actor_id          UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_neg           public.negotiations;
    v_old_status    public.negotiation_status;
    v_new_status    public.negotiation_status;
    v_event_id      UUID;
BEGIN
    -- Lock the negotiation row to prevent concurrent mutations.
    SELECT * INTO v_neg
    FROM public.negotiations
    WHERE id = p_negotiation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found.');
    END IF;

    -- Validate actor is a party to this negotiation.
    IF p_actor_id <> v_neg.company_id AND p_actor_id <> v_neg.trucker_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Actor is not a party to this negotiation.');
    END IF;

    -- Validate current status allows a proposal.
    IF v_neg.status NOT IN ('initiated', 'proposed', 'counter_offered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot propose in status "%s".', v_neg.status)
        );
    END IF;

    -- Prevent the last proposer from proposing again (double-propose guard).
    IF v_neg.proposed_by IS NOT NULL AND v_neg.proposed_by = p_actor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already made the last proposal. Wait for the other party to respond.');
    END IF;

    -- Determine new status.
    v_old_status := v_neg.status;
    IF v_old_status = 'initiated' THEN
        v_new_status := 'proposed';
    ELSE
        v_new_status := 'counter_offered';
    END IF;

    -- Update the negotiation.
    UPDATE public.negotiations
    SET
        status        = v_new_status,
        current_price = p_price,
        proposed_by   = p_actor_id,
        expires_at    = now() + INTERVAL '24 hours',
        version       = version + 1,
        updated_at    = now()
    WHERE id = p_negotiation_id;

    -- Record the event.
    INSERT INTO public.negotiation_events (
        negotiation_id, event_type, from_status, to_status, price, actor_id, metadata
    ) VALUES (
        p_negotiation_id, 'price_proposed', v_old_status, v_new_status, p_price, p_actor_id,
        jsonb_build_object('version', v_neg.version + 1)
    )
    RETURNING id INTO v_event_id;

    -- Insert a system message into the negotiation chat.
    INSERT INTO public.messages (
        negotiation_id, sender_id, content, message_type, negotiation_event_id
    ) VALUES (
        p_negotiation_id,
        p_actor_id,
        format('Proposed price: $%s', p_price),
        'negotiation_action',
        v_event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'negotiation_id', p_negotiation_id,
        'new_status', v_new_status,
        'price', p_price,
        'version', v_neg.version + 1,
        'event_id', v_event_id
    );
END;
$$;

-- ============================================================
-- accept_offer
-- ============================================================
-- Only the recipient of the last proposal can accept.
-- expected_price must match current_price to prevent price-flip attacks.
CREATE OR REPLACE FUNCTION public.accept_offer(
    p_negotiation_id    UUID,
    p_actor_id          UUID,
    p_expected_price    NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_neg           public.negotiations;
    v_old_status    public.negotiation_status;
    v_event_id      UUID;
BEGIN
    -- Lock the row.
    SELECT * INTO v_neg
    FROM public.negotiations
    WHERE id = p_negotiation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found.');
    END IF;

    -- Validate actor is a party.
    IF p_actor_id <> v_neg.company_id AND p_actor_id <> v_neg.trucker_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Actor is not a party to this negotiation.');
    END IF;

    -- Only the recipient (not the proposer) may accept.
    IF v_neg.proposed_by IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No proposal to accept.');
    END IF;

    IF v_neg.proposed_by = p_actor_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own proposal. Wait for the other party.');
    END IF;

    -- Status must be proposed or counter_offered.
    IF v_neg.status NOT IN ('proposed', 'counter_offered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot accept in status "%s".', v_neg.status)
        );
    END IF;

    -- Price-flip prevention: the price the client saw must match current.
    IF v_neg.current_price IS DISTINCT FROM p_expected_price THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Price has changed since you last viewed the negotiation. Please review the new price.',
            'current_price', v_neg.current_price
        );
    END IF;

    v_old_status := v_neg.status;

    -- Accept the negotiation.
    UPDATE public.negotiations
    SET
        status      = 'accepted',
        accepted_at = now(),
        version     = version + 1,
        updated_at  = now()
    WHERE id = p_negotiation_id;

    -- Mark the shipment as booked and assign the trucker.
    UPDATE public.shipments
    SET
        status              = 'booked',
        assigned_trucker_id = v_neg.trucker_id,
        updated_at          = now()
    WHERE id = v_neg.shipment_id;

    -- Record the event.
    INSERT INTO public.negotiation_events (
        negotiation_id, event_type, from_status, to_status, price, actor_id, metadata
    ) VALUES (
        p_negotiation_id, 'offer_accepted', v_old_status, 'accepted',
        v_neg.current_price, p_actor_id,
        jsonb_build_object('version', v_neg.version + 1, 'shipment_id', v_neg.shipment_id)
    )
    RETURNING id INTO v_event_id;

    -- System message.
    INSERT INTO public.messages (
        negotiation_id, sender_id, content, message_type, negotiation_event_id
    ) VALUES (
        p_negotiation_id,
        p_actor_id,
        format('Offer accepted at $%s. Shipment is now booked!', v_neg.current_price),
        'system',
        v_event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'negotiation_id', p_negotiation_id,
        'accepted_price', v_neg.current_price,
        'shipment_id', v_neg.shipment_id,
        'event_id', v_event_id
    );
END;
$$;

-- ============================================================
-- reject_offer
-- ============================================================
-- Either party can reject.
CREATE OR REPLACE FUNCTION public.reject_offer(
    p_negotiation_id    UUID,
    p_actor_id          UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_neg           public.negotiations;
    v_old_status    public.negotiation_status;
    v_event_id      UUID;
BEGIN
    -- Lock the row.
    SELECT * INTO v_neg
    FROM public.negotiations
    WHERE id = p_negotiation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Negotiation not found.');
    END IF;

    -- Validate actor is a party.
    IF p_actor_id <> v_neg.company_id AND p_actor_id <> v_neg.trucker_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Actor is not a party to this negotiation.');
    END IF;

    -- Can only reject when there is an active proposal.
    IF v_neg.status NOT IN ('initiated', 'proposed', 'counter_offered') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot reject in status "%s".', v_neg.status)
        );
    END IF;

    v_old_status := v_neg.status;

    -- Reject.
    UPDATE public.negotiations
    SET
        status      = 'rejected',
        rejected_at = now(),
        version     = version + 1,
        updated_at  = now()
    WHERE id = p_negotiation_id;

    -- Record the event.
    INSERT INTO public.negotiation_events (
        negotiation_id, event_type, from_status, to_status, price, actor_id, metadata
    ) VALUES (
        p_negotiation_id, 'offer_rejected', v_old_status, 'rejected',
        v_neg.current_price, p_actor_id,
        jsonb_build_object('version', v_neg.version + 1)
    )
    RETURNING id INTO v_event_id;

    -- System message.
    INSERT INTO public.messages (
        negotiation_id, sender_id, content, message_type, negotiation_event_id
    ) VALUES (
        p_negotiation_id,
        p_actor_id,
        'Offer rejected.',
        'system',
        v_event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'negotiation_id', p_negotiation_id,
        'new_status', 'rejected',
        'event_id', v_event_id
    );
END;
$$;
