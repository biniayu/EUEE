import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

function LightningLogo() {
  return (
    <div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-emerald/10 text-brand-emerald ring-1 ring-brand-emerald/20"
      aria-hidden="true"
    >
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const result = await login({ email, password, remember });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage(result.message || 'Login successful!');
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      const meData = await meRes.json().catch(() => ({}));
      const status = meData.user?.onboardingStatus;
      const next = status === 'completed' ? '/dashboard' : '/onboarding';
      setTimeout(() => navigate(next), 500);
    } catch {
      setTimeout(() => navigate('/onboarding'), 500);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md flex-1">
        <LightningLogo />
        <h1 className="mt-8 text-center text-3xl font-bold tracking-tight text-neutral-900">Login</h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          See your growth and get mentoring support!
        </p>
        {new URLSearchParams(location.search).get('signup') === 'success' && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
            Account created successfully. Please log in.
          </p>
        )}

        <button
          type="button"
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-neutral-400">or Sign in with Email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-900">
              Email<span className="text-brand-emerald">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="mail@website.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-900">
              Password<span className="text-brand-emerald">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Min. 8 character"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-neutral-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-emerald focus:ring-brand-emerald"
              />
              Remember me
            </label>
            <a href="#forgot" className="font-medium text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </a>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              {message}
            </p>
          )}
          {message && (
            <p className="text-center text-sm text-neutral-500">Redirecting to your workspace...</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-600">
          Not registered yet?{' '}
          <Link to="/signup" className="font-semibold text-brand-emerald hover:text-deep-blue">
            Create an Account
          </Link>
        </p>
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} EUEE Prep. All rights reserved.
      </p>
    </div>
  );
}
