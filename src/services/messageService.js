import { supabase } from '../lib/supabase';

async function attachNames(data) {
  const ids = [...new Set((data || []).flatMap(m => [m.sender_id, m.receiver_id]).filter(Boolean))];
  if (!ids.length) return data || [];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id,الاسم')
    .in('user_id', ids);
  if (error) throw error;
  const names = new Map((profiles || []).map(p => [p.user_id, p.الاسم]));
  return (data || []).map(m => ({
    ...m,
    sender_name: names.get(m.sender_id),
    receiver_name: names.get(m.receiver_id),
  }));
}

export async function fetchUserMessages(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachNames((data || []).map((message) => ({ ...message, content: message.content ?? message.body ?? '' })));
}

export async function fetchAllMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachNames(data || []);
}

export async function sendMessage(message) {
  const payload = { ...message };
  if (payload.content !== undefined && payload.body === undefined) {
    payload.body = payload.content;
    delete payload.content;
  }
  payload.status = 'pending';
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMessageStatus(id, status, adminNote = null) {
  const updates = { status };
  if (adminNote !== null) updates.admin_note = adminNote;
  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
