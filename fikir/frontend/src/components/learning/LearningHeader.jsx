import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LearningHeader({ title, userName, onLogout, onMenuClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (userName || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-neutral-200 p-2 text-deep-blue shadow-sm transition hover:bg-neutral-50 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="text-xs font-semibold uppercase tracking-wide text-brand-emerald transition hover:text-deep-blue"
            >
              ← Dashboard
            </Link>
            <h1 className="truncate text-lg font-bold text-deep-blue sm:text-xl">{title}</h1>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1 pr-2 transition hover:bg-neutral-50 sm:pr-3"
            aria-expanded={menuOpen}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-deep-blue text-xs font-bold text-white">
              {initials}
            </span>
            <svg className="hidden h-4 w-4 text-neutral-500 sm:block" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
              <p className="truncate px-4 py-2 text-xs text-neutral-500">{userName}</p>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
