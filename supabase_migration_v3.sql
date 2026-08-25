-- عفاف حضرموت نت — نظام المشرفين والبلاغات والأعطال وسجل الإجراءات
create extension if not exists pgcrypto;
alter table public.profiles add column if not exists admin_role text;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_admin_role_check;
alter table public.profiles add constraint profiles_admin_role_check check (admin_role is null or admin_role in ('owner','moderator','limited'));
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active','blocked'));

create or replace function public.current_admin_role() returns text language sql stable security definer set search_path=public as $$ select p.admin_role from public.profiles p where p.user_id=auth.uid() limit 1; $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles p where p.user_id=auth.uid() and (p.is_admin=true or p.admin_role is not null)); $$;

create table if not exists public.admin_audit_log(id uuid primary key default gen_random_uuid(),admin_user_id uuid not null references auth.users(id) on delete restrict,action text not null,target_type text,target_id uuid,details jsonb default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.site_issues(id uuid primary key default gen_random_uuid(),reporter_id uuid references auth.users(id) on delete set null,name text,email text,page_url text,description text not null,screenshot_url text,status text not null default 'new' check(status in ('new','in_review','resolved','closed')),assigned_to uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.reports add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.contact_requests add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.contact_requests add column if not exists reviewed_at timestamptz;

alter table public.admin_audit_log enable row level security;
alter table public.site_issues enable row level security;
drop policy if exists "site_issues_insert_authenticated" on public.site_issues;
drop policy if exists "site_issues_insert_public" on public.site_issues;
drop policy if exists "site_issues_select_admin" on public.site_issues;
drop policy if exists "site_issues_update_admin" on public.site_issues;
drop policy if exists "audit_select_admin" on public.admin_audit_log;
drop policy if exists "audit_insert_admin" on public.admin_audit_log;
create policy "site_issues_insert_authenticated" on public.site_issues for insert to authenticated with check(reporter_id=auth.uid() or reporter_id is null);
create policy "site_issues_insert_public" on public.site_issues for insert to anon with check(reporter_id is null);
create policy "site_issues_select_admin" on public.site_issues for select to authenticated using(public.is_admin());
create policy "site_issues_update_admin" on public.site_issues for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "audit_select_admin" on public.admin_audit_log for select to authenticated using(public.is_admin());
create policy "audit_insert_admin" on public.admin_audit_log for insert to authenticated with check(admin_user_id=auth.uid() and public.is_admin());

create or replace function public.set_admin_role(p_user_id uuid,p_role text) returns boolean language plpgsql security definer set search_path=public as $$ declare r text; begin r:=public.current_admin_role(); if r<>'owner' then raise exception 'غير مصرح: يلزم المشرف الرئيسي'; end if; if p_role is not null and p_role not in ('owner','moderator','limited') then raise exception 'دور غير صالح'; end if; update public.profiles set admin_role=p_role,is_admin=(p_role is not null) where user_id=p_user_id; insert into public.admin_audit_log(admin_user_id,action,target_type,target_id,details) values(auth.uid(),'تغيير صلاحية مشرف','user',p_user_id,jsonb_build_object('role',p_role)); return true; end; $$;
create or replace function public.log_admin_action(p_action text,p_target_type text,p_target_id uuid,p_details jsonb default '{}'::jsonb) returns boolean language plpgsql security definer set search_path=public as $$ begin if not public.is_admin() then raise exception 'غير مصرح'; end if; insert into public.admin_audit_log(admin_user_id,action,target_type,target_id,details) values(auth.uid(),p_action,p_target_type,p_target_id,coalesce(p_details,'{}'::jsonb)); return true; end; $$;
create or replace function public.set_user_status(p_user_id uuid,p_status text) returns boolean language plpgsql security definer set search_path=public as $$ declare r text; begin r:=public.current_admin_role(); if r not in ('owner','moderator') then raise exception 'غير مصرح'; end if; if p_status not in ('active','blocked') then raise exception 'حالة غير صالحة'; end if; update public.profiles set account_status=p_status where user_id=p_user_id; insert into public.admin_audit_log(admin_user_id,action,target_type,target_id,details) values(auth.uid(),case when p_status='blocked' then 'حظر مستخدم' else 'رفع حظر مستخدم' end,'user',p_user_id,jsonb_build_object('status',p_status)); return true; end; $$;
create or replace function public.admin_delete_message(p_message_id uuid) returns boolean language plpgsql security definer set search_path=public as $$ declare r text; begin r:=public.current_admin_role(); if r not in ('owner','moderator') then raise exception 'غير مصرح'; end if; delete from public.messages where id=p_message_id; insert into public.admin_audit_log(admin_user_id,action,target_type,target_id) values(auth.uid(),'حذف رسالة','message',p_message_id); return true; end; $$;

-- حماية حالة الحساب من التعديل الذاتي.
create or replace function public.protect_account_status() returns trigger language plpgsql security definer set search_path=public as $$ begin if new.account_status is distinct from old.account_status and not public.is_admin() then new.account_status:=old.account_status; end if; return new; end; $$;
drop trigger if exists protect_profile_account_status on public.profiles;
create trigger protect_profile_account_status before update on public.profiles for each row execute function public.protect_account_status();

create or replace function public.touch_site_issue() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists site_issues_touch on public.site_issues;
create trigger site_issues_touch before update on public.site_issues for each row execute function public.touch_site_issue();

-- سياسات الإدارة للجداول الموجودة. لا نحذف سياسات المستخدمين الحالية.
drop policy if exists "admins_select_reports" on public.reports;
drop policy if exists "admins_update_reports" on public.reports;
drop policy if exists "admins_select_requests" on public.contact_requests;
drop policy if exists "admins_update_requests" on public.contact_requests;
drop policy if exists "admins_select_profiles" on public.profiles;
create policy "admins_select_reports" on public.reports for select to authenticated using(public.is_admin());
create policy "admins_update_reports" on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins_select_requests" on public.contact_requests for select to authenticated using(public.is_admin() or sender_user_id=auth.uid() or receiver_user_id=auth.uid());
create policy "admins_update_requests" on public.contact_requests for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins_select_profiles" on public.profiles for select to authenticated using(public.is_admin() or user_id=auth.uid());

-- بعد التنفيذ عيّن حسابك الرئيسي مرة واحدة:
-- update public.profiles set admin_role='owner', is_admin=true where user_id='ضع-UUID-حسابك';
