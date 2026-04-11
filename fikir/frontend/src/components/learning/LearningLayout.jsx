import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import DashboardSidebar from '../dashboard/DashboardSidebar.jsx';
import LearningHeader from './LearningHeader.jsx';

export default function LearningLayout({ title, children }) {
  const { user, fetchMe, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-emerald/5 text-neutral-900">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <LearningHeader
          title={title}
          userName={user?.name || 'Student'}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
