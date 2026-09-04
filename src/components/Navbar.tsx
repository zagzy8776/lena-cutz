import { useEffect, useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { useSalonSettings } from '@/lib/useSalonSettings';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Book', href: '#booking' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useSalonSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const phoneHref = settings ? `tel:${settings.phone.replace(/\s/g, '')}` : '';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass border-b border-ink-700/50 py-3' : 'py-5'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div className="h-11 w-11 overflow-hidden rounded-full border border-gold-500/40 bg-ink-900 transition-all duration-300 group-hover:border-gold-500 group-hover:shadow-lg group-hover:shadow-gold-500/20">
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
        </a>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-ink-200 transition-colors duration-200 hover:text-gold-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={phoneHref}
            className="flex items-center gap-2 text-sm font-medium text-ink-200 transition-colors hover:text-gold-400"
          >
            <Phone className="h-4 w-4" />
            {settings?.phone || ''}
          </a>
          <a href="#booking" className="btn-gold !py-2.5 !px-6">
            Book Now
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 text-ink-100 transition-colors hover:border-gold-500 lg:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass mt-3 mx-4 rounded-2xl border border-ink-700/50 p-6 lg:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-base font-medium text-ink-200 transition-colors hover:text-gold-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 border-t border-ink-700 pt-6">
            <a href={phoneHref} className="flex items-center gap-2 text-sm text-ink-200">
              <Phone className="h-4 w-4 text-gold-500" />
              {settings?.phone || ''}
            </a>
            <a
              href="#booking"
              onClick={() => setMenuOpen(false)}
              className="btn-gold w-full"
            >
              Book Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
