import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar.jsx';
import DashboardHeader from './DashboardHeader.jsx';

export default function DashboardLayout({
  userName,
  streakLabel,
  notificationCount,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-emerald/5 text-neutral-900">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DashboardHeader
          userName={userName}
          streakLabel={streakLabel}
          notificationCount={notificationCount}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
