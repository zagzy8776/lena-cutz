import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const sql = neon(url);

async function migrate() {
  console.log('Running Lena Cutz Neon migrations...');

  await sql`CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS salon_settings (
    id SERIAL PRIMARY KEY,
    salon_name TEXT NOT NULL DEFAULT 'Lena Cutz',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    mon_fri_hours TEXT NOT NULL DEFAULT '8:00 AM – 8:00 PM',
    sat_hours TEXT NOT NULL DEFAULT '8:00 AM – 9:00 PM',
    sun_hours TEXT NOT NULL DEFAULT '12:00 PM – 6:00 PM',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  // Existing databases may have been created by either the old SQL migration
  // or this script. These indexes make the live booking rule explicit.
  await sql`CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date)`;
  await sql`CREATE INDEX IF NOT EXISTS bookings_service_idx ON bookings (service_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_time_unique
            ON bookings (booking_date, booking_time)
            WHERE status IN ('pending', 'confirmed')`;

  await sql`INSERT INTO salon_settings (id, salon_name, phone, email, location, instagram, whatsapp, mon_fri_hours, sat_hours, sun_hours)
            VALUES (1, 'Lena Cutz', '+234 811 445 7181', 'juditheberechi274@gmail.com', 'Owerri, Imo State, Nigeria', 'https://instagram.com', 'https://wa.me/2348114457181', '8:00 AM – 8:00 PM', '8:00 AM – 9:00 PM', '12:00 PM – 6:00 PM')
            ON CONFLICT DO NOTHING`;

  console.log('✅ Database schema ready.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
