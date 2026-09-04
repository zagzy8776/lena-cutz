// Neon-backed API client — replaces Supabase
// All calls go to our Express server which connects securely to Neon PostgreSQL.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Auth token helpers
export function getToken(): string | null {
  return localStorage.getItem('lena_cutz_admin_token');
}
export function setToken(token: string) {
  localStorage.setItem('lena_cutz_admin_token', token);
}
export function clearToken() {
  localStorage.removeItem('lena_cutz_admin_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type Booking = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
};

export type BookingWithService = Booking & { services: Service | null };

export type SalonSettings = {
  id: number;
  salon_name: string;
  phone: string;
  email: string;
  location: string;
  instagram: string;
  whatsapp: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  mon_fri_hours: string;
  sat_hours: string;
  sun_hours: string;
  updated_at: string;
};

export type Session = { token: string; email: string };

// ── Auth ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }): Promise<{ session: Session }> => {
      const data = await request<Session>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      return { session: data };
    },
    signOut: () => {
      clearToken();
      return Promise.resolve();
    },
    getSession: (): { session: Session | null } => {
      const token = getToken();
      if (!token) return { session: null };
      // Basic expiry check
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          clearToken();
          return { session: null };
        }
        return { session: { token, email: payload.email } };
      } catch {
        return { session: null };
      }
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },

  // ── Services ────────────────────────────────────────────────────────────────
  services: {
    getPublic: () => request<Service[]>('/api/services'),
    getAll: () => request<Service[]>('/api/admin/services'),
    create: (data: Partial<Service>) =>
      request<Service>('/api/admin/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Service>) =>
      request<Service>(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/admin/services/${id}`, { method: 'DELETE' }),
  },

  // ── Bookings ─────────────────────────────────────────────────────────────────
  bookings: {
    create: (data: Partial<Booking>) =>
      request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
    getAll: () => request<BookingWithService[]>('/api/admin/bookings'),
    updateStatus: (id: string, status: BookingStatus) =>
      request<Booking>(`/api/admin/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  settings: {
    get: () => request<SalonSettings | null>('/api/settings'),
    update: (data: Partial<SalonSettings>) =>
      request<SalonSettings>('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // ── Overview ─────────────────────────────────────────────────────────────────
  overview: {
    get: () => request<Record<string, unknown>>('/api/admin/overview'),
  },

  // ── Health ───────────────────────────────────────────────────────────────────
  health: () => request<{ status: string; db: string }>('/api/health'),
};
