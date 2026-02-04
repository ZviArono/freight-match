-- 00008_create_rls_policies.sql
-- Row-Level Security policies for every public table.

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucker_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucker_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper functions
-- ============================================================

-- Return the role of the current authenticated user.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Convenience boolean helpers.
CREATE OR REPLACE FUNCTION public.is_company()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT public.get_user_role() = 'company';
$$;

CREATE OR REPLACE FUNCTION public.is_trucker()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT public.get_user_role() = 'trucker';
$$;

-- ============================================================
-- PROFILES
-- ============================================================

-- Anyone authenticated can view all profiles.
CREATE POLICY profiles_select_all
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can only update their own profile.
CREATE POLICY profiles_update_own
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- SHIPMENTS
-- ============================================================

-- Companies see their own shipments; truckers see all posted shipments.
CREATE POLICY shipments_select
    ON public.shipments FOR SELECT
    TO authenticated
    USING (
        (public.is_company() AND company_id = auth.uid())
        OR
        (public.is_trucker() AND status = 'posted')
        OR
        (public.is_trucker() AND assigned_trucker_id = auth.uid())
    );

-- Only companies can insert shipments, and only under their own id.
CREATE POLICY shipments_insert_company
    ON public.shipments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company() AND company_id = auth.uid()
    );

-- Companies can update only their own shipments.
CREATE POLICY shipments_update_company
    ON public.shipments FOR UPDATE
    TO authenticated
    USING (
        public.is_company() AND company_id = auth.uid()
    )
    WITH CHECK (
        public.is_company() AND company_id = auth.uid()
    );

-- ============================================================
-- TRUCKER AVAILABILITY
-- ============================================================

-- Truckers can do everything with their own availability row.
CREATE POLICY trucker_availability_all_own
    ON public.trucker_availability FOR ALL
    TO authenticated
    USING (
        public.is_trucker() AND trucker_id = auth.uid()
    )
    WITH CHECK (
        public.is_trucker() AND trucker_id = auth.uid()
    );

-- Companies can view available truckers.
CREATE POLICY trucker_availability_select_company
    ON public.trucker_availability FOR SELECT
    TO authenticated
    USING (
        public.is_company() AND is_available = true
    );

-- ============================================================
-- TRUCKER LOCATIONS
-- ============================================================

-- Truckers can insert their own location.
CREATE POLICY trucker_locations_insert_own
    ON public.trucker_locations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_trucker() AND trucker_id = auth.uid()
    );

-- Truckers can update their own location.
CREATE POLICY trucker_locations_update_own
    ON public.trucker_locations FOR UPDATE
    TO authenticated
    USING (
        public.is_trucker() AND trucker_id = auth.uid()
    )
    WITH CHECK (
        public.is_trucker() AND trucker_id = auth.uid()
    );

-- Companies can view all trucker locations.
CREATE POLICY trucker_locations_select_company
    ON public.trucker_locations FOR SELECT
    TO authenticated
    USING (
        public.is_company()
    );

-- Truckers can view their own location.
CREATE POLICY trucker_locations_select_own
    ON public.trucker_locations FOR SELECT
    TO authenticated
    USING (
        public.is_trucker() AND trucker_id = auth.uid()
    );

-- ============================================================
-- NEGOTIATIONS
-- ============================================================

-- Both parties can see their own negotiations.
CREATE POLICY negotiations_select_party
    ON public.negotiations FOR SELECT
    TO authenticated
    USING (
        company_id = auth.uid() OR trucker_id = auth.uid()
    );

-- Companies can initiate a negotiation.
CREATE POLICY negotiations_insert_company
    ON public.negotiations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_company() AND company_id = auth.uid()
    );

-- Truckers can also initiate a negotiation (e.g. "Make an Offer" on a job).
CREATE POLICY negotiations_insert_trucker
    ON public.negotiations FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_trucker() AND trucker_id = auth.uid()
    );

-- Both parties can update (for status transitions via RPC).
CREATE POLICY negotiations_update_party
    ON public.negotiations FOR UPDATE
    TO authenticated
    USING (
        company_id = auth.uid() OR trucker_id = auth.uid()
    )
    WITH CHECK (
        company_id = auth.uid() OR trucker_id = auth.uid()
    );

-- ============================================================
-- NEGOTIATION EVENTS
-- ============================================================

-- Visible to both parties of the parent negotiation.
CREATE POLICY negotiation_events_select_party
    ON public.negotiation_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.negotiations n
            WHERE n.id = negotiation_id
              AND (n.company_id = auth.uid() OR n.trucker_id = auth.uid())
        )
    );

-- ============================================================
-- MESSAGES
-- ============================================================

-- Both parties of a negotiation can read its messages.
CREATE POLICY messages_select_party
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.negotiations n
            WHERE n.id = negotiation_id
              AND (n.company_id = auth.uid() OR n.trucker_id = auth.uid())
        )
    );

-- Both parties can send messages in their negotiation thread.
CREATE POLICY messages_insert_party
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.negotiations n
            WHERE n.id = negotiation_id
              AND (n.company_id = auth.uid() OR n.trucker_id = auth.uid())
        )
    );
