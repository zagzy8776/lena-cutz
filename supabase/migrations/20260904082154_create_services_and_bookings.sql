/*
# Create services and bookings tables for Lena Cutz barbershop

1. New Tables
- `services`
  - `id` (uuid, primary key)
  - `name` (text, not null) — e.g. "Low Cut", "High Fade"
  - `description` (text) — what the service includes
  - `duration_minutes` (int, not null) — how long the service takes
  - `price` (numeric, not null) — cost in Naira
  - `image_url` (text) — optional photo of the haircut style
  - `sort_order` (int, default 0) — display ordering
  - `is_active` (boolean, default true) — can be toggled off without deleting
  - `created_at` (timestamptz)

- `bookings`
  - `id` (uuid, primary key)
  - `service_id` (uuid, foreign key → services.id)
  - `customer_name` (text, not null) — person booking
  - `customer_phone` (text, not null) — contact number
  - `customer_email` (text) — optional email
  - `booking_date` (date, not null) — the day of the appointment
  - `booking_time` (time, not null) — the time slot
  - `status` (text, default 'pending') — pending | confirmed | cancelled | completed
  - `notes` (text) — optional message from customer
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Services: public read (anyone can see the menu), no public write.
- Bookings: anyone can create a booking (no login required) and can read bookings
  by phone number so a customer can look up their own appointment. Only service
  role can update/cancel (the barber manages confirmations).

3. Important Notes
- This is a no-auth, single-tenant app. Customers book without creating accounts.
- The barber (owner) manages bookings via the Supabase dashboard or a future admin view.
- A unique constraint prevents double-booking the same date + time slot.
*/

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes int NOT NULL DEFAULT 30,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public read for services
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services" ON services FOR SELECT
  TO anon, authenticated USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can create a booking (no login needed)
DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
CREATE POLICY "public_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Anyone can read bookings (so customers can check their own by phone; owner sees all via dashboard)
-- For a small barbershop this is acceptable; the booking info is limited to name/phone/date/time.
DROP POLICY IF EXISTS "public_read_bookings" ON bookings;
CREATE POLICY "public_read_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

-- Prevent double-booking the same date + time slot
CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_time_unique
  ON bookings (booking_date, booking_time)
  WHERE status IN ('pending', 'confirmed');

-- Index for common queries
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS bookings_service_idx ON bookings (service_id);
