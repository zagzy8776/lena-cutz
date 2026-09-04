import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const app = express();
const httpServer = createServer(app);

// --- Config ---
const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'lena-cutz-dev-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'juditheberechi274@gmail.com';
// bcrypt hash of admin password. Generate with: node -e "import('bcryptjs').then(b=>b.default.hash('yourpassword',10).then(console.log))"
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
// Fallback plaintext password for development (remove in production)
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD_PLAIN || '';
const PORT = Number(process.env.PORT) || 3001;

if (!DB_URL) {
  console.error('ERROR: DATABASE_URL is not set in server/.env');
  process.exit(1);
}

const sql = neon(DB_URL);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: 'Wrong email or password. Please try again.' });
  }

  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    valid = password === ADMIN_PASSWORD_PLAIN;
  } else {
    return res.status(500).json({ error: 'Admin password not configured. Set ADMIN_PASSWORD_HASH in server/.env' });
  }

  if (!valid) return res.status(401).json({ error: 'Wrong email or password. Please try again.' });

  const token = jwt.sign({ email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, email: ADMIN_EMAIL });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  let valid = false;
  if (ADMIN_PASSWORD_HASH) {
    valid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    valid = currentPassword === ADMIN_PASSWORD_PLAIN;
  }
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

  const newHash = await bcrypt.hash(newPassword, 10);
  res.json({ 
    message: 'Password hash generated. Update ADMIN_PASSWORD_HASH in server/.env with this value:',
    hash: newHash
  });
});

// ============================================================
// SERVICES ROUTES
// ============================================================

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM services 
      WHERE is_active = true 
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// GET /api/admin/services (all, including inactive)
app.get('/api/admin/services', requireAuth, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM services ORDER BY sort_order ASC, created_at ASC`;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// POST /api/admin/services
app.post('/api/admin/services', requireAuth, async (req, res) => {
  const { name, description, duration_minutes, price, image_url, sort_order, is_active } = req.body;
  if (!name || !duration_minutes || price == null) {
    return res.status(400).json({ error: 'name, duration_minutes and price are required.' });
  }
  try {
    const rows = await sql`
      INSERT INTO services (name, description, duration_minutes, price, image_url, sort_order, is_active)
      VALUES (${name}, ${description || null}, ${duration_minutes}, ${price}, ${image_url || null}, ${sort_order || 0}, ${is_active !== false})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

// PATCH /api/admin/services/:id
app.patch('/api/admin/services/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, duration_minutes, price, image_url, sort_order, is_active } = req.body;
  try {
    const rows = await sql`
      UPDATE services SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        duration_minutes = COALESCE(${duration_minutes}, duration_minutes),
        price = COALESCE(${price}, price),
        image_url = COALESCE(${image_url}, image_url),
        sort_order = COALESCE(${sort_order}, sort_order),
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Service not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

// DELETE /api/admin/services/:id
app.delete('/api/admin/services/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM services WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete service.' });
  }
});

// ============================================================
// BOOKINGS ROUTES
// ============================================================

// POST /api/bookings (public - customer creates booking)
app.post('/api/bookings', async (req, res) => {
  const { service_id, customer_name, customer_phone, customer_email, booking_date, booking_time, notes } = req.body;
  if (!service_id || !customer_name || !customer_phone || !booking_date || !booking_time) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }
  try {
    const rows = await sql`
      INSERT INTO bookings (service_id, customer_name, customer_phone, customer_email, booking_date, booking_time, notes, status)
      VALUES (${service_id}, ${customer_name}, ${customer_phone}, ${customer_email || null}, ${booking_date}, ${booking_time}, ${notes || null}, 'pending')
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      SELECT b.*, 
             json_build_object('id', s.id, 'name', s.name, 'price', s.price, 'duration_minutes', s.duration_minutes) as services
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.booking_date DESC, b.booking_time ASC
    `;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// PATCH /api/admin/bookings/:id/status
app.patch('/api/admin/bookings/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    const rows = await sql`
      UPDATE bookings SET status = ${status} WHERE id = ${id} RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
});

// DELETE /api/admin/bookings/:id
app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

// ============================================================
// SALON SETTINGS ROUTES
// ============================================================

// GET /api/settings (public)
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM salon_settings LIMIT 1`;
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// PATCH /api/admin/settings
app.patch('/api/admin/settings', requireAuth, async (req, res) => {
  const fields = req.body;
  if (!fields || Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields provided.' });
  try {
    const existing = await sql`SELECT id FROM salon_settings LIMIT 1`;
    let rows;
    if (existing.length === 0) {
      rows = await sql`
        INSERT INTO salon_settings (salon_name, phone, email, location, instagram, whatsapp, bank_name, account_name, account_number, mon_fri_hours, sat_hours, sun_hours)
        VALUES (${fields.salon_name||''}, ${fields.phone||''}, ${fields.email||''}, ${fields.location||''}, ${fields.instagram||''}, ${fields.whatsapp||''}, ${fields.bank_name||null}, ${fields.account_name||null}, ${fields.account_number||null}, ${fields.mon_fri_hours||''}, ${fields.sat_hours||''}, ${fields.sun_hours||''})
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE salon_settings SET
          salon_name = COALESCE(${fields.salon_name}, salon_name),
          phone = COALESCE(${fields.phone}, phone),
          email = COALESCE(${fields.email}, email),
          location = COALESCE(${fields.location}, location),
          instagram = COALESCE(${fields.instagram}, instagram),
          whatsapp = COALESCE(${fields.whatsapp}, whatsapp),
          bank_name = COALESCE(${fields.bank_name}, bank_name),
          account_name = COALESCE(${fields.account_name}, account_name),
          account_number = COALESCE(${fields.account_number}, account_number),
          mon_fri_hours = COALESCE(${fields.mon_fri_hours}, mon_fri_hours),
          sat_hours = COALESCE(${fields.sat_hours}, sat_hours),
          sun_hours = COALESCE(${fields.sun_hours}, sun_hours),
          updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// ============================================================
// ADMIN OVERVIEW (stats)
// ============================================================
app.get('/api/admin/overview', requireAuth, async (req, res) => {
  try {
    const [bookingStats] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE booking_date = CURRENT_DATE) as today_count,
        COALESCE(SUM(s.price) FILTER (WHERE b.status = 'completed'), 0) as total_revenue
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
    `;
    const [serviceStats] = await sql`SELECT COUNT(*) as total FROM services WHERE is_active = true`;
    const recentBookings = await sql`
      SELECT b.*, 
             json_build_object('name', s.name, 'price', s.price) as services
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC LIMIT 5
    `;
    res.json({ ...bookingStats, total_services: serviceStats.total, recent_bookings: recentBookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch overview.' });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', provider: 'neon' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`✅ Lena Cutz API running on http://localhost:${PORT}`);
  console.log(`   Database: Neon PostgreSQL`);
});
