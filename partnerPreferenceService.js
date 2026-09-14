import { supabase } from '../lib/supabase';

export async function fetchPartnerPreference(profileId) {
  const { data, error } = await supabase
    .from('partner_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createPartnerPreference(preference) {
  const { data, error } = await supabase
    .from('partner_preferences')
    .insert(preference)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePartnerPreference(id, updates) {
  const { data, error } = await supabase
    .from('partner_preferences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function savePartnerPreference(profileId, preference) {
  const existing = await fetchPartnerPreference(profileId);
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('user_id').eq('id', profileId).single();
  if (profileError) throw profileError;
  const payload = { ...preference, profile_id: profileId, user_id: profile.user_id };
  if (existing) return updatePartnerPreference(existing.id, payload);
  return createPartnerPreference(payload);
}
