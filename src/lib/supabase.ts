import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
  },
});

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

export type BookingWithService = Booking & {
  service: Service | null;
};

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
