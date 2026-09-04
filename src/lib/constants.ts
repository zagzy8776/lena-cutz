import type { SalonSettings } from '@/lib/supabase';

export const DEFAULT_SETTINGS: SalonSettings = {
  id: 1,
  salon_name: 'Lena Cutz',
  phone: '+234 811 445 7181',
  email: 'juditheberechi274@gmail.com',
  location: 'Owerri, Imo State, Nigeria',
  instagram: 'https://instagram.com',
  whatsapp: 'https://wa.me/2348114457181',
  bank_name: '',
  account_name: '',
  account_number: '',
  mon_fri_hours: '8:00 AM – 8:00 PM',
  sat_hours: '8:00 AM – 9:00 PM',
  sun_hours: '12:00 PM – 6:00 PM',
  updated_at: '',
};

export function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];
