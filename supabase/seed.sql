-- seed.sql
-- Realistic test data for the logistics marketplace.
-- NOTE: In a real Supabase project the auth.users rows are created via the
--       Auth API. Here we insert directly so that the handle_new_user trigger
--       fires and populates profiles automatically.

-- ============================================================
-- 1. Test users (2 companies + 3 truckers)
-- ============================================================
-- Passwords are 'password123' hashed with bcrypt. These are test-only values.

INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, aud, role
) VALUES
-- Company 1: Acme Logistics
(
    'a1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'dispatch@acmelogistics.com',
    '$2a$10$PznXMAePFpNjiEVkbiDkxeqHL8LMFsax4mNmxjOWjKQp1MrE4g/kS',
    now(), now(), now(),
    '{"role": "company", "display_name": "Acme Logistics", "company_name": "Acme Logistics Ltd."}',
    'authenticated', 'authenticated'
),
-- Company 2: SwiftShip
(
    'a2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'ops@swiftship.co',
    '$2a$10$PznXMAePFpNjiEVkbiDkxeqHL8LMFsax4mNmxjOWjKQp1MrE4g/kS',
    now(), now(), now(),
    '{"role": "company", "display_name": "SwiftShip", "company_name": "SwiftShip Inc."}',
    'authenticated', 'authenticated'
),
-- Trucker 1: Mike Hauler
(
    'b1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'mike@truckermail.com',
    '$2a$10$PznXMAePFpNjiEVkbiDkxeqHL8LMFsax4mNmxjOWjKQp1MrE4g/kS',
    now(), now(), now(),
    '{"role": "trucker", "display_name": "Mike Hauler"}',
    'authenticated', 'authenticated'
),
-- Trucker 2: Sarah Wheels
(
    'b2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'sarah@truckermail.com',
    '$2a$10$PznXMAePFpNjiEVkbiDkxeqHL8LMFsax4mNmxjOWjKQp1MrE4g/kS',
    now(), now(), now(),
    '{"role": "trucker", "display_name": "Sarah Wheels"}',
    'authenticated', 'authenticated'
),
-- Trucker 3: Dan Roads
(
    'b3333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'dan@truckermail.com',
    '$2a$10$PznXMAePFpNjiEVkbiDkxeqHL8LMFsax4mNmxjOWjKQp1MrE4g/kS',
    now(), now(), now(),
    '{"role": "trucker", "display_name": "Dan Roads"}',
    'authenticated', 'authenticated'
);

-- The handle_new_user trigger should have created profile rows.
-- Update them with phone numbers.
UPDATE public.profiles SET phone = '+1-555-100-0001' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '+1-555-100-0002' WHERE id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '+1-555-200-0001' WHERE id = 'b1111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '+1-555-200-0002' WHERE id = 'b2222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '+1-555-200-0003' WHERE id = 'b3333333-3333-3333-3333-333333333333';

-- ============================================================
-- 2. Shipments (5 shipments in various states)
-- ============================================================

-- Shipment 1: Posted, Chicago -> Detroit (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status
) VALUES (
    's1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Electronics to Detroit',
    '12 pallets of consumer electronics, fragile, climate-controlled preferred.',
    12, 240, 3600.00,
    ST_Point(-87.6298, 41.8781)::GEOGRAPHY, '123 W Wacker Dr, Chicago, IL 60601',
    ST_Point(-83.0458, 42.3314)::GEOGRAPHY, '500 Woodward Ave, Detroit, MI 48226',
    CURRENT_DATE + INTERVAL '2 days', '08:00', '12:00',
    (now() + INTERVAL '4 days')::TIMESTAMPTZ, 1800.00, 2500.00, 'posted'
);

-- Shipment 2: Negotiating, LA -> Phoenix (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, delivery_deadline, budget_min, budget_max, status
) VALUES (
    's2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Auto parts to Phoenix',
    '8 pallets of automotive parts, heavy load.',
    8, 5200.00,
    ST_Point(-118.2437, 34.0522)::GEOGRAPHY, '900 S Figueroa St, Los Angeles, CA 90015',
    ST_Point(-112.0740, 33.4484)::GEOGRAPHY, '301 W Jefferson St, Phoenix, AZ 85003',
    CURRENT_DATE + INTERVAL '3 days',
    (now() + INTERVAL '5 days')::TIMESTAMPTZ, 1200.00, 1800.00, 'negotiating'
);

