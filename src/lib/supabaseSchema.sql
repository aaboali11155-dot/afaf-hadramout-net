-- عفاف حضرموت نت - مخطط Supabase الكامل
-- شغّل هذا الملف في Supabase SQL Editor قبل تشغيل الموقع.

create extension if not exists pgcrypto;

-- 1) بيانات المستخدم المرتبطة بـ Supabase Auth
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  gender text check (gender in ('male','female')),
  role text not null default 'user' check (role in ('user','admin')),
  is_active boolean not null default true,
  accepted_oath boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) الملف الشخصي
-- الحقول العربية موجودة لأن الواجهة الحالية تعتمد عليها.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  الاسم text,
  العمر integer check (العمر is null or (العمر >= 18 and العمر <= 80)),
  الجنس text check (الجنس is null or الجنس in ('male','female')),
  gender text check (gender is null or gender in ('male','female')),
  المدينة text,
  الحالة_الاجتماعية text,
  المؤهل_الدراسي text,
  الوظيفة text,
  الطول integer check (الطول is null or (الطول >= 100 and الطول <= 250)),
  "لون البشرة" text,
  لون_البشرة text,
  قبلي_او_حضري text,
  مستوى_التدين text,
  نبذة_عن_نفسه text,
  الحالة_الصحية text,
  الحالة_المادية text,
  إقرار_الزواج boolean not null default false,
  is_admin boolean not null default false,
  admin_role text,
  admin_permissions jsonb not null default '[]'::jsonb,
  account_status text not null default 'pending' check (account_status in ('pending','active','suspended')),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) تفضيلات الشريك
create table if not exists public.partner_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  user_id uuid references public.users(id) on delete cascade not null,
  preferred_gender text check (preferred_gender in ('male','female')),
  min_age integer,
  max_age integer,
  preferred_city text,
  preferred_education text,
  preferred_skin text,
  preferred_tribal text,
  preferred_social_status text,
  preferred_occupation text,
  preferred_religious_level text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) طلبات التواصل
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.users(id) on delete cascade not null,
  receiver_user_id uuid references public.users(id) on delete cascade not null,
  message text,
  request_type text default 'private',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) الرسائل بعد الموافقة، مع مرورها بحالة مراجعة المشرف
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6) الإشعارات
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null default 'general',
  link text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7) مشاهدات الملفات
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid references public.users(id) on delete cascade not null,
  viewed_user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(viewer_id, viewed_user_id)
);

-- 8) مشاكل الموقع
create table if not exists public.site_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  issue_type text not null default 'bug',
  title text,
  description text not null,
  status text not null default 'new' check (status in ('new','open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9) بلاغات المستخدمين
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete cascade not null,
  reported_user_id uuid references public.users(id) on delete cascade not null,
  reason text not null,
  details text default '',
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10) حظر المستخدمين
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.users(id) on delete cascade not null,
  blocked_id uuid references public.users(id) on delete cascade not null,
  reason text default '',
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- 11) سجل أعمال المشرف
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details text default '',
  created_at timestamptz not null default now()
);

-- تحديث تلقائي لـ updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists partner_preferences_updated_at on public.partner_preferences;
create trigger partner_preferences_updated_at before update on public.partner_preferences for each row execute function public.set_updated_at();
drop trigger if exists contact_requests_updated_at on public.contact_requests;
create trigger contact_requests_updated_at before update on public.contact_requests for each row execute function public.set_updated_at();
drop trigger if exists site_issues_updated_at on public.site_issues;
create trigger site_issues_updated_at before update on public.site_issues for each row execute function public.set_updated_at();
drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();

-- إنشاء users عند التسجيل، مع أخذ الجنس والإقرار من user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, gender, role, accepted_oath)
  values (
    new.id,
    coalesce(new.email, ''),
    case when new.raw_user_meta_data->>'gender' in ('male','female') then new.raw_user_meta_data->>'gender' else null end,
    'user',
    coalesce((new.raw_user_meta_data->>'accepted_oath')::boolean, false)
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- دالة آمنة لفحص المشرف، لتجنب recursion في سياسات RLS.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true);
$$;

-- RLS
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.partner_preferences enable row level security;
alter table public.contact_requests enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.profile_views enable row level security;
alter table public.site_issues enable row level security;
alter table public.reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.admin_audit_log enable row level security;

