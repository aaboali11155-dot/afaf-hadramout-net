import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function EmailConfirmedPage() {
  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#120024] text-[#01cdfe]">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mb-3 font-press text-lg leading-relaxed text-[#ff71ce]">
          تأكيد البريد الإلكتروني
        </h1>
        <p className="mb-6 font-vt323 text-2xl leading-relaxed text-[#fffb96]">
          تم تأكيد بريدك الإلكتروني بنجاح.
        </p>
        <p className="mb-8 font-vt323 text-xl leading-relaxed text-[#01cdfe]">
          يمكنك الآن الدخول إلى حسابك وإكمال ملفك الشخصي.
        </p>
        <Link
          to="/login"
          className="inline-block w-full rounded-lg border-b-4 border-[#ff71ce]/50 bg-gradient-to-r from-[#ff71ce] to-[#01cdfe] px-6 py-3 text-center font-press text-xs leading-relaxed text-[#120024] shadow-[0_0_15px_rgba(255,113,206,0.4)] transition hover:translate-y-[-2px] hover:shadow-[0_0_25px_rgba(255,113,206,0.6)] active:translate-y-[1px] active:border-b-0"
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
