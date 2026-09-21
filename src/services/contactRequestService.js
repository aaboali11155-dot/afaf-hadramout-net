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



/**
 * Groups contact requests by the other user's ID.
 * The newest request is used as the card's representative fields, while
 * every request is kept in `requests` for the conversation/history view.
 */
export function groupContactRequests(data, currentUserId) {
  const groups = new Map();

  for (const request of data || []) {
    const otherUserId = request.sender_user_id === currentUserId
      ? request.receiver_user_id
      : request.sender_user_id;
    if (!otherUserId) continue;

    const existing = groups.get(otherUserId);
    if (!existing) {
      groups.set(otherUserId, {
        ...request,
        id: `contact-group-${otherUserId}`,
        other_user_id: otherUserId,
        request_ids: [request.id],
        requests: [request],
        latest_request: request,
      });
      continue;
    }

    existing.request_ids.push(request.id);
    existing.requests.push(request);
    if (new Date(request.created_at || 0) > new Date(existing.latest_request?.created_at || 0)) {
      const history = existing.requests;
      const requestIds = existing.request_ids;
      const latest = request;
      groups.set(otherUserId, {
        ...request,
        id: `contact-group-${otherUserId}`,
        other_user_id: otherUserId,
        request_ids: requestIds,
        requests: history,
        latest_request: latest,
      });
    }
  }

  return [...groups.values()].sort(
    (a, b) => new Date(b.latest_request?.created_at || 0) - new Date(a.latest_request?.created_at || 0)
  );
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
