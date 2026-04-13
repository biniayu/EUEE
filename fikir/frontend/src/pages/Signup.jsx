import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('12');
  const [targetUniversity, setTargetUniversity] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const result = await signup({
      name: fullName,
      email,
      password,
      gradeLevel,
      stream: 'Natural Science',
      targetUniversity,
      weakSubjects: [],
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage('Account created successfully. Redirecting to login...');
    setTimeout(() => navigate('/login?signup=success'), 900);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md flex-1">
        <LightningLogo />
        <h1 className="mt-8 text-center text-3xl font-bold tracking-tight text-neutral-900">
          Create account
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Start your free trial and unlock your Natural Science mentor.
        </p>

        <button
          type="button"
          disabled
          title="Google sign-in coming soon"
          aria-label="Google sign-in coming soon"
          className="mt-10 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border border-neutral-200 bg-neutral-100 py-3 text-sm font-medium text-neutral-500 shadow-sm"
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
          Sign up with Google (coming soon)
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-neutral-400">or Sign up with Email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-neutral-900">
              Full name<span className="text-brand-emerald">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min. 8 character"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
          </div>
          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-semibold text-neutral-900">
              Grade Level
            </label>
            <input
              id="gradeLevel"
              name="gradeLevel"
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
          </div>
          <div>
            <label htmlFor="targetUniversity" className="block text-sm font-semibold text-neutral-900">
              Target University (optional)
            </label>
            <input
              id="targetUniversity"
              name="targetUniversity"
              type="text"
              placeholder="Addis Ababa University"
              value={targetUniversity}
              onChange={(e) => setTargetUniversity(e.target.value)}
              className="mt-2 w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/30"
            />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-emerald hover:text-deep-blue">
            Log in
          </Link>
        </p>
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} EUEE Prep. All rights reserved.
      </p>
    </div>
  );
}
