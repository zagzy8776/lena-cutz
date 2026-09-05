import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';

const app = express();
const httpServer = createServer(app);

const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'lena-cutz-dev-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'juditheberechi274@gmail.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD_PLAIN || '';
const PORT = Number(process.env.PORT) || 3001;

if (!DB_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(DB_URL);

// Allow local development and configured production frontends. When the API is
// served from the same origin, no CORS header is needed, but permissive defaults
// here keep the separate Vite + Express deployment usable.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', provider: 'neon' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error', db: 'disconnected', error: 'Database unavailable' });
  }
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return res.status(401).json({ error: 'Wrong email or password. Please try again.' });

  let valid = false;
  if (ADMIN_PASSWORD_HASH) valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  else if (ADMIN_PASSWORD_PLAIN) valid = password === ADMIN_PASSWORD_PLAIN;
  else return res.status(500).json({ error: 'Admin password is not configured.' });

  if (!valid) return res.status(401).json({ error: 'Wrong email or password. Please try again.' });
  const token = jwt.sign({ email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, email: ADMIN_EMAIL });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  let valid = false;
  if (ADMIN_PASSWORD_HASH) valid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);
  else if (ADMIN_PASSWORD_PLAIN) valid = currentPassword === ADMIN_PASSWORD_PLAIN;
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(newPassword, 10);
  res.json({
    message: 'Password hash generated. Replace ADMIN_PASSWORD_HASH in the server environment.',
    hash,
  });
});

