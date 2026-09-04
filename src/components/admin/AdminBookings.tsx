import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  Filter,
  Trash2,
} from 'lucide-react';
import { supabase, type Booking, type Service } from '@/lib/supabase';
import { formatPrice, formatDate, formatTime, formatDateShort } from '@/lib/constants';

type BookingWithService = Booking & { services: Service | null };

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithService | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, services(*)')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true });
    setBookings((data as unknown as BookingWithService[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as Booking['status'] } : b))
      );
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status: status as Booking['status'] });
      }
    }
    setUpdating(null);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking permanently? This cannot be undone.')) return;
    setUpdating(id);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBooking?.id === id) setSelectedBooking(null);
    }
    setUpdating(null);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'all', count: bookings.length },
    { label: 'Pending', value: 'pending', count: bookings.filter((b) => b.status === 'pending').length },
    { label: 'Confirmed', value: 'confirmed', count: bookings.filter((b) => b.status === 'confirmed').length },
    { label: 'Completed', value: 'completed', count: bookings.filter((b) => b.status === 'completed').length },
    { label: 'Cancelled', value: 'cancelled', count: bookings.filter((b) => b.status === 'cancelled').length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-ink-50">Bookings</h2>
        <p className="mt-1 text-ink-400">Manage all customer appointments</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? 'bg-gold-500 text-ink-950'
                : 'border border-ink-600 text-ink-300 hover:border-gold-500/40 hover:text-gold-400'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              filter === tab.value ? 'bg-ink-950/20 text-ink-950' : 'bg-ink-800 text-ink-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink-700 bg-ink-900 py-16 text-center">
          <Filter className="mx-auto mb-3 h-8 w-8 text-ink-600" />
          <p className="text-ink-400">No {filter !== 'all' ? filter + ' ' : ''}bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-ink-700 bg-ink-900 p-5 transition-all duration-300 hover:border-ink-600"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: customer info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500/10">
                    <Calendar className="h-5 w-5 text-gold-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-50">{b.customer_name}</h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-ink-400">
                      {b.services?.name || 'Service'} • {formatPrice(Number(b.services?.price || 0))}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatDateShort(b.booking_date)} at {formatTime(b.booking_time)}
                    </p>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {b.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(b.id, 'confirmed')}
                      disabled={updating === b.id}
                      className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Accept
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(b.id, 'completed')}
                      disabled={updating === b.id}
                      className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Complete
                    </button>
                  )}
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button
                      onClick={() => updateStatus(b.id, 'cancelled')}
                      disabled={updating === b.id}
                      className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )}
                  {b.status === 'cancelled' && (
                    <button
                      onClick={() => updateStatus(b.id, 'pending')}
                      disabled={updating === b.id}
                      className="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-4 py-2 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-1.5 rounded-full border border-ink-600 px-4 py-2 text-xs font-semibold text-ink-200 transition-colors hover:border-gold-500 hover:text-gold-400"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => deleteBooking(b.id)}
                    disabled={updating === b.id}
                    className="flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 px-5 py-8"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl text-ink-50">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-ink-400 hover:text-ink-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <DetailRow icon={Calendar} label="Service" value={selectedBooking.services?.name || '—'} />
              <DetailRow icon={Calendar} label="Date" value={formatDate(selectedBooking.booking_date)} />
              <DetailRow icon={Clock} label="Time" value={formatTime(selectedBooking.booking_time)} />
              <DetailRow icon={Clock} label="Price" value={formatPrice(Number(selectedBooking.services?.price || 0))} />
              <div className="border-t border-ink-700 pt-4">
                <DetailRow icon={Phone} label="Phone" value={selectedBooking.customer_phone} />
                {selectedBooking.customer_email && (
                  <DetailRow icon={Mail} label="Email" value={selectedBooking.customer_email} />
                )}
                <DetailRow icon={Clock} label="Booked on" value={formatDateShort(selectedBooking.created_at)} />
              </div>
              {selectedBooking.notes && (
                <div className="border-t border-ink-700 pt-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-ink-400">
                    <MessageSquare className="h-4 w-4 text-gold-500" />
                    Notes
                  </div>
                  <p className="rounded-xl border border-ink-700 bg-ink-950 p-3 text-sm text-ink-200">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
              <div className="border-t border-ink-700 pt-4">
                <div className="mb-1 text-sm text-ink-400">Status</div>
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              {selectedBooking.status !== 'confirmed' && selectedBooking.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                  disabled={updating === selectedBooking.id}
                  className="btn-gold flex-1 !py-2.5"
                >
                  Accept
                </button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus(selectedBooking.id, 'completed')}
                  disabled={updating === selectedBooking.id}
                  className="btn-gold flex-1 !py-2.5"
                >
                  Mark Complete
                </button>
              )}
              <a
                href={`tel:${selectedBooking.customer_phone}`}
                className="btn-outline flex-1 !py-2.5"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </div>
          </div>
        </div>
      )}
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

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-ink-400">
        <Icon className="h-4 w-4 text-gold-500" />
        {label}
      </span>
      <span className="text-sm font-medium text-ink-100">{value}</span>
    </div>
  );
}
