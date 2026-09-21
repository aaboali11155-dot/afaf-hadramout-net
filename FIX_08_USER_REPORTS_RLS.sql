-- FIX 08: سياسات بلاغات المستخدمين
-- الجدول الفعلي في المشروع هو public.reports وليس user_reports.
alter table public.reports enable row level security;
drop policy if exists reports_insert_reporter on public.reports;
drop policy if exists reports_select_reporter_or_admin on public.reports;
drop policy if exists reports_update_admin on public.reports;
create policy reports_insert_reporter on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy reports_select_reporter_or_admin on public.reports for select to authenticated using (auth.uid() = reporter_id or public.is_admin_user());
create policy reports_update_admin on public.reports for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
-- فحص: select id, reporter_id, reported_user_id, reason, details, status, created_at from public.reports order by created_at desc limit 20;
