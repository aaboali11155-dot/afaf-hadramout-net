import { supabase } from '../lib/supabase';

export async function submitUserReport({ reportedUserId, reason, details = '' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason,
      details,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllUserReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const ids = [...new Set((data || []).flatMap(r => [r.reporter_id, r.reported_user_id]).filter(Boolean))];
  if (!ids.length) return data || [];
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('user_id,الاسم,العمر,الجنس,المدينة,الحالة_الاجتماعية,المؤهل_الدراسي').in('user_id', ids);
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  return (data || []).map(r => ({
    ...r,
    reporter_profile: profileMap.get(r.reporter_id) || null,
    reported_profile: profileMap.get(r.reported_user_id) || null,
    reporter_name: profileMap.get(r.reporter_id)?.الاسم || null,
    reported_name: profileMap.get(r.reported_user_id)?.الاسم || null,
  }));
}

export async function updateUserReport(id, updates) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveUserReport(id) {
  return updateUserReport(id, { status: 'resolved' });
}

export async function dismissUserReport(id) {
  return updateUserReport(id, { status: 'dismissed' });
}
