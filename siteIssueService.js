import { supabase } from '../lib/supabase';

export async function submitSiteIssue({ title, description, issue_type = 'bug', user_email = null }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase.from('site_issues').insert({
    user_id: userData.user?.id || null,
    email: user_email || userData.user?.email || null,
    issue_type,
    title,
    description,
    status: 'new',
  });

  if (error) throw error;
  return data;
}

export async function fetchAllSiteIssues() {
  const { data, error } = await supabase
    .from('site_issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateSiteIssue(issueId, updates) {
  const { data, error } = await supabase
    .from('site_issues')
    .update(updates)
    .eq('id', issueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
