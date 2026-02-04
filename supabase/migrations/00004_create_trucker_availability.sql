-- 00004_create_trucker_availability.sql
-- Tracks trucker availability, capacity, and preferred destination.

CREATE TABLE public.trucker_availability (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trucker_id              UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_available            BOOLEAN NOT NULL DEFAULT true,
    current_location        GEOGRAPHY(POINT, 4326),
    current_address         TEXT,
    destination_location    GEOGRAPHY(POINT, 4326),
    destination_address     TEXT,
    available_pallets       INTEGER NOT NULL DEFAULT 0 CHECK (available_pallets >= 0),
    vehicle_type            TEXT,
    available_from          TIMESTAMPTZ,
    available_until         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trucker_availability IS 'Current availability and capacity for each trucker (one row per trucker).';

CREATE TRIGGER trg_trucker_availability_updated_at
    BEFORE UPDATE ON public.trucker_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Upsert trucker availability, converting lat/lng to PostGIS geography.
CREATE OR REPLACE FUNCTION public.upsert_trucker_availability(
    p_is_available          BOOLEAN DEFAULT true,
    p_current_lat           DOUBLE PRECISION DEFAULT NULL,
    p_current_lng           DOUBLE PRECISION DEFAULT NULL,
    p_current_address       TEXT DEFAULT NULL,
    p_destination_lat       DOUBLE PRECISION DEFAULT NULL,
    p_destination_lng       DOUBLE PRECISION DEFAULT NULL,
    p_destination_address   TEXT DEFAULT NULL,
    p_available_pallets     INTEGER DEFAULT 0,
    p_vehicle_type          TEXT DEFAULT NULL,
    p_available_from        TIMESTAMPTZ DEFAULT NULL,
    p_available_until       TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.trucker_availability
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result public.trucker_availability;
BEGIN
    INSERT INTO public.trucker_availability (
        trucker_id,
        is_available,
        current_location,
        current_address,
        destination_location,
        destination_address,
        available_pallets,
        vehicle_type,
        available_from,
        available_until
    ) VALUES (
        auth.uid(),
        p_is_available,
        CASE
            WHEN p_current_lat IS NOT NULL AND p_current_lng IS NOT NULL
            THEN ST_Point(p_current_lng, p_current_lat)::GEOGRAPHY
            ELSE NULL
        END,
        p_current_address,
        CASE
            WHEN p_destination_lat IS NOT NULL AND p_destination_lng IS NOT NULL
            THEN ST_Point(p_destination_lng, p_destination_lat)::GEOGRAPHY
            ELSE NULL
        END,
        p_destination_address,
        p_available_pallets,
        p_vehicle_type,
        p_available_from,
        p_available_until
    )
    ON CONFLICT (trucker_id) DO UPDATE SET
        is_available         = EXCLUDED.is_available,
        current_location     = EXCLUDED.current_location,
        current_address      = EXCLUDED.current_address,
        destination_location = EXCLUDED.destination_location,
        destination_address  = EXCLUDED.destination_address,
        available_pallets    = EXCLUDED.available_pallets,
        vehicle_type         = EXCLUDED.vehicle_type,
        available_from       = EXCLUDED.available_from,
        available_until       = EXCLUDED.available_until,
        updated_at           = now()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;
