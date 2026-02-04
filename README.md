# FreightMatch

A full-stack, mobile-responsive logistics marketplace connecting **Shippers** (companies with inventory) and **Carriers** (truck drivers). Built with Next.js, Supabase, and React-Leaflet.

## Features

- **Role-based Auth** — Companies and Truckers sign up with distinct dashboards and permissions
- **Shipment Posting** — Companies create delivery requests with pallet counts, map-picked locations, dates, and budget ranges
- **Trucker Availability** — Carriers toggle availability, set capacity, vehicle type, and destination
- **Live Map** — Interactive map showing active truckers in real-time with geospatial queries (PostGIS)
- **Negotiation Engine** — State machine for price proposals, counter-offers, and acceptance with race-condition prevention
- **Real-time Chat** — Messaging between parties with embedded negotiation actions
- **Mobile-first Design** — Bottom navigation, 44px touch targets, iOS safe areas, PWA-ready

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + PostGIS, Auth, Realtime, RLS) |
| Map | React-Leaflet with OpenStreetMap tiles |
| Real-time | Supabase Realtime (Broadcast for map, Postgres Changes for chat) |

## Prerequisites

- **Node.js 20 LTS** or higher
- A [Supabase](https://supabase.com) project (free tier works)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ZviArono/freight-match.git
cd freight-match
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your [Supabase dashboard](https://supabase.com/dashboard/project/_/settings/api).

### 3. Set up the database

Run the SQL migration files **in order** in the Supabase SQL Editor:

```
supabase/migrations/00001_enable_extensions.sql
supabase/migrations/00002_create_profiles.sql
supabase/migrations/00003_create_shipments.sql
supabase/migrations/00004_create_trucker_availability.sql
supabase/migrations/00005_create_trucker_locations.sql
supabase/migrations/00006_create_negotiations.sql
supabase/migrations/00007_create_messages.sql
supabase/migrations/00008_create_rls_policies.sql
supabase/migrations/00009_create_rpc_functions.sql
supabase/migrations/00010_create_indexes.sql
```

Optionally load test data:

```
supabase/seed.sql
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (company)/        # Company dashboard, shipments, live map
│   ├── (trucker)/        # Trucker dashboard, jobs, availability
│   ├── (shared)/         # Chat, profile (both roles)
│   └── api/auth/         # Supabase auth callback
├── components/
│   ├── ui/               # Button, Input, Card, Badge, Modal, Select, Spinner
│   ├── map/              # MapContainer, DynamicMap, LocationPicker, TruckMarker
│   ├── shipment/         # ShipmentForm, ShipmentCard
│   ├── negotiation/      # NegotiationPanel, PriceProposal, History, Actions
│   ├── chat/             # ChatWindow, ChatMessage, ChatInput
│   └── layout/           # Header, BottomNav, RoleGuard
├── hooks/                # useAuth, useChat, useNegotiation, useGeolocation, etc.
├── lib/                  # Supabase clients, geo utilities, helpers
├── providers/            # AuthProvider, LocationProvider
└── types/                # TypeScript type definitions

supabase/
├── migrations/           # 10 SQL migration files
└── seed.sql              # Test data
```

## Database Schema

```
profiles            → User accounts (company or trucker role)
shipments           → Delivery requests with PostGIS locations
trucker_availability → Trucker status, capacity, vehicle type
trucker_locations   → Real-time GPS positions (updated every 60s)
negotiations        → Price negotiation state machine
negotiation_events  → Immutable audit log of all state changes
messages            → Chat messages linked to negotiations
```

## Key Architecture Decisions

**Negotiation State Machine** — All price changes go through PostgreSQL RPC functions with `FOR UPDATE` row locks. The `accept_offer` function requires an `expected_price` parameter that must match the current price, preventing the "price flip" race condition where both parties accept different prices simultaneously.

**Dual-frequency Location Updates** — Trucker positions are broadcast via Supabase Realtime every 5 seconds for smooth map animation, but only persisted to the database every 60 seconds to avoid write overhead.

**Geospatial Queries** — `ST_DWithin` with GiST spatial indexes for radius searches. `ST_Intersects` with `ST_MakeEnvelope` for map viewport bounding-box queries. All PostGIS writes go through RPC functions since the Supabase JS client cannot construct `ST_Point()` literals directly.

**SSR-safe Map** — Leaflet crashes in server-side rendering. `MapContainer.tsx` uses `next/dynamic({ ssr: false })` to load the actual map component only on the client.

## Negotiation Flow

```
INITIATED → PROPOSED → COUNTER_OFFERED → ACCEPTED
                ↓              ↓
            REJECTED       REJECTED
```

- Either party can make the first proposal
- Only the **recipient** of the last offer can accept or counter
- The last proposer must wait for a response
- Price-flip prevention: acceptance validates the expected price matches the current price

## License

MIT
