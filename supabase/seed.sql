-- seed.sql
-- Realistic test data for the logistics marketplace (Israel).
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
UPDATE public.profiles SET phone = '+972-50-100-0001' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '+972-50-100-0002' WHERE id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '+972-52-200-0001' WHERE id = 'b1111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '+972-52-200-0002' WHERE id = 'b2222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '+972-52-200-0003' WHERE id = 'b3333333-3333-3333-3333-333333333333';

-- ============================================================
-- 2. Shipments (5 shipments in various states)
-- ============================================================

-- Shipment 1: Posted, Tel Aviv -> Haifa (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status
) VALUES (
    'c1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Electronics to Haifa',
    '12 pallets of consumer electronics, fragile, climate-controlled preferred.',
    12, 240, 3600.00,
    ST_Point(34.7818, 32.0853)::GEOGRAPHY, 'Rothschild Blvd 45, Tel Aviv',
    ST_Point(34.9896, 32.7940)::GEOGRAPHY, 'HaNamal St 15, Haifa',
    CURRENT_DATE + INTERVAL '2 days', '08:00', '12:00',
    (now() + INTERVAL '4 days')::TIMESTAMPTZ, 1800.00, 2500.00, 'posted'
);

-- Shipment 2: Negotiating, Jerusalem -> Beer Sheva (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, delivery_deadline, budget_min, budget_max, status
) VALUES (
    'c2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Auto parts to Beer Sheva',
    '8 pallets of automotive parts, heavy load.',
    8, 5200.00,
    ST_Point(35.2137, 31.7683)::GEOGRAPHY, 'Jaffa St 20, Jerusalem',
    ST_Point(34.7915, 31.2530)::GEOGRAPHY, 'Rager Blvd 1, Beer Sheva',
    CURRENT_DATE + INTERVAL '3 days',
    (now() + INTERVAL '5 days')::TIMESTAMPTZ, 1200.00, 1800.00, 'negotiating'
);

-- Shipment 3: Booked, Haifa -> Tel Aviv (SwiftShip)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status,
    assigned_trucker_id
) VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'a2222222-2222-2222-2222-222222222222',
    'Medical supplies to Tel Aviv',
    '5 pallets of medical supplies, time-sensitive delivery.',
    5, 100, 1200.00,
    ST_Point(34.9896, 32.7940)::GEOGRAPHY, 'Sderot HaZionut 12, Haifa',
    ST_Point(34.7818, 32.0853)::GEOGRAPHY, 'Derech Menachem Begin 132, Tel Aviv',
    CURRENT_DATE + INTERVAL '1 day', '06:00', '08:00',
    (now() + INTERVAL '2 days')::TIMESTAMPTZ, 800.00, 1100.00, 'booked',
    'b1111111-1111-1111-1111-111111111111'
);

-- Shipment 4: In Transit, Netanya -> Ashdod (Acme)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, delivery_deadline, budget_min, budget_max, status,
    assigned_trucker_id
) VALUES (
    'c4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Food products to Ashdod',
    '20 pallets of packaged food, refrigerated truck required.',
    20, 8000.00,
    ST_Point(34.8532, 32.3215)::GEOGRAPHY, 'Herzl St 5, Netanya',
    ST_Point(34.6553, 31.8044)::GEOGRAPHY, 'HaAtzmaut St 30, Ashdod',
    CURRENT_DATE, (now() + INTERVAL '1 day')::TIMESTAMPTZ, 900.00, 1300.00, 'in_transit',
    'b2222222-2222-2222-2222-222222222222'
);

