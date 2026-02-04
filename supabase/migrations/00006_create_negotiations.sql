-- 00006_create_negotiations.sql
-- Price negotiations between companies and truckers on shipments.

CREATE TYPE public.negotiation_status AS ENUM (
    'initiated',
    'proposed',
    'counter_offered',
    'accepted',
    'rejected',
    'expired',
    'cancelled'
);

CREATE TABLE public.negotiations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id     UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trucker_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status          public.negotiation_status NOT NULL DEFAULT 'initiated',
    current_price   NUMERIC(10,2),
    proposed_by     UUID REFERENCES public.profiles(id),
    expires_at      TIMESTAMPTZ,
    accepted_at     TIMESTAMPTZ,
    rejected_at     TIMESTAMPTZ,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Only one active negotiation per shipment-trucker pair
    CONSTRAINT uq_negotiation_shipment_trucker UNIQUE (shipment_id, trucker_id),

    -- proposed_by must be one of the two parties (or NULL for system actions)
    CONSTRAINT chk_proposed_by_is_party
        CHECK (proposed_by IS NULL OR proposed_by = company_id OR proposed_by = trucker_id)
);

COMMENT ON TABLE public.negotiations IS 'Active price negotiations between a company and a trucker on a shipment.';

CREATE TRIGGER trg_negotiations_updated_at
    BEFORE UPDATE ON public.negotiations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Immutable audit log of every negotiation state change.
CREATE TABLE public.negotiation_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negotiation_id  UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    from_status     public.negotiation_status,
    to_status       public.negotiation_status,
    price           NUMERIC(10,2),
    actor_id        UUID REFERENCES public.profiles(id),
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.negotiation_events IS 'Immutable audit trail for every negotiation state transition.';
