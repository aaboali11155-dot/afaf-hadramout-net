import { supabase } from '../lib/supabase';

export async function fetchMyContactRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachNames(data || []);
}

async function attachNames(data) {
  const ids = [...new Set((data || []).flatMap(r => [r.sender_user_id, r.receiver_user_id]).filter(Boolean))];
  if (!ids.length) return data || [];
  const { data: profiles, error } = await supabase.from('profiles').select('user_id,الاسم').in('user_id', ids);
  if (error) throw error;
  const names = new Map((profiles || []).map(p => [p.user_id, p.الاسم]));
  return (data || []).map(r => ({ ...r, sender_name: names.get(r.sender_user_id), receiver_name: names.get(r.receiver_user_id) }));
}

export async function fetchAllContactRequests() {
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachNames(data || []);
}

export async function sendContactRequest(request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const receiverUserId = request?.receiver_user_id;
  if (!receiverUserId) throw new Error('المستخدم المستهدف غير محدد');
  if (receiverUserId === user.id) throw new Error('لا يمكنك إرسال طلب تواصل لنفسك');

  // Prevent duplicate pending requests in either direction before inserting.
  const { data: existing, error: existingError } = await supabase
    .from('contact_requests')
    .select('*')
    .or(
      `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${receiverUserId},status.eq.pending),` +
      `and(sender_user_id.eq.${receiverUserId},receiver_user_id.eq.${user.id},status.eq.pending)`
    )
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({ ...request, sender_user_id: user.id, status: 'pending' })
    .select()
    .single();

  if (!error) return data;

  // Handle a race where another request was inserted between the check and insert.
  if (error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate')) {
    const { data: pending, error: pendingError } = await supabase
      .from('contact_requests')
      .select('*')
      .or(
        `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${receiverUserId},status.eq.pending),` +
        `and(sender_user_id.eq.${receiverUserId},receiver_user_id.eq.${user.id},status.eq.pending)`
      )
      .limit(1)
      .maybeSingle();
    if (pendingError) throw pendingError;
    if (pending) return pending;
  }

  throw error;
}

export async function updateContactRequest(id, updates) {
  const { data, error } = await supabase
    .from('contact_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveContactRequest(id) {
  return updateContactRequest(id, { status: 'approved' });
}

export async function rejectContactRequest(id) {
  return updateContactRequest(id, { status: 'rejected' });
}
