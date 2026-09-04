import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Running Neon migrations...');

  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✅ services table ready');

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
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
    )
  `;
  console.log('✅ bookings table ready');

  await sql`
    CREATE TABLE IF NOT EXISTS salon_settings (
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
      mon_fri_hours TEXT NOT NULL DEFAULT '9:00 AM - 6:00 PM',
      sat_hours TEXT NOT NULL DEFAULT '10:00 AM - 4:00 PM',
      sun_hours TEXT NOT NULL DEFAULT 'Closed',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✅ salon_settings table ready');

  console.log('\n🎉 All migrations applied successfully!');
  console.log('Database: Neon PostgreSQL');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
