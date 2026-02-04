-- 00010_create_indexes.sql
-- Performance indexes: GiST for spatial queries, B-tree for lookups and filters.

-- ============================================================
-- GiST indexes on GEOGRAPHY columns (spatial queries)
-- ============================================================

CREATE INDEX idx_shipments_pickup_location_gist
    ON public.shipments USING GIST (pickup_location);

CREATE INDEX idx_shipments_dropoff_location_gist
    ON public.shipments USING GIST (dropoff_location);

CREATE INDEX idx_trucker_availability_current_location_gist
    ON public.trucker_availability USING GIST (current_location);

CREATE INDEX idx_trucker_availability_destination_location_gist
    ON public.trucker_availability USING GIST (destination_location);

CREATE INDEX idx_trucker_locations_location_gist
    ON public.trucker_locations USING GIST (location);

-- ============================================================
-- B-tree indexes on foreign keys
-- ============================================================

CREATE INDEX idx_shipments_company_id
    ON public.shipments (company_id);

CREATE INDEX idx_shipments_assigned_trucker_id
    ON public.shipments (assigned_trucker_id);

CREATE INDEX idx_trucker_availability_trucker_id
    ON public.trucker_availability (trucker_id);

CREATE INDEX idx_negotiations_shipment_id
    ON public.negotiations (shipment_id);

CREATE INDEX idx_negotiations_company_id
    ON public.negotiations (company_id);

CREATE INDEX idx_negotiations_trucker_id
    ON public.negotiations (trucker_id);

CREATE INDEX idx_negotiation_events_negotiation_id
    ON public.negotiation_events (negotiation_id);

CREATE INDEX idx_messages_negotiation_id
    ON public.messages (negotiation_id);

CREATE INDEX idx_messages_sender_id
    ON public.messages (sender_id);

-- ============================================================
-- B-tree indexes on commonly filtered/sorted columns
-- ============================================================

CREATE INDEX idx_shipments_status
    ON public.shipments (status);

CREATE INDEX idx_shipments_pickup_date
    ON public.shipments (pickup_date);

CREATE INDEX idx_negotiations_status
    ON public.negotiations (status);

CREATE INDEX idx_trucker_availability_is_available
    ON public.trucker_availability (is_available);

CREATE INDEX idx_messages_created_at
    ON public.messages (created_at);

CREATE INDEX idx_trucker_locations_last_updated
    ON public.trucker_locations (last_updated);

CREATE INDEX idx_negotiation_events_created_at
    ON public.negotiation_events (created_at);

CREATE INDEX idx_messages_negotiation_id_created_at
    ON public.messages (negotiation_id, created_at);
