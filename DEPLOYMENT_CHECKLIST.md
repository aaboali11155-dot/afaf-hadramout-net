# عفاف حضرموت نت — قائمة النشر

## 1) Node modules
`node_modules` غير مضمّن في هذه النسخة. منصة GitHub/Vercel تثبّت الحزم من `package.json` و`package-lock.json`.

## 2) متغيرات البيئة
في Vercel/بيئة التشغيل أضف:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

لا ترفع `.env.local` أو أي مفاتيح سرية إلى GitHub. ملف `.env.example` مجرد نموذج.

## 3) Supabase
هذه النسخة تحتوي ملفات SQL تاريخية/مساعدة. لا تشغّل `SUPABASE_SETUP.sql` أو `src/lib/supabaseSchema.sql` على مشروع `afaf-hadramout` الحالي بشكل أعمى، لأن قاعدة المشروع الحالية لها جداول وصلاحيات موجودة بالفعل.

قبل تطبيق أي SQL، راجع المخطط والسياسات الحالية. ملفات الإصلاح التي تحتاج تحققًا منفصلًا هي:
- `FIX_06_ADMIN_MESSAGE_POLICY.sql`
- `FIX_08_USER_REPORTS_RLS.sql`
- `FIX_10_SITE_ISSUES_RLS.sql`
- `FIX_12_MESSAGES_READ_RLS.sql`

`FIX_09_RLS_CHECK.sql` و`ADMIN_MANAGEMENT_DB_CHECK.sql` للفحص والتحقق وليسا سكربت إنشاء شامل.

## 4) المشرف الرئيسي
بعد التأكد من حساب المشرف الصحيح في Supabase، يجب أن يكون سجل الحساب في `public.profiles` مضبوطًا على:
- `is_admin = true`
- `admin_role = 'owner'`

ولا تُمنح صلاحيات الإدارة لحساب عادي. تغييرات أدوار المشرفين يجب أن تمر عبر حماية قاعدة البيانات الموجودة في المشروع.

## 5) النشر
1. ارفع الكود بدون `node_modules`.
2. اضبط متغيرات البيئة.
3. اختبر `npm ci` ثم `npm run build` في بيئة النشر أو Codespace.
4. بعد نجاح البناء فقط نفّذ النشر النهائي.
