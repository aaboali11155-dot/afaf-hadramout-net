import { supabase } from '../lib/supabase';

export const ADMIN_PERMISSIONS = [
  { id: 'profiles', label: 'إدارة الملفات' },
  { id: 'requests', label: 'مراجعة طلبات التواصل' },
  { id: 'messages', label: 'مراجعة الرسائل' },
  { id: 'issues', label: 'بلاغات الموقع' },
  { id: 'reports', label: 'بلاغات المستخدمين' },
  { id: 'blocks', label: 'إدارة الحظر' },
  { id: 'audit', label: 'عرض السجل' },
];

export async function getAdminPermissionState() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isOwner: false, moderatorCount: 0 };
  const { data: me } = await supabase.from('profiles').select('is_admin, admin_role, admin_permissions').eq('user_id', user.id).maybeSingle();
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', true).neq('admin_role', 'owner');
  return { isOwner: me?.is_admin === true && me?.admin_role === 'owner', moderatorCount: count || 0, permissions: Array.isArray(me?.admin_permissions) ? me.admin_permissions : [] };
}

export async function setUserAdminRole(userId, { isAdmin, adminRole = null, adminPermissions = [] }) {
  const state = await getAdminPermissionState();
  if (!state.isOwner) throw new Error('فقط المشرف الرئيسي يستطيع إدارة المشرفين');
  if (isAdmin && adminRole !== 'owner' && state.moderatorCount >= 2) {
    const { data: existing } = await supabase.from('profiles').select('is_admin, admin_role').eq('user_id', userId).maybeSingle();
    if (!(existing?.is_admin && existing?.admin_role !== 'owner')) {
      throw new Error('تم الوصول إلى الحد الأقصى: مشرفان إضافيان فقط');
    }
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin, admin_role: adminRole, admin_permissions: isAdmin ? adminPermissions : [] })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function revokeAdmin(userId) {
  return setUserAdminRole(userId, { isAdmin: false, adminRole: null, adminPermissions: [] });
}

export async function makeAdmin(userId, adminRole = 'moderator', adminPermissions = []) {
  return setUserAdminRole(userId, { isAdmin: true, adminRole, adminPermissions });
}
