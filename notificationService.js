import { supabase } from '../lib/supabase';

export async function requestBrowserNotifications() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function subscribeToMyNotifications(userId, onNotification) {
  if (!userId || !onNotification) return () => {};

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNotification(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function showBrowserNotification(notification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options = {
      body: notification.body || '',
      icon: '/favicon.svg',
      tag: `afaf-notification-${notification.id || Date.now()}`,
      renotify: true,
      data: { url: notification.link || '/notifications' },
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => registration.showNotification(notification.title || 'عفاف حضرموت نت', options))
        .catch(() => new Notification(notification.title || 'عفاف حضرموت نت', options));
    } else {
      new Notification(notification.title || 'عفاف حضرموت نت', options);
    }
  } catch {
    // Browser notifications are optional; keep the in-site notification working.
  }
}

export async function fetchMyNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function fetchUnreadNotificationsCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return true;
}

export async function createNotification({ userId, title, body, type = 'general', link = null, relatedId = null }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      body,
      type,
      link,
      related_id: relatedId,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
