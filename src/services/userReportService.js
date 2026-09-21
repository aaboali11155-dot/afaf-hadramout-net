import { supabase } from '../lib/supabase';

export async function submitUserReport({ reportedUserId, reason, details = '' }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError) throw authError;
  if (!user) throw new Error('يجب تسجيل الدخول');
  if (!reportedUserId) throw new Error('المستخدم المُبلَّغ عنه غير محدد');
  if (user.id === reportedUserId) throw new Error('لا يمكنك الإبلاغ عن حسابك');
  if (!String(reason || '').trim()) throw new Error('سبب البلاغ مطلوب');
  const { data, error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason: String(reason).trim(),
    details: String(details || '').trim(),
    status: 'open',
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function fetchAllUserReports({ status = null } = {}) {
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const ids = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id]).filter(Boolean))];
  if (!ids.length) return rows;
  const { data: profiles, error: profileError } = await supabase.from('profiles')
    .select('user_id,الاسم,العمر,الجنس,المدينة,الحالة_الاجتماعية,المؤهل_الدراسي').in('user_id', ids);
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  return rows.map((r) => ({ ...r,
    reporter_profile: profileMap.get(r.reporter_id) || null,
    reported_profile: profileMap.get(r.reported_user_id) || null,
    reporter_name: profileMap.get(r.reporter_id)?.الاسم || null,
    reported_name: profileMap.get(r.reported_user_id)?.الاسم || null,
  }));
}
export async function fetchOpenUserReports() { return fetchAllUserReports({ status: 'open' }); }
export async function updateUserReport(id, updates) {
  const { data, error } = await supabase.from('reports').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}
export async function resolveUserReport(id, adminNote = '') { return updateUserReport(id, { status: 'resolved', admin_note: adminNote || null }); }
export async function dismissUserReport(id, adminNote = '') { return updateUserReport(id, { status: 'dismissed', admin_note: adminNote || null }); }
