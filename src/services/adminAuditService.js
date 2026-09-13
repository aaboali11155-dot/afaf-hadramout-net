import { supabase } from '../lib/supabase';

export async function fetchAdminAuditLog() {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  const adminIds = [...new Set((data || []).map((log) => log.admin_user_id).filter(Boolean))];
  if (!adminIds.length) return data || [];

  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id, الاسم')
    .in('user_id', adminIds);

  const adminMap = Object.fromEntries((admins || []).map((admin) => [admin.user_id, admin.الاسم]));
  return (data || []).map((log) => ({ ...log, admin_name: adminMap[log.admin_user_id] || '-' }));
}

export async function logAdminAction({ action, entityType, entityId, details = '' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_audit_log')
    .insert({
      admin_user_id: user.id,
      action,
      target_type: entityType,
      target_id: entityId,
      details: typeof details === 'string' ? { message: details } : (details || {}),
    })
    .select()
    .single();

  if (error) {
    // لا نوقف العملية الرئيسية إذا فشل السجل
    console.warn('Audit log failed:', error.message);
    return null;
  }
  return data;
}
