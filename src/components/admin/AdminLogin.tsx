import { useState } from 'react';
import { Lock, Mail, Loader2, AlertCircle, Scissors } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (signInError) {
      setError(
        signInError.message.includes('Invalid login')
          ? 'Wrong email or password. Please try again.'
          : signInError.message
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/40 bg-ink-900">
            <img src="/lena_logo_.jpeg" alt="Lena Cutz" className="h-full w-full rounded-full object-cover" />
          </div>
          <h1 className="font-heading text-2xl tracking-wide text-ink-50">LENA CUTZ</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold-500">Admin Panel</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl text-ink-50">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-300">
                <Mail className="h-4 w-4 text-gold-500" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juditheberechi274@gmail.com"
                autoComplete="email"
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-300">
                <Lock className="h-4 w-4 text-gold-500" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-ink-600 bg-ink-950 px-4 py-3 text-ink-100 placeholder-ink-500 outline-none transition-colors focus:border-gold-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            Use the email and password you set up for your account.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="#home" className="text-sm text-ink-400 hover:text-gold-400 transition-colors">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  );
}
