import { Award, Scissors, Heart, Star } from 'lucide-react';

const aboutImage =
  'https://images.pexels.com/photos/7447142/pexels-photo-7447142.jpeg?auto=compress&cs=tinysrgb&w=900';
const aboutImage2 =
  'https://images.pexels.com/photos/4969838/pexels-photo-4969838.jpeg?auto=compress&cs=tinysrgb&w=900';

const stats = [
  { icon: Award, label: '#1 in Owerri', value: 'Top Rated' },
  { icon: Scissors, label: 'Cuts Delivered', value: '2000+' },
  { icon: Heart, label: 'Happy Clients', value: '500+' },
  { icon: Star, label: 'Avg. Rating', value: '4.9/5' },
];

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-ink-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-ink-700">
              <img
                src={aboutImage}
                alt="Lena cutting a client's hair"
                className="h-[500px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
            </div>
            {/* Floating second image */}
            <div className="absolute -bottom-8 -right-4 hidden h-40 w-40 overflow-hidden rounded-2xl border-4 border-ink-900 shadow-xl sm:block lg:w-56 lg:h-56">
              <img
                src={aboutImage2}
                alt="Lena Cutz barbershop interior"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Gold accent */}
            <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full border border-gold-500/20" />
          </div>

          {/* Content */}
          <div>
            <span className="section-label">
              <span className="h-px w-8 bg-gold-500" />
              Meet Lena
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
              The Hands Behind
              <br />
              <span className="gold-gradient-text">Every Sharp Cut</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-300">
              Lena isn't just a barber — she's Owerri's finest. With years of experience and a
              passion for precision, she's built a reputation as the go-to stylist for anyone
              who takes their look seriously. Unisex, professional, and always on point.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-400">
              From clean low cuts to bold three-step fades, every cut is a statement. Lena treats
              each client's hair as a canvas, delivering results that keep them coming back.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-ink-700 bg-ink-950/50 p-4 text-center transition-all duration-300 hover:border-gold-500/30 animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <stat.icon className="mx-auto h-6 w-6 text-gold-500" />
                  <div className="mt-2 font-display text-xl font-bold text-ink-50">
                    {stat.value}
                  </div>
                  <div className="text-xs text-ink-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
