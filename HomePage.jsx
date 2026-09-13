import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Search, MessageSquare, Users, Lock, Mail, Instagram, Info, Lightbulb } from 'lucide-react';

export default function HomePage({ currentUser }) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-brand-900 px-6 py-16 text-center text-white sm:px-12 sm:py-24">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-700/30 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
            <Heart size={14} className="text-brand-300" fill="currentColor" />
            <span>منصة زواج خيري مجانية - نبدأ من حضرموت</span>
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            عفاف حضرموت نت
          </h1>

          <p className="mb-8 text-lg leading-relaxed text-brand-100 sm:text-xl">
            منصة خيرية تهدف إلى تسهيل الزواج الشرعي بأمان وخصوصية، حيث نربط بين الراغبين في الزواج
            في حضرموت والمناطق المجاورة وفق الضوابط الشرعية والأخلاقية.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {currentUser ? (
              <Link to="/profiles" className="btn-primary min-w-[180px]">
                <Search size={18} />
                استعراض الملفات
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary min-w-[180px]">
                  <Heart size={18} />
                  سجّل الآن
                </Link>
                <Link to="/login" className="btn-secondary min-w-[180px]">
                  لدي حساب بالفعل
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="section-title mb-3">لماذا عفاف حضرموت نت؟</h2>
          <p className="mx-auto max-w-2xl text-gray-600">منصة مصممة لتكون آمنة، شرعية، ومحترمة للخصوصية</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'مراقبة المشرفين',
              desc: 'كل الرسائل تمر بمراجعة المشرف قبل الوصول للطرف الآخر لضمان الأمان والاحترام.',
            },
            {
              icon: Lock,
              title: 'خصوصية عالية',
              desc: 'لا نعرض البيانات الحساسة للعامة. المعلومات الشخصية تظل محمية.',
            },
            {
              icon: Users,
              title: 'توافق ذكي',
              desc: 'استعرض الملفات المتوافقة مع مواصفات شريك حياتك المطلوبة.',
            },
            {
              icon: Search,
              title: 'بحث وتصفية',
              desc: 'صقل نتائج البحث حسب العمر، المدينة، الحالة الاجتماعية، والمستوى التعليمي.',
            },
            {
              icon: MessageSquare,
              title: 'تواصل محترم',
              desc: 'راسل بطريقة مهذبة وشرعية، مع التزام تام بآداب الحوار الإسلامي.',
            },
            {
              icon: Heart,
              title: 'مجاني بالكامل',
              desc: 'المنصة خيرية ولا تتقاضى أي رسوم على التسجيل أو التواصل.',
            },
          ].map((feature, idx) => (
            <div key={idx} className="card transition-all hover:-translate-y-1 hover:shadow-lift">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <feature.icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-[2.5rem] bg-white p-8 shadow-soft sm:p-12">
        <div className="mb-10 text-center">
          <h2 className="section-title mb-3">كيف يعمل الموقع؟</h2>
          <p className="text-gray-600">خطوات بسيطة للوصول إلى شريك حياتك</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '01', title: 'اختر القسم', desc: 'حدد ما إذا كنت شاباً أو فتاة' },
            { step: '02', title: 'أنشئ حسابك', desc: 'سجل بريدك وكلمة المرور واقسم بالنية الصادقة' },
            { step: '03', title: 'املأ ملفك', desc: 'أدخل بياناتك ومواصفات شريك حياتك المطلوب' },
            { step: '04', title: 'تواصل', desc: 'ابحث عن الملفات المتوافقة وارسل رسالة للمشرف' },
          ].map((item, idx) => (
            <div key={idx} className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">
                {item.step}
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="rounded-[2.5rem] bg-brand-600 px-6 py-14 text-white sm:px-12 sm:py-20">
          <h2 className="mb-4 font-serif text-3xl font-bold sm:text-4xl">ابدأ رحلة الزواج الشرعي الآن</h2>
          <p className="mx-auto mb-8 max-w-2xl text-brand-100">
            انضم إلى منصة عفاف حضرموت نت وكن جزءاً من مبادرة خيرية تهدف إلى استقرار الأسرة والمجتمع.
          </p>
          <Link
            to={currentUser ? '/profiles' : '/register'}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-soft transition-all hover:bg-brand-50 hover:shadow-lift active:scale-95"
          >
            <Heart size={20} />
            {currentUser ? 'استعرض الملفات' : 'سجّل حساباً جديداً'}
          </Link>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="rounded-[2.5rem] bg-white p-8 shadow-soft sm:p-10" aria-label="معلومات وتواصل عفاف حضرموت نت">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Info size={20} className="text-brand-600" />
              حول عفاف
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              عفاف حضرموت نت منصة زواج خيرية مجانية تهدف إلى تسهيل الزواج الشرعي بأمان وخصوصية، ونبدأ من حضرموت.
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Mail size={20} className="text-brand-600" />
              تواصل معنا
            </div>
            <a href="mailto:afafhadramout@gmail.com" className="mb-3 flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-brand-600">
              <Mail size={17} />
              afafhadramout@gmail.com
            </a>
            <a href="https://www.instagram.com/afafhadramout" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-brand-600">
              <Instagram size={17} />
              @afafhadramout
            </a>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Lightbulb size={20} className="text-brand-600" />
              الاقتراحات
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              لديك فكرة أو اقتراح لتطوير عفاف؟ يسعدنا استقبال مقترحاتك.
            </p>
            <a href="mailto:afafhadramout@gmail.com?subject=اقتراح لتطوير عفاف حضرموت نت" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 transition-colors hover:text-brand-800">
              <Lightbulb size={17} />
              أرسل اقتراحك
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs text-gray-500">
          عفاف حضرموت نت — منصة زواج خيري مجانية
        </div>
      </footer>
    </div>
  );
}