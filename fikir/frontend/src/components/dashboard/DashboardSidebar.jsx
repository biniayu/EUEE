import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', end: true, alsoActivePrefixes: [] },
  { to: '/subjects', label: 'Subjects', end: false, alsoActivePrefixes: ['/lessons'] },
  { to: '/practice', label: 'Practice', end: true, alsoActivePrefixes: [] },
  { to: '/analytics', label: 'Analytics', end: true, alsoActivePrefixes: [] },
  { to: '/study-plan', label: 'Study Plan', end: true, alsoActivePrefixes: [] },
  { to: '/question-bank', label: 'Question bank', end: true, alsoActivePrefixes: [] },
  { to: '/past-papers', label: 'Past papers', end: true, alsoActivePrefixes: [] },
  { to: '/notifications', label: 'Notifications', end: true, alsoActivePrefixes: [] },
  { to: '/dashboard/materials', label: 'Materials', disabled: true },
];

function NavItem({ to, label, end, disabled, onNavigate, alsoActivePrefixes = [] }) {
  const location = useLocation();
  if (disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400"
        title="Coming in a future update"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" aria-hidden />
        {label}
      </span>
    );
  }
  const prefixActive = alsoActivePrefixes.some((p) => location.pathname.startsWith(p));
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => {
        const active = isActive || prefixActive;
        return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
          active
            ? 'bg-deep-blue text-white shadow-md shadow-deep-blue/20'
            : 'text-neutral-600 hover:bg-white hover:text-deep-blue'
        }`;
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
        aria-hidden
      />
      {label}
    </NavLink>
  );
}

export default function DashboardSidebar({ open, onClose }) {
  const close = () => onClose();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-deep-blue/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
        onClick={close}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-neutral-200/80 bg-white/95 shadow-xl backdrop-blur-md transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-emerald/15 text-brand-emerald">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-emerald">Fikir</p>
              <p className="text-sm font-bold text-deep-blue">EUEE Prep</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} onNavigate={close} />
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-100 p-4">
          <p className="text-xs text-neutral-500">
            Grade 12 Natural Science track — stay consistent, exam day will thank you.
          </p>
        </div>
      </aside>
    </>
  );
}