// SERVICES
app.get('/api/services', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM services WHERE is_active = true ORDER BY sort_order ASC, created_at ASC`;
    res.json(rows);
  } catch (err) {
    console.error('Public services failed:', err);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

app.get('/api/admin/services', requireAuth, async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM services ORDER BY sort_order ASC, created_at ASC`;
    res.json(rows);
  } catch (err) {
    console.error('Admin services failed:', err);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

app.post('/api/admin/services', requireAuth, async (req, res) => {
  const { name, description, duration_minutes, price, image_url, sort_order, is_active } = req.body || {};
  const duration = Number(duration_minutes);
  const amount = Number(price);
  if (!String(name || '').trim() || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: 'name, duration_minutes and a valid price are required.' });
  }
  try {
    const rows = await sql`
      INSERT INTO services (name, description, duration_minutes, price, image_url, sort_order, is_active)
      VALUES (${String(name).trim()}, ${description ? String(description).trim() : null}, ${duration}, ${amount}, ${image_url || null}, ${Number(sort_order) || 0}, ${is_active !== false})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create service failed:', err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

app.patch('/api/admin/services/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const name = body.name === undefined ? null : String(body.name).trim();
    const description = body.description === undefined ? null : (body.description === '' ? null : String(body.description).trim());
    const duration = body.duration_minutes === undefined ? null : Number(body.duration_minutes);
    const price = body.price === undefined ? null : Number(body.price);
    const imageUrl = body.image_url === undefined ? null : body.image_url;
    const sortOrder = body.sort_order === undefined ? null : Number(body.sort_order);
    const active = body.is_active === undefined ? null : Boolean(body.is_active);

    if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) return res.status(400).json({ error: 'Duration must be a positive number.' });
    if (price !== null && (!Number.isFinite(price) || price < 0)) return res.status(400).json({ error: 'Price must be a valid non-negative number.' });

    const rows = await sql`
      UPDATE services SET
        name = COALESCE(${name}, name),
        description = CASE WHEN ${body.description !== undefined} THEN ${description} ELSE description END,
        duration_minutes = COALESCE(${duration}, duration_minutes),
        price = COALESCE(${price}, price),
        image_url = CASE WHEN ${body.image_url !== undefined} THEN ${imageUrl} ELSE image_url END,
        sort_order = COALESCE(${sortOrder}, sort_order),
        is_active = COALESCE(${active}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows.length) return res.status(404).json({ error: 'Service not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update service failed:', err);
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

app.delete('/api/admin/services/:id', requireAuth, async (req, res) => {
  try {
    const rows = await sql`DELETE FROM services WHERE id = ${req.params.id} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Service not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete service failed:', err);
    res.status(500).json({ error: 'Failed to delete service.' });
  }
});

// AVAILABILITY
app.get('/api/availability', async (req, res) => {
  const date = String(req.query?.date || '').trim();
  const serviceId = String(req.query?.service_id || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  try {
    const rows = await sql`
      SELECT to_char(booking_time, 'HH24:MI') AS booking_time
      FROM bookings
      WHERE booking_date = ${date} AND status IN ('pending', 'confirmed')
      ${serviceId ? sql`AND service_id = ${serviceId}` : sql``}
    `;
    res.json({ date, booked_slots: rows.map((row) => row.booking_time) });
  } catch (err) {
    console.error('Availability failed:', err);
    res.status(500).json({ error: 'Failed to fetch availability.' });
  }
});

// BOOKINGS
app.post('/api/bookings', async (req, res) => {
  const { service_id, customer_name, customer_phone, customer_email, booking_date, booking_time, notes } = req.body || {};
  if (!service_id || !customer_name || !customer_phone || !booking_date || !booking_time) return res.status(400).json({ error: 'Missing required booking fields.' });
  try {
    const service = await sql`SELECT id, duration_minutes FROM services WHERE id = ${service_id} AND is_active = true LIMIT 1`;
    if (!service.length) return res.status(400).json({ error: 'Selected service is no longer available.' });

    const conflict = await sql`
      SELECT id FROM bookings
      WHERE booking_date = ${booking_date}
        AND booking_time = ${booking_time}
        AND status IN ('pending', 'confirmed')
      LIMIT 1
    `;
    if (conflict.length) return res.status(409).json({ error: 'That time has already been booked. Please choose another time.' });

    const rows = await sql`
      INSERT INTO bookings (service_id, customer_name, customer_phone, customer_email, booking_date, booking_time, notes, status)
      VALUES (${service_id}, ${String(customer_name).trim()}, ${String(customer_phone).trim()}, ${customer_email ? String(customer_email).trim() : null}, ${booking_date}, ${booking_time}, ${notes ? String(notes).trim() : null}, 'pending')
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create booking failed:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

app.get('/api/admin/bookings', requireAuth, async (_req, res) => {
  try {
    const rows = await sql`
      SELECT b.*, CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
        'id', s.id, 'name', s.name, 'price', s.price, 'duration_minutes', s.duration_minutes,
        'description', s.description, 'image_url', s.image_url, 'is_active', s.is_active,
        'sort_order', s.sort_order, 'created_at', s.created_at
      ) END AS services
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.booking_date DESC, b.booking_time ASC, b.created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error('Admin bookings failed:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

app.patch('/api/admin/bookings/:id/status', requireAuth, async (req, res) => {
  const status = req.body?.status;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    const rows = await sql`UPDATE bookings SET status = ${status} WHERE id = ${req.params.id} RETURNING *`;
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update booking failed:', err);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
});

app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  try {
    const rows = await sql`DELETE FROM bookings WHERE id = ${req.params.id} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete booking failed:', err);
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

// SETTINGS
app.get('/api/settings', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM salon_settings ORDER BY id ASC LIMIT 1`;
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Get settings failed:', err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

app.patch('/api/admin/settings', requireAuth, async (req, res) => {
  const fields = req.body || {};
  const allowed = ['salon_name', 'phone', 'email', 'location', 'instagram', 'whatsapp', 'bank_name', 'account_name', 'account_number', 'mon_fri_hours', 'sat_hours', 'sun_hours'];
  const clean = Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(clean).length) return res.status(400).json({ error: 'No valid fields provided.' });
  try {
    const existing = await sql`SELECT id FROM salon_settings ORDER BY id ASC LIMIT 1`;
    let rows;
    if (!existing.length) {
      rows = await sql`
        INSERT INTO salon_settings (salon_name, phone, email, location, instagram, whatsapp, bank_name, account_name, account_number, mon_fri_hours, sat_hours, sun_hours)
        VALUES (${clean.salon_name || 'Lena Cutz'}, ${clean.phone || ''}, ${clean.email || ''}, ${clean.location || ''}, ${clean.instagram || ''}, ${clean.whatsapp || ''}, ${clean.bank_name || null}, ${clean.account_name || null}, ${clean.account_number || null}, ${clean.mon_fri_hours || '8:00 AM – 8:00 PM'}, ${clean.sat_hours || '8:00 AM – 9:00 PM'}, ${clean.sun_hours || '12:00 PM – 6:00 PM'})
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE salon_settings SET
          salon_name = COALESCE(${clean.salon_name ?? null}, salon_name),
          phone = COALESCE(${clean.phone ?? null}, phone),
          email = COALESCE(${clean.email ?? null}, email),
          location = COALESCE(${clean.location ?? null}, location),
          instagram = COALESCE(${clean.instagram ?? null}, instagram),
          whatsapp = COALESCE(${clean.whatsapp ?? null}, whatsapp),
          bank_name = CASE WHEN ${Object.prototype.hasOwnProperty.call(clean, 'bank_name')} THEN ${clean.bank_name || null} ELSE bank_name END,
          account_name = CASE WHEN ${Object.prototype.hasOwnProperty.call(clean, 'account_name')} THEN ${clean.account_name || null} ELSE account_name END,
          account_number = CASE WHEN ${Object.prototype.hasOwnProperty.call(clean, 'account_number')} THEN ${clean.account_number || null} ELSE account_number END,
          mon_fri_hours = COALESCE(${clean.mon_fri_hours ?? null}, mon_fri_hours),
          sat_hours = COALESCE(${clean.sat_hours ?? null}, sat_hours),
          sun_hours = COALESCE(${clean.sun_hours ?? null}, sun_hours),
          updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Update settings failed:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// OVERVIEW
app.get('/api/admin/overview', requireAuth, async (_req, res) => {
  try {
    const [bookingStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
        COUNT(*) FILTER (WHERE booking_date = CURRENT_DATE) AS today_count,
        COALESCE(SUM(s.price) FILTER (WHERE b.status = 'completed'), 0) AS total_revenue
      FROM bookings b LEFT JOIN services s ON b.service_id = s.id
    `;
    const [serviceStats] = await sql`SELECT COUNT(*) FILTER (WHERE is_active = true) AS total FROM services`;
    const recentBookings = await sql`
      SELECT b.*, CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'name', s.name, 'price', s.price, 'duration_minutes', s.duration_minutes) END AS services
      FROM bookings b LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC LIMIT 8
    `;
    res.json({ ...bookingStats, total_services: serviceStats.total, recent_bookings: recentBookings });
  } catch (err) {
    console.error('Overview failed:', err);
    res.status(500).json({ error: 'Failed to fetch overview.' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`✅ Lena Cutz API listening on port ${PORT}`);
});
