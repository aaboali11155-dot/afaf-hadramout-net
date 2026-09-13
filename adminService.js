import { supabase } from '../lib/supabase';

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchAllContactRequests() {
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function toggleUserAccountStatus(userId, status) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ account_status: status })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
