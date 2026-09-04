import { Phone, Mail, Instagram, MessageCircle, MapPin } from 'lucide-react';
import { useSalonSettings } from '@/lib/useSalonSettings';

export default function Footer() {
  const { settings } = useSalonSettings();

  const phoneHref = settings ? `tel:${settings.phone.replace(/\s/g, '')}` : '';
  const emailHref = settings ? `mailto:${settings.email}` : '';

  return (
    <footer className="border-t border-ink-700 bg-ink-950 py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-gold-500/40 bg-ink-900">
                <img src="/lena_logo_.jpeg" alt="Lena Cutz logo" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-heading text-xl tracking-wide text-ink-50">
                  {(settings?.salon_name || 'LENA CUTZ').toUpperCase()}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-500">
                  Barbershop
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-400">
              Owerri's #1 barbershop. Unisex cuts, precision fades, and fresh styles for everyone.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Services', href: '#services' },
                { label: 'About', href: '#about' },
                { label: 'Book Appointment', href: '#booking' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-ink-400 transition-colors hover:text-gold-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
              Services
            </h4>
            <ul className="space-y-2">
              {['Low Cut', 'High Fade', 'Buzz Cut', 'Taper Fade', '3 Step'].map((s) => (
                <li key={s}>
                  <a
                    href="#services"
                    className="text-sm text-ink-400 transition-colors hover:text-gold-400"
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={phoneHref}
                  className="flex items-center gap-2 text-sm text-ink-400 transition-colors hover:text-gold-400"
                >
                  <Phone className="h-4 w-4 text-gold-500" />
                  {settings?.phone || ''}
                </a>
              </li>
              <li>
                <a
                  href={emailHref}
                  className="flex items-center gap-2 text-sm text-ink-400 transition-colors hover:text-gold-400"
                >
                  <Mail className="h-4 w-4 text-gold-500" />
                  {settings?.email || ''}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-ink-400">
                <MapPin className="h-4 w-4 text-gold-500" />
                {settings?.location || ''}
              </li>
            </ul>
            {/* Social */}
            <div className="mt-4 flex gap-3">
              <a
                href={settings?.whatsapp || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition-colors hover:border-gold-500 hover:text-gold-400"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={settings?.instagram || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition-colors hover:border-gold-500 hover:text-gold-400"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-700 pt-6 sm:flex-row">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} {settings?.salon_name || 'Lena Cutz'}. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">
            Owerri's #1 Barbershop — Unisex Cuts & Fades
          </p>
        </div>
      </div>
    </footer>
  );
}
