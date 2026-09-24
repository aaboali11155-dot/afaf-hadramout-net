import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { signIn } from '../services/authService';
import { fetchProfileByUserId } from '../services/profileService';

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