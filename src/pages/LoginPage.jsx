import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { signIn, signInWithGoogle } from '../services/authService';
import { fetchProfileByUserId } from '../services/profileService';

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function LoginPage({ setCurrentUser }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (!user) {
        setError('فشل تسجيل الدخول');
        return;
      }

      setCurrentUser({
        id: user.id,
        email: user.email,
        gender: user.user_metadata?.gender || 'male',
        role: 'user',
        isActive: true,
        profileId: null,
      });

      const profile = await fetchProfileByUserId(user.id);
      const complete = !!profile && !!profile.الاسم && !!profile.العمر && !!profile.المدينة && !!profile.الحالة_الاجتماعية && !!profile.المؤهل_الدراسي && !!profile.الوظيفة && !!profile.الطول && !!(profile['لون البشرة'] || profile.لون_البشرة) && !!profile.قبلي_او_حضري && !!profile.مستوى_التدين;
      navigate(complete ? '/' : '/profile/create');
    } catch (err) {
      setError(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <LogIn size={28} />
          </div>
          <h1 className="section-title mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-gray-600">أهلاً بك مجدداً في عفاف حضرموت نت</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

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
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-white px-4 text-xs font-semibold text-gray-500">
            أو
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            setError('');
            setLoading(true);
            try {
              await signInWithGoogle();
            } catch (err) {
              setError(err.message || 'فشل المتابعة باستخدام Google');
              setLoading(false);
            }
          }}
          className="btn-secondary flex w-full items-center justify-center gap-2 border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          <GoogleIcon />
          <span>المتابعة باستخدام Google</span>
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            ليس لديك حساب؟{' '}
            <Link to="/select-section" className="font-semibold text-brand-700 hover:underline">
              سجّل الآن
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}