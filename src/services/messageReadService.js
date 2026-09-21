import { supabase } from '../lib/supabase';

export async function markConversationAsRead(otherUserId) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const me = authData?.user;
  if (authError || !me?.id || !otherUserId) return;

  // Support the common schema used by this project: sender_id / receiver_id / is_read.
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', me.id)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  if (error) {
    console.error('mark conversation read failed', error);
  }
}

export function groupAndSortConversations(messages = [], currentUserId) {
  const map = new Map();

  for (const message of messages) {
    const sender = message.sender_id ?? message.sender_user_id;
    const receiver = message.receiver_id ?? message.receiver_user_id;
    const other = sender === currentUserId ? receiver : sender;
    if (!other || other === currentUserId) continue;

    const timestamp = new Date(
      message.created_at ?? message.sent_at ?? message.updated_at ?? 0
    ).getTime() || 0;

    const existing = map.get(other);
    const unread =
      receiver === currentUserId &&
      message.is_read === false;

    if (!existing) {
      map.set(other, {
        userId: other,
        messages: [message],
        latestMessage: message,
        latestTimestamp: timestamp,
        unreadCount: unread ? 1 : 0,
      });
      continue;
    }

    existing.messages.push(message);
    if (timestamp > existing.latestTimestamp) {
      existing.latestTimestamp = timestamp;
      existing.latestMessage = message;
    }
    if (unread) existing.unreadCount += 1;
  }

  return [...map.values()].sort(
    (a, b) => b.latestTimestamp - a.latestTimestamp
  );
}
