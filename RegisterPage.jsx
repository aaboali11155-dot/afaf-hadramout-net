import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUp } from '../services/authService';

export default function RegisterPage({ selectedSection, setCurrentUser }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedOath, setAcceptedOath] = useState(false);
  const [oathError, setOathError] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedOath) {
      setOathError(true);
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const { user, session } = await signUp({
        email: formData.email,
        password: formData.password,
        gender: selectedSection || 'male',
        acceptedOath,
      });

      if (user && !session) {
        setEmailConfirmationSent(true);
      } else if (user && session) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          gender: selectedSection || 'male',
          role: 'user',
          isActive: true,
          profileId: null,
        });
        navigate('/profile/create');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: err.message || 'حدث خطأ أثناء التسجيل' }));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSection) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-3 text-xl font-bold text-gray-900">يجب اختيار القسم أولاً</h2>
          <p className="mb-6 text-gray-600">الرجاء اختيار قسم الشباب أو البنات للمتابعة.</p>
          <Link to="/select-section" className="btn-primary w-full">
            اختيار القسم
          </Link>
        </div>
      </div>
    );
  }

  if (emailConfirmationSent) {
    return (
      <div className="mx-auto max-w-lg py-6">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="section-title mb-3">تم إنشاء الحساب</h1>
          <p className="mb-4 text-sm leading-relaxed text-gray-700">
            أرسلنا رابط تأكيد إلى بريدك الإلكتروني:
          </p>
          <p className="mb-6 text-base font-bold text-brand-700" dir="ltr">
            {formData.email}
          </p>
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            تم إنشاء حسابك بنجاح، وتم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى مراجعة بريدك والضغط على رابط التأكيد لتفعيل الحساب.
          </p>
          <Link to="/login" className="btn-primary inline-block w-full">
            الذهاب إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Shield size={28} />
          </div>
          <h1 className="section-title mb-2">إنشاء حساب جديد</h1>
          <p className="text-sm text-gray-600">
            {selectedSection === 'male' ? 'قسم الشباب' : 'قسم البنات'} - خطوة نحو الزواج الشرعي
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="example@email.com"
              dir="ltr"
            />
            {errors.email && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {errors.password}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">تأكيد كلمة المرور</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {errors.confirmPassword}</p>}
          </div>

          {/* Oath Section */}
          <div className={`rounded-2xl border-2 p-4 transition-colors ${acceptedOath ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="mb-3 flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <span className="text-xs font-bold">ﷲ</span>
              </div>
              <p className="text-base font-bold leading-relaxed text-gray-900">
                أقسم بالله العلي العظيم أنني داخل هذا الموقع بنية الزواج الشرعي، وأن لا أستخدمه لأي غرض آخر،
                وأن أحافظ على آداب الإسلام والخلق في جميع تعاملاتي.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <input
                type="checkbox"
                checked={acceptedOath}
                onChange={(e) => {
                  setAcceptedOath(e.target.checked);
                  setOathError(false);
                }}
                className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                أوافق على هذا الإقرار الشرعي والأخلاقي
              </span>
            </label>

            {oathError && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> يجب الموافقة على الإقرار للمتابعة
              </p>
            )}

            {acceptedOath && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-700">
                <CheckCircle2 size={14} />
                تم قبول الإقرار
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب والمتابعة'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            سجّل دخولك
          </Link>
        </p>
      </div>
    </div>
  );
}