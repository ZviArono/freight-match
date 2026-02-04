-- 00005_create_trucker_locations.sql
-- Real-time trucker GPS locations and spatial query functions.

CREATE TABLE public.trucker_locations (
    trucker_id      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    heading         DOUBLE PRECISION,
    speed_kmh       DOUBLE PRECISION,
    accuracy_meters DOUBLE PRECISION,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trucker_locations IS 'Latest GPS position for each trucker (overwritten on every update).';

-- RPC to update the authenticated trucker''s GPS location.
CREATE OR REPLACE FUNCTION public.update_trucker_location(
    p_lat               DOUBLE PRECISION,
    p_lng               DOUBLE PRECISION,
    p_heading           DOUBLE PRECISION DEFAULT NULL,
    p_speed_kmh         DOUBLE PRECISION DEFAULT NULL,
    p_accuracy_meters   DOUBLE PRECISION DEFAULT NULL
)
RETURNS public.trucker_locations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result public.trucker_locations;
BEGIN
    INSERT INTO public.trucker_locations (
        trucker_id,
        location,
        heading,
        speed_kmh,
        accuracy_meters,
        last_updated
    ) VALUES (
        auth.uid(),
        ST_Point(p_lng, p_lat)::GEOGRAPHY,
        p_heading,
        p_speed_kmh,
        p_accuracy_meters,
        now()
    )
    ON CONFLICT (trucker_id) DO UPDATE SET
        location        = EXCLUDED.location,
        heading         = EXCLUDED.heading,
        speed_kmh       = EXCLUDED.speed_kmh,
        accuracy_meters = EXCLUDED.accuracy_meters,
        last_updated    = now()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- Find all available truckers within a given radius (meters) of a point.
-- Joins profiles and trucker_availability for a rich result set.
CREATE OR REPLACE FUNCTION public.get_truckers_within_radius(
    p_lat       DOUBLE PRECISION,
    p_lng       DOUBLE PRECISION,
    p_radius_m  DOUBLE PRECISION DEFAULT 50000  -- 50 km default
)
RETURNS TABLE (
    trucker_id          UUID,
    display_name        TEXT,
    phone               TEXT,
    avatar_url          TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    heading             DOUBLE PRECISION,
    speed_kmh           DOUBLE PRECISION,
    distance_meters     DOUBLE PRECISION,
    is_available        BOOLEAN,
    available_pallets   INTEGER,
    vehicle_type        TEXT,
    last_updated        TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tl.trucker_id,
        p.display_name,
        p.phone,
        p.avatar_url,
        ST_Y(tl.location::GEOMETRY)    AS latitude,
        ST_X(tl.location::GEOMETRY)    AS longitude,
        tl.heading,
        tl.speed_kmh,
        ST_Distance(
            tl.location,
            ST_Point(p_lng, p_lat)::GEOGRAPHY
        )                               AS distance_meters,
        COALESCE(ta.is_available, false) AS is_available,
        COALESCE(ta.available_pallets, 0) AS available_pallets,
        ta.vehicle_type,
        tl.last_updated
    FROM public.trucker_locations tl
    JOIN public.profiles p ON p.id = tl.trucker_id
    LEFT JOIN public.trucker_availability ta ON ta.trucker_id = tl.trucker_id
    WHERE ST_DWithin(
        tl.location,
        ST_Point(p_lng, p_lat)::GEOGRAPHY,
        p_radius_m
    )
    AND COALESCE(ta.is_available, false) = true
    ORDER BY distance_meters ASC;
END;
$$;

-- Find all available truckers whose location falls within a map viewport bounding box.
CREATE OR REPLACE FUNCTION public.get_truckers_in_bounds(
    p_south     DOUBLE PRECISION,
    p_west      DOUBLE PRECISION,
    p_north     DOUBLE PRECISION,
    p_east      DOUBLE PRECISION
)
RETURNS TABLE (
    trucker_id          UUID,
    display_name        TEXT,
    phone               TEXT,
    avatar_url          TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    heading             DOUBLE PRECISION,
    speed_kmh           DOUBLE PRECISION,
    is_available        BOOLEAN,
    available_pallets   INTEGER,
    vehicle_type        TEXT,
    last_updated        TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tl.trucker_id,
        p.display_name,
        p.phone,
        p.avatar_url,
        ST_Y(tl.location::GEOMETRY)    AS latitude,
        ST_X(tl.location::GEOMETRY)    AS longitude,
        tl.heading,
        tl.speed_kmh,
        COALESCE(ta.is_available, false) AS is_available,
        COALESCE(ta.available_pallets, 0) AS available_pallets,
        ta.vehicle_type,
        tl.last_updated
    FROM public.trucker_locations tl
    JOIN public.profiles p ON p.id = tl.trucker_id
    LEFT JOIN public.trucker_availability ta ON ta.trucker_id = tl.trucker_id
    WHERE ST_Intersects(
        tl.location::GEOMETRY,
        ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326)
    )
    AND COALESCE(ta.is_available, false) = true
    ORDER BY tl.last_updated DESC;
END;
$$;
