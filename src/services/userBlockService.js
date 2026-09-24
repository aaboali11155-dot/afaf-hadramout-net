import { supabase } from '../lib/supabase';

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

export async function unblockUser(blockIdOrBlockedUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .or(`id.eq.${blockIdOrBlockedUserId},and(blocker_id.eq.${user.id},blocked_id.eq.${blockIdOrBlockedUserId})`);

  if (error) throw error;
  return true;
}

export async function fetchMyBlocks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');

  const { data, error } = await supabase
    .from('user_blocks')
    .select('*')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function isBlocked(blockedUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !blockedUserId) return false;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedUserId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function fetchBlockedUserIds() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  if (error) throw error;
  return (data || []).map((b) => b.blocked_id);
}
