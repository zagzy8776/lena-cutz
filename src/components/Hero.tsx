import { Star, MapPin, ArrowDown, Scissors } from 'lucide-react';
import { useSalonSettings } from '@/lib/useSalonSettings';

const heroImage =
  'https://images.pexels.com/photos/12074386/pexels-photo-12074386.jpeg?auto=compress&cs=tinysrgb&w=1600';

export default function Hero() {
  const { settings } = useSalonSettings();

  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Fresh fade haircut at Lena Cutz barbershop"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/70 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-transparent to-ink-950/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pt-24 pb-16 sm:px-8">
        <div className="max-w-3xl">
          {/* Rating badge */}
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold-500/30 bg-ink-900/60 px-4 py-2 animate-fade-in">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
              ))}
            </div>
            <span className="text-sm font-medium text-ink-200">
              #1 Rated Barbershop in Owerri
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl font-bold leading-[1.05] text-ink-50 text-balance sm:text-6xl lg:text-7xl animate-fade-in-up">
            Sharp Cuts.
            <br />
            <span className="gold-gradient-text">Fresh Confidence.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300 animate-fade-in-up [animation-delay:0.15s] opacity-0">
            Owerri's premier unisex barbershop. {settings?.salon_name || 'Lena'} delivers precision fades, clean low cuts,
            and bold styles — every cut crafted to make you look your best.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-in-up [animation-delay:0.3s] opacity-0">
            <a href="#booking" className="btn-gold">
              <Scissors className="h-4 w-4" />
              Book Your Cut
            </a>
            <a href="#services" className="btn-outline">
              View Services
            </a>
          </div>

          {/* Location */}
          <div className="mt-10 flex items-center gap-2 text-sm text-ink-400 animate-fade-in [animation-delay:0.5s] opacity-0">
            <MapPin className="h-4 w-4 text-gold-500" />
            {settings?.location || 'Owerri, Imo State, Nigeria'}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in [animation-delay:0.8s] opacity-0">
        <div className="flex flex-col items-center gap-2 text-ink-500">
          <span className="text-xs uppercase tracking-[0.2em]">Scroll</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