-- Shipment 3: Booked, NYC -> Boston (SwiftShip)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status,
    assigned_trucker_id
) VALUES (
    's3333333-3333-3333-3333-333333333333',
    'a2222222-2222-2222-2222-222222222222',
    'Medical supplies to Boston',
    '5 pallets of medical supplies, time-sensitive delivery.',
    5, 100, 1200.00,
    ST_Point(-74.0060, 40.7128)::GEOGRAPHY, '350 5th Ave, New York, NY 10118',
    ST_Point(-71.0589, 42.3601)::GEOGRAPHY, '1 Congress St, Boston, MA 02114',
    CURRENT_DATE + INTERVAL '1 day', '06:00', '08:00',
    (now() + INTERVAL '2 days')::TIMESTAMPTZ, 800.00, 1100.00, 'booked',
    'b1111111-1111-1111-1111-111111111111'
);

-- Shipment 4: In Transit, Dallas -> Houston (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, delivery_deadline, budget_min, budget_max, status,
    assigned_trucker_id
) VALUES (
    's4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Food products to Houston',
    '20 pallets of packaged food, refrigerated truck required.',
    20, 8000.00,
    ST_Point(-96.7970, 32.7767)::GEOGRAPHY, '2000 Ross Ave, Dallas, TX 75201',
    ST_Point(-95.3698, 29.7604)::GEOGRAPHY, '600 Travis St, Houston, TX 77002',
    CURRENT_DATE, (now() + INTERVAL '1 day')::TIMESTAMPTZ, 900.00, 1300.00, 'in_transit',
    'b2222222-2222-2222-2222-222222222222'
);

-- Shipment 5: Posted, Seattle -> Portland (SwiftShip)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status
) VALUES (
    's5555555-5555-5555-5555-555555555555',
    'a2222222-2222-2222-2222-222222222222',
    'Furniture to Portland',
    '6 pallets of flat-pack furniture.',
    6, 60, 2400.00,
    ST_Point(-122.3321, 47.6062)::GEOGRAPHY, '800 Pike St, Seattle, WA 98101',
    ST_Point(-122.6765, 45.5152)::GEOGRAPHY, '1120 SW 5th Ave, Portland, OR 97204',
    CURRENT_DATE + INTERVAL '5 days', '09:00', '14:00',
    (now() + INTERVAL '7 days')::TIMESTAMPTZ, 600.00, 900.00, 'posted'
);

-- ============================================================
-- 3. Trucker availability
-- ============================================================

INSERT INTO public.trucker_availability (
    trucker_id, is_available,
    current_location, current_address,
    destination_location, destination_address,
    available_pallets, vehicle_type,
    available_from, available_until
) VALUES
-- Mike: near NYC, heading to Boston (booked for shipment 3)
(
    'b1111111-1111-1111-1111-111111111111',
    false,
    ST_Point(-74.0060, 40.7128)::GEOGRAPHY, 'New York, NY',
    ST_Point(-71.0589, 42.3601)::GEOGRAPHY, 'Boston, MA',
    0, '53-ft dry van',
    now(), now() + INTERVAL '2 days'
),
-- Sarah: in Dallas area, currently hauling (in_transit for shipment 4)
(
    'b2222222-2222-2222-2222-222222222222',
    false,
    ST_Point(-96.2000, 31.5000)::GEOGRAPHY, 'Waco, TX (en route)',
    ST_Point(-95.3698, 29.7604)::GEOGRAPHY, 'Houston, TX',
    0, '48-ft reefer',
    now(), now() + INTERVAL '1 day'
),
-- Dan: available near LA, big rig
(
    'b3333333-3333-3333-3333-333333333333',
    true,
    ST_Point(-118.1500, 33.9800)::GEOGRAPHY, 'Downey, CA',
    NULL, NULL,
    24, '53-ft dry van',
    now(), now() + INTERVAL '7 days'
);

-- ============================================================
-- 4. Trucker GPS locations
-- ============================================================

INSERT INTO public.trucker_locations (trucker_id, location, heading, speed_kmh, accuracy_meters, last_updated) VALUES
('b1111111-1111-1111-1111-111111111111', ST_Point(-74.0060, 40.7128)::GEOGRAPHY, 45.0, 0.0, 10.0, now()),
('b2222222-2222-2222-2222-222222222222', ST_Point(-96.2000, 31.5000)::GEOGRAPHY, 180.0, 95.5, 8.0, now() - INTERVAL '2 minutes'),
('b3333333-3333-3333-3333-333333333333', ST_Point(-118.1500, 33.9800)::GEOGRAPHY, 0.0, 0.0, 15.0, now() - INTERVAL '10 minutes');

-- ============================================================
-- 5. Negotiations
-- ============================================================

-- Negotiation 1: On shipment 2 (LA -> Phoenix) between Acme and Dan, counter-offered
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by, expires_at, version
) VALUES (
    'n1111111-1111-1111-1111-111111111111',
    's2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'counter_offered', 1500.00,
    'b3333333-3333-3333-3333-333333333333',
    now() + INTERVAL '24 hours',
    3
);

