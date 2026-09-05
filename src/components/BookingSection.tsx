import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight, Loader2, Scissors, User, Phone, Mail, AlertCircle, PartyPopper } from 'lucide-react';
import { api, type Service, type Booking } from '@/lib/api';
import { TIME_SLOTS, formatTime, formatPrice, formatDate } from '@/lib/constants';

type Step = 'service' | 'datetime' | 'details' | 'confirm' | 'success';

export default function BookingSection() {
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const fetchServices = async () => {
    setLoadingServices(true); setServiceError(null);
    try { setServices(await api.services.getPublic()); }
    catch (err) { setServiceError(err instanceof Error ? err.message : 'Unable to load services.'); }
    finally { setLoadingServices(false); }
  };
  useEffect(() => { fetchServices(); }, []);

  const dateToYmd = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    let cancelled = false;
    setLoadingSlots(true); setSlotError(null); setSelectedTime(null);
    api.bookings.getAvailability(dateToYmd(selectedDate), selectedService.id)
      .then((data) => { if (!cancelled) setBookedSlots(data.booked_slots); })
      .catch((err) => { if (!cancelled) setSlotError(err instanceof Error ? err.message : 'Unable to check availability.'); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [selectedDate, selectedService]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1); const total = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
  }, [calendarMonth]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!name.trim() || !phone.trim()) { setError('Please fill in your name and phone number.'); setStep('details'); return; }
    setSubmitting(true); setError(null);
    try {
      const data = await api.bookings.create({ service_id: selectedService.id, customer_name: name.trim(), customer_phone: phone.trim(), customer_email: email.trim() || null, booking_date: dateToYmd(selectedDate), booking_time: selectedTime, notes: notes.trim() || null });
      setConfirmedBooking(data); setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      if (message.toLowerCase().includes('already been booked')) {
        const availability = await api.bookings.getAvailability(dateToYmd(selectedDate), selectedService.id).catch(() => null);
        if (availability) setBookedSlots(availability.booked_slots);
        setSelectedTime(null);
      }
    } finally { setSubmitting(false); }
  };

  const resetBooking = () => { setStep('service'); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setBookedSlots([]); setName(''); setPhone(''); setEmail(''); setNotes(''); setError(null); setConfirmedBooking(null); };
  const stepNumber = { service: 1, datetime: 2, details: 3, confirm: 4 } as const;

  return <section id="booking" className="relative bg-ink-950 py-24 sm:py-32">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <div className="mx-auto max-w-2xl text-center"><span className="section-label"><span className="h-px w-8 bg-gold-500"/>Book Appointment<span className="h-px w-8 bg-gold-500"/></span><h2 className="mt-4 font-display text-4xl font-bold text-ink-50 sm:text-5xl">Reserve Your Chair</h2><p className="mt-4 text-lg text-ink-400">Pick a service, choose your date and time, and we'll save your spot.</p></div>
      {step !== 'success' && <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-2">{(['service','datetime','details','confirm'] as const).map((s,i)=><div key={s} className="flex items-center"><div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${stepNumber[step]>=i+1?'bg-gold-500 text-ink-950':'border border-ink-600 bg-ink-900 text-ink-500'}`}>{stepNumber[step]>i+1?<Check className="h-4 w-4"/>:i+1}</div>{i<3&&<div className={`h-px w-12 ${stepNumber[step]>i+1?'bg-gold-500':'bg-ink-700'}`}/>}</div>)}</div>}
      {step === 'service' && <div className="mt-10">{loadingServices?<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold-500"/></div>:serviceError?<div className="mx-auto max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-8 text-center"><p className="text-ink-300">{serviceError}</p><button onClick={fetchServices} className="btn-outline mt-5">Retry</button></div>:services.length===0?<div className="rounded-2xl border border-ink-700 bg-ink-900 py-16 text-center text-ink-400">No services are currently available.</div>:<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{services.map(s=><button key={s.id} onClick={()=>{setSelectedService(s);setError(null);setStep('datetime')}} className="group flex items-center justify-between rounded-2xl border border-ink-700 bg-ink-900 p-5 text-left hover:border-gold-500/40 hover:bg-ink-800"><div><h3 className="font-display text-xl font-bold text-ink-50">{s.name}</h3><p className="mt-1 text-sm text-ink-400">{s.duration_minutes} min</p></div><div className="text-right"><div className="font-bold text-gold-500">{formatPrice(Number(s.price))}</div><div className="mt-1 text-xs text-ink-500">Select →</div></div></button>)}</div>}</div>}
      {step === 'datetime' && selectedService && <div className="mt-10"><div className="mb-6 flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 px-5 py-3"><div className="flex items-center gap-3"><Scissors className="h-5 w-5 text-gold-500"/><span className="font-semibold text-ink-50">{selectedService.name}</span><span className="text-sm text-ink-400">{formatPrice(Number(selectedService.price))}</span></div><button onClick={()=>setStep('service')} className="text-xs text-ink-400 hover:text-gold-400">Change</button></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><div className="mb-4 flex items-center justify-between"><button onClick={()=>setCalendarMonth(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1))} className="h-9 w-9 rounded-full border border-ink-600 text-ink-300"><ChevronLeft className="mx-auto h-4 w-4"/></button><span className="font-display text-lg text-ink-50">{monthLabel}</span><button onClick={()=>setCalendarMonth(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1))} className="h-9 w-9 rounded-full border border-ink-600 text-ink-300"><ChevronRight className="mx-auto h-4 w-4"/></button></div><div className="mb-2 grid grid-cols-7 gap-1">{['S','M','T','W','T','F','S'].map((d,i)=><div key={i} className="text-center text-xs text-ink-500">{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{calendarDays.map((d,i)=>d?<button key={i} disabled={d<today} onClick={()=>{if(d>=today){setSelectedDate(d);setError(null)}}} className={`h-10 rounded-lg text-sm ${d<today?'text-ink-700':selectedDate?.toDateString()===d.toDateString()?'bg-gold-500 text-ink-950':'text-ink-200 hover:bg-ink-800'}`}>{d.getDate()}</button>:<div key={i}/>)}</div></div>
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><div className="mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-gold-500"/><span className="font-display text-lg text-ink-50">{selectedDate?formatDate(selectedDate).split(',')[0]:'Select a date'}</span></div>{!selectedDate?<div className="flex h-48 items-center justify-center text-sm text-ink-500"><Calendar className="mr-2 h-5 w-5"/>Pick a date to see available times</div>:loadingSlots?<div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold-500"/></div>:slotError?<div className="flex h-48 items-center justify-center text-center text-sm text-red-400"><AlertCircle className="mr-2 h-5 w-5"/>{slotError}</div>:<><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{TIME_SLOTS.map(t=>{const booked=bookedSlots.includes(t);return <button key={t} disabled={booked} onClick={()=>!booked&&setSelectedTime(t)} className={`rounded-lg py-2.5 text-sm ${booked?'bg-ink-800 text-ink-600 line-through':selectedTime===t?'bg-gold-500 text-ink-950':'border border-ink-600 text-ink-200 hover:border-gold-500/40'}`}>{formatTime(t)}</button>})}</div>{bookedSlots.length>0&&<p className="mt-4 text-xs text-ink-500">Booked times are crossed out.</p>}{selectedTime&&<button onClick={()=>setStep('details')} className="btn-gold mt-6 w-full">Continue</button>}</>}</div></div></div>}
      {step === 'details' && <div className="mx-auto mt-10 max-w-lg"><div className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><h3 className="mb-6 font-display text-2xl text-ink-50">Your Details</h3><div className="space-y-4"><label className="block text-sm text-ink-300">Full Name *<input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100"/></label><label className="block text-sm text-ink-300">Phone *<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100"/></label><label className="block text-sm text-ink-300">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100"/></label><label className="block text-sm text-ink-300">Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100"/></label>{error&&<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}<div className="flex gap-3"><button onClick={()=>setStep('datetime')} className="btn-outline flex-1">Back</button><button onClick={()=>{if(!name.trim()||!phone.trim()){setError('Please fill in your name and phone number.');return}setError(null);setStep('confirm')}} className="btn-gold flex-1">Review Booking</button></div></div></div></div>}
      {step === 'confirm' && selectedService && selectedDate && selectedTime && <div className="mx-auto mt-10 max-w-lg"><div className="rounded-2xl border border-ink-700 bg-ink-900 p-6"><h3 className="mb-6 font-display text-2xl text-ink-50">Confirm Appointment</h3><div className="space-y-3 rounded-xl border border-ink-700 bg-ink-950 p-5"><div className="flex justify-between"><span className="text-ink-500">Service</span><span className="text-ink-100">{selectedService.name}</span></div><div className="flex justify-between"><span className="text-ink-500">Date</span><span className="text-ink-100">{formatDate(selectedDate)}</span></div><div className="flex justify-between"><span className="text-ink-500">Time</span><span className="text-ink-100">{formatTime(selectedTime)}</span></div><div className="flex justify-between"><span className="text-ink-500">Name</span><span className="text-ink-100">{name}</span></div></div>{error&&<div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}<div className="mt-6 flex gap-3"><button onClick={()=>setStep('details')} className="btn-outline flex-1">Back</button><button onClick={handleConfirm} disabled={submitting} className="btn-gold flex-1">{submitting?'Booking...':'Confirm Booking'}</button></div></div></div>}
      {step === 'success' && confirmedBooking && <div className="mx-auto mt-10 max-w-lg"><div className="rounded-2xl border border-green-500/20 bg-ink-900 p-8 text-center"><PartyPopper className="mx-auto h-10 w-10 text-green-400"/><h3 className="mt-4 font-display text-3xl text-ink-50">Booking Received</h3><p className="mt-3 text-ink-400">Your appointment request has been sent. Lena Cutz will confirm your booking.</p><p className="mt-4 text-gold-500">{selectedService?.name} · {selectedDate?formatDate(selectedDate):''} at {formatTime(confirmedBooking.booking_time)}</p><button onClick={resetBooking} className="btn-outline mt-6 w-full">Book Another Appointment</button></div></div>}
    </div>
  </section>;
}
