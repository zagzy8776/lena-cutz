/*
# Add salon_settings table + auth-scoped policies on services/bookings

1. New Tables
- `salon_settings` (single row, the owner's configurable settings)
  - `id` (int, primary key, always 1)
  - `salon_name` (text) — display name
  - `phone` (text) — contact phone
  - `email` (text) — contact email
  - `location` (text) — physical address text
  - `instagram` (text) — Instagram URL
  - `whatsapp` (text) — WhatsApp link
  - `bank_name` (text) — bank for transfers
  - `account_name` (text) — account holder name
  - `account_number` (text) — account number
  - `mon_fri_hours` (text) — Mon–Fri opening hours label
  - `sat_hours` (text) — Saturday hours label
  - `sun_hours` (text) — Sunday hours label
  - `updated_at` (timestamptz)

2. Security
- salon_settings: public read (customer site needs it), authenticated write (owner only).
- services: keep public read; add authenticated INSERT/UPDATE/DELETE so owner can manage.
- bookings: keep public read+insert; add authenticated UPDATE so owner can change status.

3. Important Notes
- The admin uses Supabase email/password auth. Lena signs in with her email + password.
- Only authenticated users can modify services, bookings, and settings.
- Customers (anon) can read settings + services, and create/read bookings.
*/

-- salon_settings table
CREATE TABLE IF NOT EXISTS salon_settings (
  id int PRIMARY KEY DEFAULT 1,
  salon_name text NOT NULL DEFAULT 'Lena Cutz',
  phone text NOT NULL DEFAULT '+234 811 445 7181',
  email text NOT NULL DEFAULT 'juditheberechi274@gmail.com',
  location text NOT NULL DEFAULT 'Owerri, Imo State, Nigeria',
  instagram text NOT NULL DEFAULT 'https://instagram.com',
  whatsapp text NOT NULL DEFAULT 'https://wa.me/2348114457181',
  bank_name text DEFAULT '',
  account_name text DEFAULT '',
  account_number text DEFAULT '',
  mon_fri_hours text NOT NULL DEFAULT '8:00 AM – 8:00 PM',
  sat_hours text NOT NULL DEFAULT '8:00 AM – 9:00 PM',
  sun_hours text NOT NULL DEFAULT '12:00 PM – 6:00 PM',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

-- Public read for salon_settings
DROP POLICY IF EXISTS "public_read_settings" ON salon_settings;
CREATE POLICY "public_read_settings" ON salon_settings FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated write for salon_settings
DROP POLICY IF EXISTS "auth_update_settings" ON salon_settings;
CREATE POLICY "auth_update_settings" ON salon_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Seed the single row
INSERT INTO salon_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Add authenticated INSERT/UPDATE/DELETE on services
DROP POLICY IF EXISTS "auth_insert_services" ON services;
CREATE POLICY "auth_insert_services" ON services FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_services" ON services;
CREATE POLICY "auth_update_services" ON services FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_services" ON services;
CREATE POLICY "auth_delete_services" ON services FOR DELETE
  TO authenticated USING (true);

-- Add authenticated UPDATE on bookings (owner changes status)
DROP POLICY IF EXISTS "auth_update_bookings" ON bookings;
CREATE POLICY "auth_update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Add authenticated DELETE on bookings
DROP POLICY IF EXISTS "auth_delete_bookings" ON bookings;
CREATE POLICY "auth_delete_bookings" ON bookings FOR DELETE
  TO authenticated USING (true);
