import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';
import { formatTimeAgo } from '../components/notifications/timeAgo.js';
import { badgeClasses, labelForType } from '../components/notifications/typeStyles.js';

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function Notifications() {
  const { setPageContext } = useChatbotPageContext();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPageContext({ type: 'notifications' });
    return () => setPageContext({});
  }, [setPageContext]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson('/api/notifications?limit=80');
      setItems(data.notifications || []);
      setUnread(data.unreadCount ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function markRead(nid) {
    await apiJson(`/api/notifications/${nid}/read`, { method: 'POST', body: '{}' });
    setItems((prev) => prev.map((n) => (n.id === nid ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    await apiJson('/api/notifications/mark-all-read', { method: 'POST', body: '{}' });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  return (
    <LearningLayout title="Notifications">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/dashboard" className="text-sm font-semibold text-brand-emerald hover:text-deep-blue">
              ← Dashboard
            </Link>
            <p className="mt-2 text-sm text-neutral-600">
              Timely nudges from Fikir — streaks, weak topics, milestones, and exam countdown. All stored in your
              account.
            </p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-full bg-deep-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#002a52]"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading && <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-6 py-12 text-center text-sm text-neutral-600">
            No notifications yet. <strong className="text-deep-blue">Log in</strong>, complete a{' '}
            <Link className="font-semibold text-brand-emerald underline" to="/practice">
              practice session
            </Link>
            , or finish a{' '}
            <Link className="font-semibold text-brand-emerald underline" to="/subjects">
              lesson
            </Link>{' '}
            to generate your first alerts.
          </div>
        )}

        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border px-4 py-4 shadow-sm ${
                n.isRead ? 'border-neutral-200 bg-white' : 'border-brand-emerald/30 bg-brand-emerald/[0.03]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${badgeClasses(n.type)}`}>
                  {labelForType(n.type)}
                </span>
                <span className="text-xs text-neutral-400">{formatTimeAgo(n.createdAt)}</span>
              </div>
              <h2 className="mt-2 text-base font-bold text-deep-blue">{n.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{n.message}</p>
              {!n.isRead && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="mt-3 text-sm font-semibold text-brand-emerald hover:text-deep-blue"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </LearningLayout>
  );
}
