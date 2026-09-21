-- Run this in Supabase SQL Editor only if the current messages INSERT policy blocks admins.
-- Allows authenticated admins to send a message directly to a user from the admin profile page.

drop policy if exists messages_insert_admin on public.messages;
create policy messages_insert_admin
on public.messages
for insert
with check (public.is_admin_user());
