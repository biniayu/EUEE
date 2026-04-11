import NotificationBell from '../notifications/NotificationBell.jsx';

export default function PracticeLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-emerald/5 text-neutral-900">
      <header className="border-b border-neutral-200/80 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-emerald">Adaptive practice</p>
            <h1 className="text-xl font-extrabold text-deep-blue sm:text-2xl">{title}</h1>
            {subtitle && <p className="text-sm text-neutral-600">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center justify-end sm:pt-1">
            <NotificationBell />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
