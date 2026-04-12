import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatTimeAgo } from './timeAgo.js';
import { badgeClasses, labelForType } from './typeStyles.js';

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

export default function NotificationBell({ pollMs = 45000, initialUnread = null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(
    typeof initialUnread === 'number' && !Number.isNaN(initialUnread) ? initialUnread : 0
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const wrapRef = useRef(null);

  const refreshLite = useCallback(async () => {
    try {
      const data = await apiJson('/api/notifications?lite=1');
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadFull = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiJson('/api/notifications?limit=12');
      setItems(data.notifications || []);
      setUnread(data.unreadCount ?? 0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof initialUnread === 'number' && !Number.isNaN(initialUnread)) {
      setUnread(initialUnread);
    }
  }, [initialUnread]);

  useEffect(() => {
    refreshLite();
    const id = setInterval(refreshLite, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refreshLite]);

  useEffect(() => {
    if (!open) return undefined;
    loadFull();
    const id = setInterval(loadFull, 30000);
    return () => clearInterval(id);
  }, [open, loadFull]);

  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function markRead(id) {
    try {
      await apiJson(`/api/notifications/${id}/read`, { method: 'POST', body: '{}' });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    try {
      await apiJson('/api/notifications/mark-all-read', { method: 'POST', body: '{}' });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        id="notifications-menu-button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full border border-neutral-200 p-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-deep-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="notifications-menu-panel"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-amber px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-menu-panel"
          role="menu"
          aria-labelledby="notifications-menu-button"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5 transition-opacity duration-200"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 bg-deep-blue px-3 py-2.5 text-white">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-emerald hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
            {loading && <p className="px-3 py-4 text-sm text-neutral-500">Loading…</p>}
            {err && <p className="px-3 py-2 text-xs text-red-600">{err}</p>}
            {!loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-neutral-500">You are all caught up.</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`border-b border-neutral-50 px-3 py-3 ${n.isRead ? 'bg-white' : 'bg-brand-emerald/[0.04]'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClasses(n.type)}`}>
                      {labelForType(n.type)}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-deep-blue">{n.title}</p>
                    <p className="mt-0.5 line-clamp-3 text-xs text-neutral-600">{n.message}</p>
                    <p className="mt-1 text-[10px] text-neutral-400">{formatTimeAgo(n.createdAt)}</p>
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="mt-2 text-xs font-semibold text-brand-emerald hover:text-deep-blue"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-2 text-center">
            <Link
              to="/notifications"
              className="text-xs font-semibold text-deep-blue hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