-- إعادة تشغيل آمنة للسياسات عند إعادة تنفيذ الملف
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('users','profiles','partner_preferences','contact_requests','messages','notifications','profile_views','site_issues','reports','user_blocks','admin_audit_log')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- users
create policy users_select_own on public.users for select using (auth.uid() = id or public.is_admin_user());
create policy users_insert_own on public.users for insert with check (auth.uid() = id);
create policy users_update_admin on public.users for update using (public.is_admin_user()) with check (public.is_admin_user());

-- profiles
create policy profiles_select_public on public.profiles for select using ((account_status='active' and is_hidden=false) or auth.uid()=user_id or public.is_admin_user());
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles for update using (auth.uid()=user_id or public.is_admin_user()) with check (auth.uid()=user_id or public.is_admin_user());

-- partner preferences
create policy partner_select_own_or_admin on public.partner_preferences for select using (auth.uid()=user_id or public.is_admin_user());
create policy partner_insert_own on public.partner_preferences for insert with check (auth.uid()=user_id);
create policy partner_update_own_or_admin on public.partner_preferences for update using (auth.uid()=user_id or public.is_admin_user()) with check (auth.uid()=user_id or public.is_admin_user());

-- contact requests
create policy contact_select_participants_or_admin on public.contact_requests for select using (auth.uid() in (sender_user_id, receiver_user_id) or public.is_admin_user());
create policy contact_insert_sender on public.contact_requests for insert with check (auth.uid()=sender_user_id);
create policy contact_update_admin_only on public.contact_requests for update using (public.is_admin_user()) with check (public.is_admin_user());

-- messages: لا يرى المستخدم إلا الرسائل المعتمدة، والمشرف يرى الجميع.
create policy messages_select_participants_or_admin on public.messages
for select using ((status='approved' and auth.uid() in (sender_id, receiver_id)) or public.is_admin_user());

create policy messages_insert_sender_after_approval on public.messages
for insert with check (
  auth.uid()=sender_id
  and exists (
    select 1 from public.contact_requests cr
    where cr.status='approved'
      and ((cr.sender_user_id=auth.uid() and cr.receiver_user_id=receiver_id)
        or (cr.receiver_user_id=auth.uid() and cr.sender_user_id=receiver_id))
  )
);

create policy messages_update_admin on public.messages
for update using (public.is_admin_user()) with check (public.is_admin_user());

-- notifications
create policy notifications_select_own_or_admin on public.notifications for select using (auth.uid()=user_id or public.is_admin_user());
create policy notifications_update_own_or_admin on public.notifications for update using (auth.uid()=user_id or public.is_admin_user()) with check (auth.uid()=user_id or public.is_admin_user());
create policy notifications_insert_admin on public.notifications for insert with check (public.is_admin_user());

-- profile views
create policy views_select_participant_or_admin on public.profile_views for select using (auth.uid() in (viewer_id, viewed_user_id) or public.is_admin_user());
create policy views_insert_viewer on public.profile_views for insert with check (auth.uid()=viewer_id);

-- site issues
create policy issues_insert_any on public.site_issues for insert with check (user_id is null or auth.uid()=user_id);
create policy issues_select_admin_or_owner on public.site_issues for select using (auth.uid()=user_id or public.is_admin_user());
create policy issues_update_admin on public.site_issues for update using (public.is_admin_user()) with check (public.is_admin_user());

-- reports
create policy reports_insert_reporter on public.reports for insert with check (auth.uid()=reporter_id);
create policy reports_select_reporter_or_admin on public.reports for select using (auth.uid()=reporter_id or public.is_admin_user());
create policy reports_update_admin on public.reports for update using (public.is_admin_user()) with check (public.is_admin_user());

-- blocks
create policy blocks_select_owner_or_admin on public.user_blocks for select using (auth.uid()=blocker_id or public.is_admin_user());
create policy blocks_insert_owner on public.user_blocks for insert with check (auth.uid()=blocker_id);
create policy blocks_delete_owner_or_admin on public.user_blocks for delete using (auth.uid()=blocker_id or public.is_admin_user());

