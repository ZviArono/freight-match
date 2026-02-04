-- 00002_create_profiles.sql
-- User profiles for both companies and truckers.

-- Define the two user roles in the marketplace
CREATE TYPE public.user_role AS ENUM ('company', 'trucker');

-- Profiles table linked 1:1 with auth.users
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        public.user_role NOT NULL,
    display_name TEXT NOT NULL,
    company_name TEXT,
    phone       TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Public profile for each authenticated user (company or trucker).';

-- Generic trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Automatically create a profile row when a new user signs up.
-- Expects raw_user_meta_data to contain: role, display_name, company_name (optional).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, display_name, company_name)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data ->> 'role')::public.user_role,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User'),
        NEW.raw_user_meta_data ->> 'company_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
