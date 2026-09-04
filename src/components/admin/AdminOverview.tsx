import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  DollarSign,
  Scissors,
  Loader2,
} from 'lucide-react';
import { supabase, type Booking, type Service } from '@/lib/supabase';
import { formatPrice, formatDateShort, formatTime } from '@/lib/constants';

type BookingWithServiceName = Booking & { services: Service | null };

export default function AdminOverview() {
  const [bookings, setBookings] = useState<BookingWithServiceName[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, services(*)')
        .order('created_at', { ascending: false });

      const { data: serviceData } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      setBookings((bookingData as unknown as BookingWithServiceName[]) || []);
      setServices(serviceData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const pending = bookings.filter((b) => b.status === 'pending');
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const completed = bookings.filter((b) => b.status === 'completed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');
  const todaysBookings = bookings.filter((b) => b.booking_date === todayStr);
  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && b.booking_date >= todayStr)
    .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time));

  const revenue = completed.reduce((sum, b) => {
    const svc = b.services;
    return sum + (svc ? Number(svc.price) : 0);
  }, 0);

  const pendingRevenue = confirmed.reduce((sum, b) => {
    const svc = b.services;
    return sum + (svc ? Number(svc.price) : 0);
  }, 0);

  // Service popularity
  const serviceCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const name = b.services?.name || 'Unknown';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });
  const popularServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = Math.max(...Object.values(serviceCounts), 1);

  const stats = [
    {
      label: "Today's Bookings",
      value: todaysBookings.length,
      icon: Calendar,
      color: 'text-gold-500',
    },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-accent-500' },
    { label: 'Confirmed', value: confirmed.length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Completed', value: completed.length, icon: Users, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-ink-50">Dashboard</h2>
        <p className="mt-1 text-ink-400">Overview of your barbershop activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-ink-700 bg-ink-900 p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className="font-display text-3xl font-bold text-ink-50">{stat.value}</span>
            </div>
            <p className="mt-2 text-sm text-ink-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-ink-400">Completed Revenue</p>
              <p className="font-display text-2xl font-bold text-ink-50">{formatPrice(revenue)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10">
              <TrendingUp className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <p className="text-sm text-ink-400">Pending Revenue (confirmed)</p>
              <p className="font-display text-2xl font-bold text-ink-50">{formatPrice(pendingRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-xl text-ink-50">
            <Calendar className="h-5 w-5 text-gold-500" />
            Upcoming Appointments
          </h3>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">No upcoming confirmed appointments.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-950 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10">
                      <Scissors className="h-4 w-4 text-gold-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-100">{b.customer_name}</p>
                      <p className="text-xs text-ink-400">
                        {b.services?.name || 'Service'} • {formatDateShort(b.booking_date)} at {formatTime(b.booking_time)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular services */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-xl text-ink-50">
            <TrendingUp className="h-5 w-5 text-gold-500" />
            Most Booked Services
          </h3>
          {popularServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {popularServices.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink-200">{name}</span>
                    <span className="font-medium text-ink-400">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-gold-500 transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
        <h3 className="mb-4 font-display text-xl text-ink-50">Recent Bookings</h3>
        {bookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-ink-400">
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 8).map((b) => (
                  <tr key={b.id} className="border-b border-ink-700/50">
                    <td className="py-3 pr-4 text-ink-100">{b.customer_name}</td>
                    <td className="py-3 pr-4 text-ink-300">{b.services?.name || '—'}</td>
                    <td className="py-3 pr-4 text-ink-300">{formatDateShort(b.booking_date)}</td>
                    <td className="py-3 pr-4 text-ink-300">{formatTime(b.booking_time)}</td>
                    <td className="py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary counts */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm">
          <Clock className="h-4 w-4 text-accent-500" />
          <span className="text-ink-300">{pending.length} pending</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-ink-300">{confirmed.length} confirmed</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="text-ink-300">{completed.length} completed</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-ink-300">{cancelled.length} cancelled</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-accent-500/10 text-accent-400',
    confirmed: 'bg-green-500/10 text-green-400',
    completed: 'bg-blue-500/10 text-blue-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || ''}`}>
      {status}
    </span>
  );
}
