import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const sql = neon(url);

async function migrate() {
  console.log('Running Lena Cutz Neon migrations...');

  await sql`CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30, price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL`;

  await sql`CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, customer_email TEXT,
    booking_date DATE NOT NULL, booking_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
    notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS salon_settings (
    id SERIAL PRIMARY KEY, salon_name TEXT NOT NULL DEFAULT 'Lena Cutz', phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '', bank_name TEXT, account_name TEXT, account_number TEXT,
    mon_fri_hours TEXT NOT NULL DEFAULT '8:00 AM – 8:00 PM', sat_hours TEXT NOT NULL DEFAULT '8:00 AM – 9:00 PM',
    sun_hours TEXT NOT NULL DEFAULT '12:00 PM – 6:00 PM', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), email TEXT NOT NULL, password_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date)`;
  await sql`CREATE INDEX IF NOT EXISTS bookings_service_idx ON bookings (service_id)`;
  await sql`CREATE INDEX IF NOT EXISTS services_category_idx ON services (category_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS bookings_date_time_unique ON bookings (booking_date, booking_time) WHERE status IN ('pending','confirmed')`;

  await sql`INSERT INTO salon_settings (id, salon_name, phone, email, location, instagram, whatsapp, mon_fri_hours, sat_hours, sun_hours)
            VALUES (1, 'Lena Cutz', '+234 811 445 7181', 'juditheberechi274@gmail.com', 'Owerri, Imo State, Nigeria', 'https://instagram.com', 'https://wa.me/2348114457181', '8:00 AM – 8:00 PM', '8:00 AM – 9:00 PM', '12:00 PM – 6:00 PM') ON CONFLICT DO NOTHING`;

  const existingCategory = await sql`SELECT id FROM categories WHERE LOWER(name) = 'haircuts' LIMIT 1`;
  if (!existingCategory.length) {
    await sql`INSERT INTO categories (name) VALUES ('Haircuts') ON CONFLICT DO NOTHING`;
  }
  const [haircuts] = await sql`SELECT id FROM categories WHERE LOWER(name) = 'haircuts' LIMIT 1`;

  const existingServices = await sql`SELECT id FROM services LIMIT 1`;
  if (!existingServices.length) {
    await sql`
      INSERT INTO services (name, description, duration_minutes, price, image_url, sort_order, is_active, category_id)
      VALUES
        ('Low Cut', 'A clean, timeless low cut finished with sharp edges.', 30, 2000, 'https://images.pexels.com/photos/7447151/pexels-photo-7447151.jpeg?auto=compress&cs=tinysrgb&w=800', 1, true, ${haircuts.id}),
        ('High Fade', 'A bold high fade with a clean blend and crisp finish.', 45, 3000, 'https://images.pexels.com/photos/12464841/pexels-photo-12464841.jpeg?auto=compress&cs=tinysrgb&w=800', 2, true, ${haircuts.id}),
        ('Buzz Cut', 'A neat, low-maintenance buzz cut with an even finish.', 25, 1800, 'https://images.pexels.com/photos/4625632/pexels-photo-4625632.jpeg?auto=compress&cs=tinysrgb&w=800', 3, true, ${haircuts.id}),
        ('Taper Fade', 'A smooth taper fade blended around the sides and neckline.', 45, 3000, 'https://images.pexels.com/photos/12464840/pexels-photo-12464840.jpeg?auto=compress&cs=tinysrgb&w=800', 4, true, ${haircuts.id}),
        ('3 Step', 'A detailed three-step cut for a sharper, more defined look.', 50, 3500, 'https://images.pexels.com/photos/9971240/pexels-photo-9971240.jpeg?auto=compress&cs=tinysrgb&w=800', 5, true, ${haircuts.id})
    `;
    console.log('✅ Default services seeded');
  } else {
    await sql`UPDATE services SET category_id = ${haircuts.id} WHERE category_id IS NULL`;
  }

  const existingAdmin = await sql`SELECT id FROM admin_credentials WHERE id = 1 LIMIT 1`;
  if (!existingAdmin.length) {
    const initialHash = process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD_PLAIN ? await bcrypt.hash(process.env.ADMIN_PASSWORD_PLAIN, 10) : '');
    if (initialHash) {
      await sql`INSERT INTO admin_credentials (id, email, password_hash) VALUES (1, ${process.env.ADMIN_EMAIL || 'juditheberechi274@gmail.com'}, ${initialHash}) ON CONFLICT (id) DO NOTHING`;
      console.log('✅ Admin credentials seeded from environment');
    } else {
      console.warn('⚠️ Admin credentials not seeded: set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD_PLAIN');
    }
  }

  console.log('✅ Database schema ready.');
}

migrate().catch((err) => { console.error('Migration failed:', err); process.exit(1); });
