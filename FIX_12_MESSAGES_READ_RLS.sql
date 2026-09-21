alter table public.messages add column if not exists is_read boolean not null default false;

-- FIX 12 — تحقق/إعداد حالة القراءة
-- لا يشغّل هذا الملف تلقائيًا. راجع سياسة RLS الحالية أولاً.

-- إذا كان عمود is_read غير موجود، أضفه:
alter table public.messages
  add column if not exists is_read boolean not null default false;

-- سياسة مقترحة: المستلم يستطيع تعليم رسائله الواردة كمقروءة.
-- لا تحذف سياسات أخرى؛ طبّقها فقط إذا لم توجد سياسة مكافئة في مشروعك.
drop policy if exists "users_mark_received_messages_read" on public.messages;
create policy "users_mark_received_messages_read"
on public.messages
for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());