-- Events for negotiation 1
INSERT INTO public.negotiation_events (id, negotiation_id, event_type, from_status, to_status, price, actor_id, metadata, created_at) VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'n1111111-1111-1111-1111-111111111111',
    'price_proposed', 'initiated', 'proposed', 1200.00,
    'a1111111-1111-1111-1111-111111111111',
    '{"version": 1}', now() - INTERVAL '3 hours'
),
(
    'e2222222-2222-2222-2222-222222222222',
    'n1111111-1111-1111-1111-111111111111',
    'price_proposed', 'proposed', 'counter_offered', 1600.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 2}', now() - INTERVAL '2 hours'
),
(
    'e3333333-3333-3333-3333-333333333333',
    'n1111111-1111-1111-1111-111111111111',
    'price_proposed', 'counter_offered', 'counter_offered', 1500.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 3}', now() - INTERVAL '30 minutes'
);

-- Wait, the last event should show Acme counter-offered 1400, then Dan counter-offered 1500.
-- Let me correct: Acme proposed 1200, Dan countered 1600, Acme countered 1400, Dan countered 1500.
UPDATE public.negotiation_events SET price = 1400.00, actor_id = 'a1111111-1111-1111-1111-111111111111'
WHERE id = 'e3333333-3333-3333-3333-333333333333';

INSERT INTO public.negotiation_events (id, negotiation_id, event_type, from_status, to_status, price, actor_id, metadata, created_at) VALUES
(
    'e4444444-4444-4444-4444-444444444444',
    'n1111111-1111-1111-1111-111111111111',
    'price_proposed', 'counter_offered', 'counter_offered', 1500.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 4}', now() - INTERVAL '10 minutes'
);

-- Negotiation 2: On shipment 3 (NYC -> Boston) between SwiftShip and Mike, accepted
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by,
    accepted_at, version
) VALUES (
    'n2222222-2222-2222-2222-222222222222',
    's3333333-3333-3333-3333-333333333333',
    'a2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'accepted', 950.00,
    'b1111111-1111-1111-1111-111111111111',
    now() - INTERVAL '6 hours',
    2
);

-- Events for negotiation 2
INSERT INTO public.negotiation_events (negotiation_id, event_type, from_status, to_status, price, actor_id, created_at) VALUES
(
    'n2222222-2222-2222-2222-222222222222',
    'price_proposed', 'initiated', 'proposed', 900.00,
    'a2222222-2222-2222-2222-222222222222',
    now() - INTERVAL '8 hours'
),
(
    'n2222222-2222-2222-2222-222222222222',
    'price_proposed', 'proposed', 'counter_offered', 950.00,
    'b1111111-1111-1111-1111-111111111111',
    now() - INTERVAL '7 hours'
),
(
    'n2222222-2222-2222-2222-222222222222',
    'offer_accepted', 'counter_offered', 'accepted', 950.00,
    'a2222222-2222-2222-2222-222222222222',
    now() - INTERVAL '6 hours'
);

-- Negotiation 3: On shipment 4 (Dallas -> Houston) between Acme and Sarah, accepted
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by,
    accepted_at, version
) VALUES (
    'n3333333-3333-3333-3333-333333333333',
    's4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'accepted', 1100.00,
    'a1111111-1111-1111-1111-111111111111',
    now() - INTERVAL '12 hours',
    1
);

-- ============================================================
-- 6. Messages in negotiation 1 (the active one)
-- ============================================================

INSERT INTO public.messages (negotiation_id, sender_id, content, message_type, negotiation_event_id, is_read, created_at) VALUES
(
    'n1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Hi Dan, we have a shipment from LA to Phoenix. Can you do it for $1,200?',
    'text', NULL, true, now() - INTERVAL '3 hours 5 minutes'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Proposed price: $1200.00',
    'negotiation_action', 'e1111111-1111-1111-1111-111111111111', true, now() - INTERVAL '3 hours'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Hey! I am in the area but $1,200 is too low for that route. How about $1,600?',
    'text', NULL, true, now() - INTERVAL '2 hours 5 minutes'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Proposed price: $1600.00',
    'negotiation_action', 'e2222222-2222-2222-2222-222222222222', true, now() - INTERVAL '2 hours'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'That is a bit high for us. We can stretch to $1,400. The load is straightforward.',
    'text', NULL, true, now() - INTERVAL '35 minutes'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Proposed price: $1400.00',
    'negotiation_action', 'e3333333-3333-3333-3333-333333333333', true, now() - INTERVAL '30 minutes'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Meet in the middle at $1,500? I can pick up first thing Thursday.',
    'text', NULL, false, now() - INTERVAL '12 minutes'
),
(
    'n1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Proposed price: $1500.00',
    'negotiation_action', 'e4444444-4444-4444-4444-444444444444', false, now() - INTERVAL '10 minutes'
);
