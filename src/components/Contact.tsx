import { Phone, Mail, MapPin, Clock, Instagram, MessageCircle } from 'lucide-react';
import { useSalonSettings } from '@/lib/useSalonSettings';

export default function Contact() {
  const { settings } = useSalonSettings();

  const phoneHref = settings ? `tel:${settings.phone.replace(/\s/g, '')}` : '';
  const emailHref = settings ? `mailto:${settings.email}` : '';

  const hours = settings
    ? [
        { day: 'Monday – Friday', time: settings.mon_fri_hours },
        { day: 'Saturday', time: settings.sat_hours },
        { day: 'Sunday', time: settings.sun_hours },
      ]
    : [];

  return (
    <section id="contact" className="relative bg-ink-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">
            <span className="h-px w-8 bg-gold-500" />
            Get In Touch
            <span className="h-px w-8 bg-gold-500" />
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
            Visit {settings?.salon_name || 'Lena Cutz'}
          </h2>
          <p className="mt-4 text-lg text-ink-400">
            Walk-ins welcome, but appointments get priority. Reach out anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact cards */}
          <a
            href={phoneHref}
            className="group rounded-2xl border border-ink-700 bg-ink-950 p-6 transition-all duration-300 hover:border-gold-500/40 animate-fade-in-up opacity-0"
            style={{ animationDelay: '0s' }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 transition-colors group-hover:bg-gold-500/20">
              <Phone className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="font-display text-lg text-ink-50">Call Us</h3>
            <p className="mt-1 text-sm text-ink-400">{settings?.phone || ''}</p>
          </a>

          <a
            href={settings?.whatsapp || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-ink-700 bg-ink-950 p-6 transition-all duration-300 hover:border-gold-500/40 animate-fade-in-up opacity-0"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 transition-colors group-hover:bg-gold-500/20">
              <MessageCircle className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="font-display text-lg text-ink-50">WhatsApp</h3>
            <p className="mt-1 text-sm text-ink-400">Chat with Lena directly</p>
          </a>

          <a
            href={emailHref}
            className="group rounded-2xl border border-ink-700 bg-ink-950 p-6 transition-all duration-300 hover:border-gold-500/40 animate-fade-in-up opacity-0"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 transition-colors group-hover:bg-gold-500/20">
              <Mail className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="font-display text-lg text-ink-50">Email</h3>
            <p className="mt-1 text-sm text-ink-400 break-all">{settings?.email || ''}</p>
          </a>
        </div>

        {/* Hours + Location */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Hours */}
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-gold-500" />
              <h3 className="font-display text-xl text-ink-50">Opening Hours</h3>
            </div>
            <ul className="space-y-3">
              {hours.map((h) => (
                <li
                  key={h.day}
                  className="flex items-center justify-between border-b border-ink-700/50 pb-3 last:border-0"
                >
                  <span className="text-sm text-ink-300">{h.day}</span>
                  <span className="text-sm font-medium text-ink-100">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gold-500" />
              <h3 className="font-display text-xl text-ink-50">Find Us</h3>
            </div>
            <p className="text-sm text-ink-300">{settings?.location || ''}</p>
            <p className="mt-2 text-sm text-ink-400">
              Conveniently located in the heart of Owerri. Easy parking available.
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                settings?.location || 'Owerri, Nigeria'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
