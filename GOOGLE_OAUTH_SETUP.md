# إعداد وتسجيل الدخول عبر Google (Google OAuth Setup) - عفاف حضرموت نت

تمت إضافة خيار التسجيل وتسجيل الدخول باستخدام حساب Google في موقع **عفاف حضرموت نت** كخيار إضافي بجانب التسجيل بالبريد الإلكتروني وكلمة المرور.

---

## 📁 الملفات المحدثة (Modified Files)

1. **`src/services/authService.js`**:
   - إضافة دالة `signInWithGoogle({ gender, acceptedOath })` لاستدعاء `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
   - حساب رابط التوجيه (`redirectTo`) ديناميكيًا من `window.location.origin` والمسار الأساسي (`BASE_URL`) ليعمل في جميع البيئات (Vercel Production, GitHub Codespaces, Local Development).

2. **`src/pages/LoginPage.jsx`**:
   - إضافة زر "المتابعة باستخدام Google" مع أيقونة Google الرسمية وفاصل "أو" أنيق يتماشى تمامًا مع التصميم والخطوط والألوان الحالية.

3. **`src/pages/RegisterPage.jsx`**:
   - إضافة زر "المتابعة باستخدام Google" مع الحفاظ التام على قسم إقرار الزواج واختيار القسم (شباب/بنات).

4. **`src/pages/ProfileFormPage.jsx`**:
   - عند تسجيل الدخول باستخدام Google لأول مرة، يطلب من المستخدم اختيار القسم (شباب/بنات) والموافقة الإلزامية على إقرار الزواج الشرعي ("أقسم بالله العلي العظيم أنني داخل هذا الموقع بنية الزواج الشرعي...").
   - عدم السماح بحفظ الملف الشخصي أو تصفح المنصة قبل استكمال البيانات والإقرار.

5. **`src/App.jsx`**:
   - حماية المسارات برابط `RequireCompleteProfile` للتأكد من أن مستخدم Google الجديد لا يتجاوز مرحلة إنشائه للملف الشخصي والموافقة على إقرار الزواج قبل استعراض الملفات أو المراسلة.
   - دخول المستخدمين ذوي الملفات الجاهزة (`profiles.user_id = auth.uid()`) مباشرة بشكل طبيعي.

---

## ⚙️ الإعدادات المطلوبة في Google Cloud & Supabase

### 1. إعداد Google Cloud Console
1. ادخل على [Google Cloud Console](https://console.cloud.google.com/).
2. أنشئ مشروعًا جديدًا باسم `Afaf Hadramout Net`.
3. انتقل إلى **APIs & Services** > **OAuth consent screen**:
   - اختر **External**.
   - أدخل اسم التطبيق (`عفاف حضرموت نت`) والبريد الإلكتروني للدعم.
4. انتقل إلى **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Afaf Supabase OAuth`.
   - Authorized JavaScript origins:
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co`
     - `https://afaf-hadramout.vercel.app` (رابط Vercel Production)
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
5. احفظ واحصل على **Client ID** و **Client Secret**.

---

### 2. إعداد Supabase Dashboard
1. ادخل على لوحة تحكم [Supabase](https://supabase.com/dashboard).
2. اختر مشروعك ثم أذهب إلى **Authentication** > **Providers**.
3. ابحث عن **Google** وقم بتمكينه (Enable Provider).
4. أضف القيم:
   - **Client ID**: الصق الـ Client ID من Google Cloud Console.
   - **Client Secret**: الصق الـ Client Secret من Google Cloud Console.
5. في **Authentication** > **URL Configuration**:
   - **Site URL**: ضع رابط الموقع الأساسي (مثل `https://afaf-hadramout.vercel.app`).
   - **Redirect URLs**: أضف روابط البيئات المسموح بها:
     - `http://localhost:5173/`
     - `https://afaf-hadramout.vercel.app/`
     - `https://*.app.github.dev/`

---

## 🔒 ملاحظة الأمان
- لم يتم وضع أي Google Client Secret أو أسرار داخل كود الواجهة أو مستودع GitHub.
- الأسرار والمفاتيح الحساسة تُحفظ فقط بشكل آمن داخل لوحة تحكم Supabase Dashboard.
