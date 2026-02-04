-- 00003_create_shipments.sql
-- Shipments posted by companies for truckers to bid on.

CREATE TYPE public.shipment_status AS ENUM (
    'draft',
    'posted',
    'negotiating',
    'booked',
    'in_transit',
    'delivered',
    'cancelled'
);

CREATE TABLE public.shipments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    pallet_count        INTEGER NOT NULL CHECK (pallet_count > 0),
    box_count           INTEGER,
    weight_kg           NUMERIC(10,2),
    pickup_location     GEOGRAPHY(POINT, 4326),
    pickup_address      TEXT NOT NULL,
    dropoff_location    GEOGRAPHY(POINT, 4326),
    dropoff_address     TEXT NOT NULL,
    pickup_date         DATE NOT NULL,
    pickup_time_start   TIME,
    pickup_time_end     TIME,
    delivery_deadline   TIMESTAMPTZ,
    budget_min          NUMERIC(10,2),
    budget_max          NUMERIC(10,2),
    status              public.shipment_status NOT NULL DEFAULT 'posted',
    assigned_trucker_id UUID REFERENCES public.profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shipments IS 'Freight shipments posted by companies.';

CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RPC function to create a shipment using lat/lng values.
-- SECURITY DEFINER ensures company_id is always the authenticated user.
CREATE OR REPLACE FUNCTION public.create_shipment(
    p_title             TEXT,
    p_description       TEXT DEFAULT NULL,
    p_pallet_count      INTEGER DEFAULT 1,
    p_box_count         INTEGER DEFAULT NULL,
    p_weight_kg         NUMERIC DEFAULT NULL,
    p_pickup_lat        DOUBLE PRECISION DEFAULT NULL,
    p_pickup_lng        DOUBLE PRECISION DEFAULT NULL,
    p_pickup_address    TEXT DEFAULT '',
    p_dropoff_lat       DOUBLE PRECISION DEFAULT NULL,
    p_dropoff_lng       DOUBLE PRECISION DEFAULT NULL,
    p_dropoff_address   TEXT DEFAULT '',
    p_pickup_date       DATE DEFAULT CURRENT_DATE,
    p_pickup_time_start TIME DEFAULT NULL,
    p_pickup_time_end   TIME DEFAULT NULL,
    p_delivery_deadline TIMESTAMPTZ DEFAULT NULL,
    p_budget_min        NUMERIC DEFAULT NULL,
    p_budget_max        NUMERIC DEFAULT NULL,
    p_status            public.shipment_status DEFAULT 'posted'
)
RETURNS public.shipments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shipment public.shipments;
BEGIN
    INSERT INTO public.shipments (
        company_id,
        title,
        description,
        pallet_count,
        box_count,
        weight_kg,
        pickup_location,
        pickup_address,
        dropoff_location,
        dropoff_address,
        pickup_date,
        pickup_time_start,
        pickup_time_end,
        delivery_deadline,
        budget_min,
        budget_max,
        status
    ) VALUES (
        auth.uid(),
        p_title,
        p_description,
        p_pallet_count,
        p_box_count,
        p_weight_kg,
        CASE
            WHEN p_pickup_lat IS NOT NULL AND p_pickup_lng IS NOT NULL
            THEN ST_Point(p_pickup_lng, p_pickup_lat)::GEOGRAPHY
            ELSE NULL
        END,
        p_pickup_address,
        CASE
            WHEN p_dropoff_lat IS NOT NULL AND p_dropoff_lng IS NOT NULL
            THEN ST_Point(p_dropoff_lng, p_dropoff_lat)::GEOGRAPHY
            ELSE NULL
        END,
        p_dropoff_address,
        p_pickup_date,
        p_pickup_time_start,
        p_pickup_time_end,
        p_delivery_deadline,
        p_budget_min,
        p_budget_max,
        p_status
    )
    RETURNING * INTO v_shipment;

    RETURN v_shipment;
END;
$$;
