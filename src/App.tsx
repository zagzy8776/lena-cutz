import { useEffect, useState } from 'react';
import { api, type Session } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import About from '@/components/About';
import BookingSection from '@/components/BookingSection';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminApp from '@/components/admin/AdminApp';

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Hash routing: #admin shows admin panel
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash.toLowerCase();
      setIsAdminRoute(hash === '#admin' || hash.startsWith('#admin/'));
    };
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  // Auth state - check localStorage token
  useEffect(() => {
    const { session: existing } = api.auth.getSession();
    setSession(existing);
    setAuthLoading(false);
  }, []);

  // Admin route
  if (isAdminRoute) {
    if (authLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
        </div>
      );
    }

    if (!session) {
      return <AdminLogin onSuccess={(s) => setSession(s)} />;
    }

    return <AdminApp onLogout={() => { api.auth.signOut(); setSession(null); }} />;
  }

  // Customer site
  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        <BookingSection />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
