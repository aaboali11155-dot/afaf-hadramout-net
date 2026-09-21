-- FIX 10 — Site issue reports / RLS
-- This file targets the existing public.site_issues table. It does not create a new table.

-- Users/authenticated visitors can insert their own report.
drop policy if exists "users_insert_site_issues" on public.site_issues;
create policy "users_insert_site_issues"
on public.site_issues
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

-- Owners/moderators can read all site issues.
drop policy if exists "admins_select_site_issues" on public.site_issues;
create policy "admins_select_site_issues"
on public.site_issues
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
      and (p.admin_role = 'owner' or p.admin_role = 'moderator')
  )
);

-- Owners/moderators can update site issue status.
drop policy if exists "admins_update_site_issues" on public.site_issues;
create policy "admins_update_site_issues"
on public.site_issues
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
      and (p.admin_role = 'owner' or p.admin_role = 'moderator')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
      and (p.admin_role = 'owner' or p.admin_role = 'moderator')
  )
);
