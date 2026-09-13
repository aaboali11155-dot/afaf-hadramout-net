import { supabase } from '../lib/supabase';

export async function fetchAllUserBlocks() {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const ids = [...new Set((data || []).flatMap(b => [b.blocker_id, b.blocked_id]).filter(Boolean))];
  if (!ids.length) return data || [];
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('user_id,الاسم').in('user_id', ids);
  if (profileError) throw profileError;
  const names = new Map((profiles || []).map(p => [p.user_id, p.الاسم]));
  return (data || []).map(b => ({ ...b, blocker_name: names.get(b.blocker_id), blocked_name: names.get(b.blocked_id) }));
}

export async function blockUser({ blockedUserId, reason = '' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await supabase
    .from('user_blocks')
    .insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
      reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unblockUser(blockId) {
  const { error } = await supabase.from('user_blocks').delete().eq('id', blockId);
  if (error) throw error;
  return true;
}
