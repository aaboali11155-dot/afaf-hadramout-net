import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, ArrowLeft, MessageCircle, UserPlus, AlertCircle } from 'lucide-react';
import {
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const typeIcons = {
  message: MessageCircle,
  contact_request: UserPlus,
  report: AlertCircle,
  default: Bell,
};

export default function NotificationsPage({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        const items = await fetchMyNotifications();
        setNotifications(items || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل الإشعارات');
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleRead = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">الإشعارات</h1>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100"
          >
            <Check size={14} />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      <div className="card">
        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">جاري تحميل الإشعارات...</div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            لا توجد إشعارات حالياً
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || typeIcons.default;
              return (
                <button
                  key={n.id}
                  onClick={() => handleRead(n)}
                  className={`flex w-full items-start gap-4 px-4 py-4 text-right transition-colors hover:bg-gray-50 ${
                    n.is_read ? 'bg-white' : 'bg-brand-50/40'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      n.is_read ? 'bg-gray-100 text-gray-500' : 'bg-brand-100 text-brand-600'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className={`text-sm font-bold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{n.body}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.is_read && <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
