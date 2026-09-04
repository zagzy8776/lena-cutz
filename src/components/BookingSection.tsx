import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scissors,
  User,
  Phone,
  Mail,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';
import { api, type Service, type Booking } from '@/lib/api';
import { TIME_SLOTS, formatTime, formatPrice, formatDate } from '@/lib/constants';

type Step = 'service' | 'datetime' | 'details' | 'confirm' | 'success';

export default function BookingSection() {
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.services.getPublic();
        setServices(data);
      } catch (err) {
        console.error(err);
      }
      setLoadingServices(false);
    };
    fetchServices();
  }, []);

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const fetchBookedSlots = async () => {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      // We don't expose a public endpoint for booked slots yet, so skip for now
      // This prevents double-booking visually — the server enforces it on submit
      setBookedSlots([]);
      setLoadingSlots(false);
    };
    fetchBookedSlots();
  }, [selectedDate]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    return days;
  }, [calendarMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateDisabled = (date: Date) => {
    return date < today;
  };

  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    if (bookedSlots.includes(time)) return;
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in your name and phone number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const dateStr = selectedDate.toISOString().split('T')[0];

    try {
      const data = await api.bookings.create({
        service_id: selectedService.id,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || null,
        booking_date: dateStr,
        booking_time: selectedTime,
        notes: notes.trim() || null,
      });
      setConfirmedBooking(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again or call us directly.');
      setSubmitting(false);
    }
    setSubmitting(false);
  };

  const resetBooking = () => {
    setStep('service');
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setError(null);
    setConfirmedBooking(null);
  };

  const stepNumber = { service: 1, datetime: 2, details: 3, confirm: 4 } as const;

  return (
    <section id="booking" className="relative bg-ink-950 py-24 sm:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">
            <span className="h-px w-8 bg-gold-500" />
            Book Appointment
            <span className="h-px w-8 bg-gold-500" />
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
            Reserve Your Chair
          </h2>
          <p className="mt-4 text-lg text-ink-400">
            Pick a service, choose your date and time, and we'll save your spot.
          </p>
        </div>

        {/* Progress indicator */}
        {step !== 'success' && (
          <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-2">
            {(['service', 'datetime', 'details', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    stepNumber[step] >= i + 1
                      ? 'bg-gold-500 text-ink-950'
                      : 'border border-ink-600 bg-ink-900 text-ink-500'
                  }`}
                >
                  {stepNumber[step] > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`h-px w-12 transition-all duration-300 ${
                      stepNumber[step] > i + 1 ? 'bg-gold-500' : 'bg-ink-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step: Service selection */}
        {step === 'service' && (
          <div className="mt-10">
            {loadingServices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {services.map((service, i) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group flex items-center justify-between rounded-2xl border border-ink-700 bg-ink-900 p-5 text-left transition-all duration-300 hover:border-gold-500/40 hover:bg-ink-800 animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink-50">{service.name}</h3>
                      <p className="mt-1 text-sm text-ink-400">{service.duration_minutes} min</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gold-500">{formatPrice(Number(service.price))}</div>
                      <div className="mt-1 text-xs text-ink-500 group-hover:text-gold-400 transition-colors">
                        Select →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Date & Time */}
        {step === 'datetime' && (
          <div className="mt-10 animate-fade-in">
            {/* Selected service summary */}
            <div className="mb-6 flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 px-5 py-3">
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-gold-500" />
                <div>
                  <span className="font-semibold text-ink-50">{selectedService?.name}</span>
                  <span className="ml-2 text-sm text-ink-400">
                    {formatPrice(Number(selectedService?.price))}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStep('service')}
                className="text-xs text-ink-400 hover:text-gold-400 transition-colors"
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Calendar */}
              <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition-colors hover:border-gold-500 hover:text-gold-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-display text-lg text-ink-50">{monthLabel}</span>
                  <button
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition-colors hover:border-gold-500 hover:text-gold-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day labels */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-ink-500">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, i) => {
                    if (!date) return <div key={i} />;
                    const disabled = isDateDisabled(date);
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(date)}
                        disabled={disabled}
                        className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                          disabled
                            ? 'cursor-not-allowed text-ink-700'
                            : isSelected
                            ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/20'
                            : 'text-ink-200 hover:bg-ink-800 hover:text-gold-400'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gold-500" />
                  <span className="font-display text-lg text-ink-50">
                    {selectedDate ? formatDate(selectedDate).split(',')[0] : 'Select a date'}
                  </span>
                </div>

                {!selectedDate ? (
                  <div className="flex h-48 items-center justify-center text-sm text-ink-500">
                    <Calendar className="mr-2 h-5 w-5" />
                    Pick a date to see available times
                  </div>
                ) : loadingSlots ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {TIME_SLOTS.map((time) => {
                        const isBooked = bookedSlots.includes(time);
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            disabled={isBooked}
                            className={`rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                              isBooked
                                ? 'cursor-not-allowed bg-ink-800 text-ink-600 line-through'
                                : isSelected
                                ? 'bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/20'
                                : 'border border-ink-600 text-ink-200 hover:border-gold-500/40 hover:text-gold-400'
                            }`}
                          >
                            {formatTime(time)}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTime && (
                      <button
                        onClick={() => setStep('details')}
                        className="btn-gold mt-6 w-full"
                      >
                        Continue
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="mx-auto mt-10 max-w-lg animate-fade-in">
            <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
              <h3 className="mb-6 font-display text-2xl text-ink-50">Your Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-300">
                    <User className="h-4 w-4 text-gold-500" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chidi Okafor"
                    className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-300">
                    <Phone className="h-4 w-4 text-gold-500" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0803 123 4567"
                    className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-300">
                    <Mail className="h-4 w-4 text-gold-500" />
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-300">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific style preferences?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('datetime')}
                  className="btn-outline flex-1"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!name.trim() || !phone.trim()) {
                      setError('Please fill in your name and phone number.');
                      return;
                    }
                    setError(null);
                    setStep('confirm');
                  }}
                  className="btn-gold flex-1"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="mx-auto mt-10 max-w-lg animate-fade-in">
            <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
              <h3 className="mb-6 font-display text-2xl text-ink-50">Confirm Your Booking</h3>

              <div className="space-y-3">
                <SummaryRow label="Service" value={selectedService?.name || ''} />
                <SummaryRow label="Price" value={formatPrice(Number(selectedService?.price))} />
                <SummaryRow label="Date" value={selectedDate ? formatDate(selectedDate) : ''} />
                <SummaryRow label="Time" value={selectedTime ? formatTime(selectedTime) : ''} />
                <SummaryRow label="Name" value={name} />
                <SummaryRow label="Phone" value={phone} />
                {email && <SummaryRow label="Email" value={email} />}
                {notes && <SummaryRow label="Notes" value={notes} />}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="btn-outline flex-1"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="btn-gold flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && confirmedBooking && (
          <div className="mx-auto mt-10 max-w-lg animate-scale-in">
            <div className="rounded-2xl border border-gold-500/30 bg-ink-900 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10">
                <PartyPopper className="h-8 w-8 text-gold-500" />
              </div>
              <h3 className="font-display text-3xl text-ink-50">Booking Confirmed!</h3>
              <p className="mt-2 text-ink-400">
                Your appointment has been saved. We'll see you soon!
              </p>

              <div className="mt-6 space-y-2 rounded-xl border border-ink-700 bg-ink-950 p-5 text-left">
                <SummaryRow label="Service" value={selectedService?.name || ''} />
                <SummaryRow
                  label="Date"
                  value={selectedDate ? formatDate(selectedDate) : ''}
                />
                <SummaryRow label="Time" value={selectedTime ? formatTime(selectedTime) : ''} />
                <SummaryRow label="Name" value={name} />
              </div>

              <p className="mt-4 text-xs text-ink-500">
                Save the date! Lena will confirm your slot. For changes, call{' '}
                <a href="tel:+2348114457181" className="text-gold-400 hover:underline">
                  +234 811 445 7181
                </a>
              </p>

              <button onClick={resetBooking} className="btn-outline mt-6 w-full">
                Book Another Cut
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-700/50 pb-2">
      <span className="text-sm text-ink-400">{label}</span>
      <span className="text-right text-sm font-medium text-ink-100">{value}</span>
    </div>
  );
}
