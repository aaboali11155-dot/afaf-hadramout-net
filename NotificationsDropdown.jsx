import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, MessageCircle, UserPlus, AlertCircle, X } from 'lucide-react';
import {
  fetchMyNotifications,
  fetchUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const typeIcons = {
  message: MessageCircle,
  contact_request: UserPlus,
  report: AlertCircle,
  default: Bell,
};

export default function NotificationsDropdown({ currentUser }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  async function loadData() {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [items, count] = await Promise.all([
        fetchMyNotifications(),
        fetchUnreadNotificationsCount(),
      ]);
      setNotifications(items || []);
      setUnreadCount(count || 0);
    } catch {
      // silently fail; user can still use the rest of the site
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  if (!currentUser?.id) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100"
        aria-label="الإشعارات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '+99' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:left-auto sm:right-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-bold text-gray-900">الإشعارات</h3>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <Check size={14} />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">جاري التحميل...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                لا توجد إشعارات
              </div>
            )}

            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || typeIcons.default;
              return (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-right transition-colors hover:bg-gray-50 ${
                    n.is_read ? 'bg-white' : 'bg-brand-50/40'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      n.is_read ? 'bg-gray-100 text-gray-500' : 'bg-brand-100 text-brand-600'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{n.body}</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleDateString('ar-SA', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-4 py-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