-- audit log
create policy audit_select_admin on public.admin_audit_log for select using (public.is_admin_user());
create policy audit_insert_admin on public.admin_audit_log for insert with check (public.is_admin_user() and auth.uid()=admin_user_id);

-- فهارس مهمة
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_status_idx on public.profiles(account_status);
create index if not exists profiles_is_hidden_idx on public.profiles(is_hidden);
create index if not exists contact_requests_receiver_idx on public.contact_requests(receiver_user_id, status);
create index if not exists messages_receiver_idx on public.messages(receiver_id, status, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

-- Notification event triggers are also included here for reference/migrations.
create or replace function public.create_system_notification(
  p_user_id uuid, p_title text, p_body text, p_type text default 'general',
  p_link text default null, p_related_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id,title,body,type,link,related_id,is_read)
  values (p_user_id,p_title,p_body,p_type,p_link,p_related_id,false);
end; $$;

create or replace function public.notify_contact_request_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op='INSERT' then
    perform public.create_system_notification(new.receiver_user_id,'طلب تواصل جديد','لديك طلب تواصل جديد يحتاج إلى مراجعتك.','contact_request','/contact-requests',new.id);
  elsif tg_op='UPDATE' and old.status is distinct from new.status then
    if new.status='approved' then
      perform public.create_system_notification(new.sender_user_id,'تم قبول طلب التواصل','تم قبول طلب التواصل الخاص بك ويمكنك متابعة المحادثة.','contact_request','/messages',new.id);
    elsif new.status='rejected' then
      perform public.create_system_notification(new.sender_user_id,'تم رفض طلب التواصل','تم رفض طلب التواصل الخاص بك بعد مراجعة المشرف.','contact_request','/contact-requests',new.id);
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists contact_requests_notifications_insert on public.contact_requests;
create trigger contact_requests_notifications_insert after insert on public.contact_requests for each row execute function public.notify_contact_request_event();
drop trigger if exists contact_requests_notifications_update on public.contact_requests;
create trigger contact_requests_notifications_update after update of status on public.contact_requests for each row execute function public.notify_contact_request_event();

create or replace function public.notify_message_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status='approved' and (tg_op='INSERT' or old.status is distinct from new.status) then
    perform public.create_system_notification(new.receiver_id,'رسالة جديدة','لديك رسالة جديدة في المحادثة.','message','/messages',new.id);
  end if;
  return new;
end; $$;
drop trigger if exists messages_notifications on public.messages;
create trigger messages_notifications after insert or update of status on public.messages for each row execute function public.notify_message_event();

create or replace function public.notify_profile_view_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.viewer_id <> new.viewed_user_id then
    perform public.create_system_notification(new.viewed_user_id,'شخص زار ملفك','تمت زيارة ملفك الشخصي.','profile_view','/profile-views',new.id);
  end if;
  return new;
end; $$;
drop trigger if exists profile_views_notifications on public.profile_views;
create trigger profile_views_notifications after insert on public.profile_views for each row execute function public.notify_profile_view_event();


-- 24) حماية إدارة المشرفين: المالك فقط يستطيع تغيير صلاحيات المشرفين، وبحد أقصى مشرفين إضافيين.
alter table public.profiles add column if not exists admin_permissions jsonb not null default '[]'::jsonb;
create or replace function public.protect_admin_fields() returns trigger
language plpgsql security definer set search_path = public as $$
declare caller_is_owner boolean;
declare other_admins integer;
begin
  select exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true and p.admin_role = 'owner') into caller_is_owner;
  if (new.is_admin is distinct from old.is_admin or new.admin_role is distinct from old.admin_role or new.admin_permissions is distinct from old.admin_permissions) then
    if not caller_is_owner then
      raise exception 'فقط المالك يستطيع إدارة صلاحيات المشرفين';
    end if;
    if new.is_admin = true and new.admin_role <> 'owner' then
      select count(*) into other_admins from public.profiles p where p.is_admin = true and p.admin_role <> 'owner' and p.user_id <> old.user_id;
      if other_admins >= 2 then
        raise exception 'تم الوصول إلى الحد الأقصى: مشرفان إضافيان فقط';
      end if;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists protect_admin_fields_trigger on public.profiles;
create trigger protect_admin_fields_trigger before update on public.profiles for each row execute function public.protect_admin_fields();
