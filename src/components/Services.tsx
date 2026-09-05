import { useEffect, useState } from 'react';
import { Clock, Check, Loader2, RefreshCw } from 'lucide-react';
import { api, type Service } from '@/lib/api';
import { formatPrice } from '@/lib/constants';

const serviceImages: Record<string, string> = {
  'Low Cut': 'https://images.pexels.com/photos/7447151/pexels-photo-7447151.jpeg?auto=compress&cs=tinysrgb&w=800',
  'High Fade': 'https://images.pexels.com/photos/12464841/pexels-photo-12464841.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Buzz Cut': 'https://images.pexels.com/photos/4625632/pexels-photo-4625632.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Taper Fade': 'https://images.pexels.com/photos/12464840/pexels-photo-12464840.jpeg?auto=compress&cs=tinysrgb&w=800',
  '3 Step': 'https://images.pexels.com/photos/9971240/pexels-photo-9971240.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await api.services.getPublic());
    } catch (err) {
      console.error('Services load failed:', err);
      setError(err instanceof Error ? err.message : 'Unable to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <section id="services" className="relative bg-ink-950 py-24 sm:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label"><span className="h-px w-8 bg-gold-500" />Our Services<span className="h-px w-8 bg-gold-500" /></span>
          <h2 className="mt-4 font-display text-4xl font-bold text-ink-50 sm:text-5xl">Cuts That Define You</h2>
          <p className="mt-4 text-lg text-ink-400">Every service is delivered with precision and care. Choose your style and book in seconds.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold-500" /></div>
        ) : error ? (
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-8 text-center">
            <p className="text-ink-300">{error}</p>
            <button onClick={fetchServices} className="btn-outline mt-5 !py-2.5"><RefreshCw className="h-4 w-4" />Retry</button>
          </div>
        ) : services.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-ink-700 bg-ink-900 py-16 text-center text-ink-400">No services are currently available.</div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <div key={service.id} className="group relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 transition-all duration-500 hover:border-gold-500/40 hover:shadow-xl hover:shadow-gold-500/5 animate-fade-in-up opacity-0" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative h-56 overflow-hidden">
                  <img src={serviceImages[service.name] || service.image_url || ''} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
                  <div className="absolute bottom-4 right-4 rounded-full bg-gold-500 px-4 py-1.5 text-sm font-bold text-ink-950 shadow-lg">{formatPrice(Number(service.price))}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl font-bold text-ink-50">{service.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-ink-400">{service.description || 'Professional service from Lena Cutz.'}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-ink-300"><Clock className="h-3.5 w-3.5 text-gold-500" />{service.duration_minutes} min</span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-300"><Check className="h-3.5 w-3.5 text-gold-500" />Unisex</span>
                  </div>
                  <a href="#booking" className="mt-5 flex w-full items-center justify-center rounded-full border border-ink-600 py-2.5 text-sm font-semibold text-ink-100 transition-all duration-300 hover:border-gold-500 hover:bg-gold-500 hover:text-ink-950">Book This Cut</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
