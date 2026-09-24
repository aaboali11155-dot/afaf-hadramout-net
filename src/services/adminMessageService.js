import { supabase } from '../lib/supabase';

export async function sendAdminMessage({ receiverUserId, content }) {
  const text = String(content || '').trim();
  if (!receiverUserId || !text) throw new Error('بيانات الرسالة غير مكتملة');
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error('يجب تسجيل الدخول');
  const { data: me, error: meError } = await supabase.from('profiles')
    .select('user_id,is_admin,admin_role,admin_permissions,account_status').eq('user_id', authData.user.id).single();
  if (meError || !me?.is_admin) throw new Error('غير مصرح');

  const isAuthorized = me.admin_role === 'owner' || (
    me.admin_role === 'moderator' && Array.isArray(me.admin_permissions) && me.admin_permissions.includes('messages')
  );
  if (!isAuthorized) throw new Error('ليست لديك صلاحية إرسال الرسائل');
  const { data, error } = await supabase.from('messages').insert({
    sender_id: authData.user.id, receiver_id: receiverUserId, body: text, status: 'approved'
  }).select().single();
  if (error) throw error;
  return data;
}
