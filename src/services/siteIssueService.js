import { supabase } from '../lib/supabase';

const SITE_ISSUE_STATUSES = ['new', 'open', 'in_progress', 'resolved', 'closed'];

export async function submitSiteIssue({ title, subject, description, issue_type = 'bug', issueType, user_email, email }) {
  const cleanTitle = String(title ?? subject ?? '').trim();
  const cleanDescription = String(description ?? '').trim();
  const cleanType = String(issue_type ?? issueType ?? 'bug').trim() || 'bug';
  if (!cleanTitle || !cleanDescription) throw new Error('عنوان ووصف المشكلة مطلوبان');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData?.user?.id ?? null;
  const cleanEmail = String(user_email ?? email ?? authData?.user?.email ?? '').trim() || null;

  const { data, error } = await supabase
    .from('site_issues')
    .insert({
      user_id: userId,
      email: cleanEmail,
      issue_type: cleanType,
      title: cleanTitle,
      description: cleanDescription,
      status: 'new',
    })
    .select('id,user_id,email,issue_type,title,description,status,created_at,updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function createSiteIssue(args) {
  return submitSiteIssue(args);
}

export async function fetchAllSiteIssues({ status = null } = {}) {
  let query = supabase
    .from('site_issues')
    .select('id,user_id,email,issue_type,title,description,status,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (status) {
    if (!SITE_ISSUE_STATUSES.includes(status)) throw new Error('حالة غير صالحة');
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];

  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  if (!userIds.length) return rows;

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id,الاسم')
    .in('user_id', userIds);

  if (profileError) {
    return rows;
  }

  const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.الاسم]));

  return rows.map((row) => ({
    ...row,
    reporter_name: row.user_id ? (nameMap.get(row.user_id) || null) : null,
  }));
}

export async function getOpenSiteIssues() {
  return fetchAllSiteIssues().then((rows) =>
    rows.filter((row) => ['new', 'open', 'in_progress'].includes(row.status))
  );
}

export async function updateSiteIssue(issueId, updates = {}) {
  if (!issueId) throw new Error('معرّف بلاغ الموقع مطلوب');
  const next = {};

  if (updates.status !== undefined) {
    if (!SITE_ISSUE_STATUSES.includes(updates.status)) throw new Error('حالة غير صالحة');
    next.status = updates.status;
  }

  if (updates.admin_note !== undefined) next.admin_note = updates.admin_note;
  if (!Object.keys(next).length) throw new Error('لا توجد تغييرات صالحة');

  const { data, error } = await supabase
    .from('site_issues')
    .update(next)
    .eq('id', issueId)
    .select('id,user_id,email,issue_type,title,description,status,created_at,updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateSiteIssueStatus(issueId, status) {
  return updateSiteIssue(issueId, { status });
}
