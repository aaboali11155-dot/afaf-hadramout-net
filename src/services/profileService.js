import { supabase } from '../lib/supabase';

const PUBLIC_PROFILE_COLUMNS = `
  id,
  user_id,
  created_at,
  الاسم,
  العمر,
  الجنس,
  gender,
  المدينة,
  الحالة_الاجتماعية,
  المؤهل_الدراسي,
  الوظيفة,
  الطول,
  "لون البشرة",
  لون_البشرة,
  قبلي_او_حضري,
  مستوى_التدين,
  نبذة_عن_نفسه
`;

const ADMIN_PROFILE_COLUMNS = `
  id,
  user_id,
  created_at,
  الاسم,
  العمر,
  الجنس,
  gender,
  المدينة,
  الحالة_الاجتماعية,
  المؤهل_الدراسي,
  الوظيفة,
  الطول,
  "لون البشرة",
  لون_البشرة,
  قبلي_او_حضري,
  مستوى_التدين,
  الحالة_الصحية,
  الحالة_المادية,
  نبذة_عن_نفسه,
  إقرار_الزواج,
  is_admin,
  admin_role,
  admin_permissions,
  account_status,
  is_hidden
`;

async function attachPartnerPreference(profile) {
  if (!profile?.id) return profile;
  const { data, error } = await supabase
    .from('partner_preferences')
    .select('*')
    .eq('profile_id', profile.id)
    .maybeSingle();
  if (error) throw error;
  return { ...profile, partner_preferences: data || null };
}

export async function fetchApprovedProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('account_status', 'active')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return attachPartnerPreference(data);
}

export async function fetchProfileById(id, { admin = false } = {}) {
  let query = supabase
    .from('profiles')
    .select(admin ? ADMIN_PROFILE_COLUMNS : PUBLIC_PROFILE_COLUMNS)
    .eq('id', id);
  if (!admin) {
    query = query.eq('account_status', 'active').eq('is_hidden', false);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return attachPartnerPreference(data);
}

export async function fetchMyProfile(userId) {
  return fetchProfileByUserId(userId);
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProfile(profile) {
  const { data, error } = await supabase.from('profiles').insert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function approveProfile(id) { return updateProfile(id, { account_status: 'active' }); }
export async function hideProfile(id) { return updateProfile(id, { is_hidden: true }); }
export async function toggleProfileVisibility(id, isVisible) { return updateProfile(id, { is_hidden: !isVisible }); }
export async function suspendProfile(id) { return updateProfile(id, { account_status: 'suspended' }); }

export async function recordProfileView(visitorUserId, visitedProfileId) {
  if (!visitorUserId || !visitedProfileId) return;

  // profiles.id is numeric; profile_views.viewed_user_id expects the Auth/user UUID.
  const { data: visitedProfile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', visitedProfileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!visitedProfile?.user_id || visitedProfile.user_id === visitorUserId) return;

  const { error: rpcError } = await supabase.rpc('record_profile_view', {
    p_viewed_user_id: visitedProfile.user_id,
  });

  if (!rpcError) return;

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('profile_views')
    .select('id, visit_count')
    .eq('viewer_id', visitorUserId)
    .eq('viewed_user_id', visitedProfile.user_id)
    .maybeSingle();

  if (existing) {
    const nextCount = (Number(existing.visit_count) || 1) + 1;
    const { error: updateError } = await supabase
      .from('profile_views')
      .update({
        visit_count: nextCount,
        last_visited_at: now,
      })
      .eq('id', existing.id);

    if (updateError) {
      await supabase.from('profile_views').upsert(
        { viewer_id: visitorUserId, viewed_user_id: visitedProfile.user_id, visit_count: nextCount, last_visited_at: now },
        { onConflict: 'viewer_id,viewed_user_id' }
      );
    }
  } else {
    await supabase.from('profile_views').upsert(
      { viewer_id: visitorUserId, viewed_user_id: visitedProfile.user_id, visit_count: 1, last_visited_at: now, created_at: now },
      { onConflict: 'viewer_id,viewed_user_id' }
    );
  }
}

export async function fetchMyProfileViews(profileId) {
  const { data: myProfile, error: profileError } = await supabase
    .from('profiles').select('user_id').eq('id', profileId).maybeSingle();
  if (profileError) throw profileError;
  if (!myProfile?.user_id) return [];

  const { data, error } = await supabase
    .from('profile_views')
    .select('*')
    .eq('viewed_user_id', myProfile.user_id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const viewerIds = [...new Set((data || []).map(v => v.viewer_id).filter(Boolean))];
  if (!viewerIds.length) return [];
  const { data: visitors, error: visitorsError } = await supabase
    .from('profiles')
    .select('id,user_id,الاسم,العمر,المدينة,الحالة_الاجتماعية,account_status,الجنس,gender')
    .in('user_id', viewerIds);
  if (visitorsError) throw visitorsError;
  const byUser = new Map((visitors || []).map(v => [v.user_id, v]));
  return (data || [])
    .map(v => ({ ...v, visitor: byUser.get(v.viewer_id) || null }))
    .sort((a, b) => new Date(b.last_visited_at || b.created_at || 0).getTime() - new Date(a.last_visited_at || a.created_at || 0).getTime());
}
