import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Settings,
  Lock,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminBookings from '@/components/admin/AdminBookings';
import AdminServices from '@/components/admin/AdminServices';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminPassword from '@/components/admin/AdminPassword';

type AdminPage = 'overview' | 'bookings' | 'services' | 'settings' | 'password';

export default function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<AdminPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: AdminPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'password', label: 'Password', icon: Lock },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleNavClick = (id: AdminPage) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-ink-700 bg-ink-900 px-5 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gold-500/40">
            <img src="/lena_logo_.jpeg" alt="Lena Cutz" className="h-full w-full object-cover" />
          </div>
          <span className="font-heading text-lg text-ink-50">LENA CUTZ ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-ink-100"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-full w-64 border-r border-ink-700 bg-ink-900 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-ink-700 p-5">
            <div className="h-11 w-11 overflow-hidden rounded-full border border-gold-500/40">
              <img src="/lena_logo_.jpeg" alt="Lena Cutz" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-heading text-lg tracking-wide text-ink-50">LENA CUTZ</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-500">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  page === item.id
                    ? 'bg-gold-500 text-ink-950'
                    : 'text-ink-300 hover:bg-ink-800 hover:text-gold-400'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom links */}
          <div className="space-y-1 border-t border-ink-700 p-4">
            <a
              href="#home"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-gold-400"
            >
              <ExternalLink className="h-5 w-5" />
              View Website
            </a>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-screen px-5 py-8 pt-16 sm:px-8 lg:pt-8">
          {page === 'overview' && <AdminOverview />}
          {page === 'bookings' && <AdminBookings />}
          {page === 'services' && <AdminServices />}
          {page === 'settings' && <AdminSettings />}
          {page === 'password' && <AdminPassword />}
        </div>
      </main>
    </div>
  );
}