-- Shipment 5: Posted, Beer Sheva -> Eilat (SwiftShip)
INSERT INTO public.shipments (
    id, company_id, title, description,
    pallet_count, box_count, weight_kg,
    pickup_location, pickup_address,
    dropoff_location, dropoff_address,
    pickup_date, pickup_time_start, pickup_time_end,
    delivery_deadline, budget_min, budget_max, status
) VALUES (
    'c5555555-5555-5555-5555-555555555555',
    'a2222222-2222-2222-2222-222222222222',
    'Furniture to Eilat',
    '6 pallets of flat-pack furniture.',
    6, 60, 2400.00,
    ST_Point(34.7915, 31.2530)::GEOGRAPHY, 'Rager Blvd 10, Beer Sheva',
    ST_Point(34.9519, 29.5577)::GEOGRAPHY, 'Derech HaArava 1, Eilat',
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
-- Mike: near Haifa, heading to Tel Aviv (booked for shipment 3)
(
    'b1111111-1111-1111-1111-111111111111',
    false,
    ST_Point(34.9896, 32.7940)::GEOGRAPHY, 'Haifa',
    ST_Point(34.7818, 32.0853)::GEOGRAPHY, 'Tel Aviv',
    0, 'dry van',
    now(), now() + INTERVAL '2 days'
),
-- Sarah: near Herzliya, currently hauling (in_transit for shipment 4)
(
    'b2222222-2222-2222-2222-222222222222',
    false,
    ST_Point(34.8447, 32.1629)::GEOGRAPHY, 'Herzliya (en route)',
    ST_Point(34.6553, 31.8044)::GEOGRAPHY, 'Ashdod',
    0, 'refrigerated',
    now(), now() + INTERVAL '1 day'
),
-- Dan: available near Jerusalem, big rig
(
    'b3333333-3333-3333-3333-333333333333',
    true,
    ST_Point(35.2137, 31.7683)::GEOGRAPHY, 'Jerusalem',
    NULL, NULL,
    24, 'dry van',
    now(), now() + INTERVAL '7 days'
);

-- ============================================================
-- 4. Trucker GPS locations
-- ============================================================

INSERT INTO public.trucker_locations (trucker_id, location, heading, speed_kmh, accuracy_meters, last_updated) VALUES
('b1111111-1111-1111-1111-111111111111', ST_Point(34.9896, 32.7940)::GEOGRAPHY, 200.0, 0.0, 10.0, now()),
('b2222222-2222-2222-2222-222222222222', ST_Point(34.8447, 32.1629)::GEOGRAPHY, 180.0, 85.0, 8.0, now() - INTERVAL '2 minutes'),
('b3333333-3333-3333-3333-333333333333', ST_Point(35.2137, 31.7683)::GEOGRAPHY, 0.0, 0.0, 15.0, now() - INTERVAL '10 minutes');

-- ============================================================
-- 5. Negotiations
-- ============================================================

-- Negotiation 1: On shipment 2 (Jerusalem -> Beer Sheva) between Acme and Dan, counter-offered
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by, expires_at, version
) VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
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
    'd1111111-1111-1111-1111-111111111111',
    'price_proposed', 'initiated', 'proposed', 1200.00,
    'a1111111-1111-1111-1111-111111111111',
    '{"version": 1}', now() - INTERVAL '3 hours'
),
(
    'e2222222-2222-2222-2222-222222222222',
    'd1111111-1111-1111-1111-111111111111',
    'price_proposed', 'proposed', 'counter_offered', 1600.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 2}', now() - INTERVAL '2 hours'
),
(
    'e3333333-3333-3333-3333-333333333333',
    'd1111111-1111-1111-1111-111111111111',
    'price_proposed', 'counter_offered', 'counter_offered', 1500.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 3}', now() - INTERVAL '30 minutes'
);

-- Correct: Acme proposed 1200, Dan countered 1600, Acme countered 1400, Dan countered 1500.
UPDATE public.negotiation_events SET price = 1400.00, actor_id = 'a1111111-1111-1111-1111-111111111111'
WHERE id = 'e3333333-3333-3333-3333-333333333333';

INSERT INTO public.negotiation_events (id, negotiation_id, event_type, from_status, to_status, price, actor_id, metadata, created_at) VALUES
(
    'e4444444-4444-4444-4444-444444444444',
    'd1111111-1111-1111-1111-111111111111',
    'price_proposed', 'counter_offered', 'counter_offered', 1500.00,
    'b3333333-3333-3333-3333-333333333333',
    '{"version": 4}', now() - INTERVAL '10 minutes'
);

-- Negotiation 2: On shipment 3 (Haifa -> Tel Aviv) between SwiftShip and Mike, accepted
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by,
    accepted_at, version
) VALUES (
    'd2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
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
    'd2222222-2222-2222-2222-222222222222',
    'price_proposed', 'initiated', 'proposed', 900.00,
    'a2222222-2222-2222-2222-222222222222',
    now() - INTERVAL '8 hours'
),
(
    'd2222222-2222-2222-2222-222222222222',
    'price_proposed', 'proposed', 'counter_offered', 950.00,
    'b1111111-1111-1111-1111-111111111111',
    now() - INTERVAL '7 hours'
),
(
    'd2222222-2222-2222-2222-222222222222',
    'offer_accepted', 'counter_offered', 'accepted', 950.00,
    'a2222222-2222-2222-2222-222222222222',
    now() - INTERVAL '6 hours'
);

-- Negotiation 3: On shipment 4 (Netanya -> Ashdod) between Acme and Sarah, accepted
INSERT INTO public.negotiations (
    id, shipment_id, company_id, trucker_id,
    status, current_price, proposed_by,
    accepted_at, version
) VALUES (
    'd3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
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
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Hi Dan, we have a shipment from Jerusalem to Beer Sheva. Can you do it for 1,200 ILS?',
    'text', NULL, true, now() - INTERVAL '3 hours 5 minutes'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Proposed price: $1200.00',
    'negotiation_action', 'e1111111-1111-1111-1111-111111111111', true, now() - INTERVAL '3 hours'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Hey! I am in the area but 1,200 is too low for that route. How about 1,600?',
    'text', NULL, true, now() - INTERVAL '2 hours 5 minutes'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Proposed price: $1600.00',
    'negotiation_action', 'e2222222-2222-2222-2222-222222222222', true, now() - INTERVAL '2 hours'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'That is a bit high for us. We can stretch to 1,400. The load is straightforward.',
    'text', NULL, true, now() - INTERVAL '35 minutes'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Proposed price: $1400.00',
    'negotiation_action', 'e3333333-3333-3333-3333-333333333333', true, now() - INTERVAL '30 minutes'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Meet in the middle at 1,500? I can pick up first thing Thursday.',
    'text', NULL, false, now() - INTERVAL '12 minutes'
),
(
    'd1111111-1111-1111-1111-111111111111',
    'b3333333-3333-3333-3333-333333333333',
    'Proposed price: $1500.00',
    'negotiation_action', 'e4444444-4444-4444-4444-444444444444', false, now() - INTERVAL '10 minutes'
);
