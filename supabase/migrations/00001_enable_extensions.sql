-- 00001_enable_extensions.sql
-- Enable required PostgreSQL extensions for the logistics marketplace.

-- uuid-ossp: Provides UUID generation functions (uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- postgis: Provides geographic data types and spatial query functions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
