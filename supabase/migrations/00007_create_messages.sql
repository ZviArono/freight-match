-- 00007_create_messages.sql
-- Chat messages within a negotiation thread.

CREATE TYPE public.message_type AS ENUM (
    'text',
    'negotiation_action',
    'system'
);

CREATE TABLE public.messages (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negotiation_id          UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
    sender_id               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content                 TEXT NOT NULL,
    message_type            public.message_type NOT NULL DEFAULT 'text',
    negotiation_event_id    UUID REFERENCES public.negotiation_events(id),
    is_read                 BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'Chat messages exchanged during a negotiation.';
