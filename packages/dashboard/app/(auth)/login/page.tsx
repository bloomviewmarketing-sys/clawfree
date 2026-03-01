'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/chat');
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">ClawFree</h1>
        <p className="mb-6 text-center text-sm text-gray-400">Sign in to your agent dashboard</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 border border-red-800 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input w-full"
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="space-y-3">
          <button onClick={() => handleOAuth('github')} className="btn-secondary w-full">
            Continue with GitHub
          </button>
          <button onClick={() => handleOAuth('google')} className="btn-secondary w-full">
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <a href="/signup" className="text-brand-400 hover:text-brand-300">Sign up</a>
        </p>
      </div>
    </div>
  );
}
