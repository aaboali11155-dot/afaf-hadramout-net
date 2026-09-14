import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  User,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { fetchProfileById, updateProfile } from '../services/profileService';

export default function AdminProfileDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }
    async function loadProfile() {
      try {
        const data = await fetchProfileById(id, { admin: true });
        setProfile(data);
      } catch (err) {
        setError(err.message || 'تعذر تحميل الملف الشخصي');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id, currentUser, navigate]);

  const handleStatusChange = async (accountStatus) => {
    try {
      await updateProfile(id, { account_status: accountStatus });
      setProfile((prev) => ({ ...prev, account_status: accountStatus }));
    } catch (err) {
      setError(err.message || 'تعذر تحديث حالة الملف');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl bg-red-50 p-6 text-red-600">
          <p>{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-white"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">الملف الشخصي غير موجود</p>
      </div>
    );
  }

  const fieldClass = 'rounded-xl bg-gray-50 p-4';
  const labelClass = 'mb-1 text-sm text-gray-500';
  const valueClass = 'font-semibold text-gray-900';

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          <ArrowRight size={16} />
          العودة للوحة التحكم
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.الاسم}</h1>
            <p className="text-gray-500">{profile.الجنس === 'male' ? 'ذكر' : 'أنثى'} • {profile.المدينة}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.is_hidden ? (
            <>
              <button
                onClick={async () => { try { await updateProfile(id, { is_hidden: false }); setProfile((prev) => ({ ...prev, is_hidden: false })); } catch (err) { setError(err.message || 'تعذر إظهار الملف'); } }}
                className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
              >
                <Eye size={16} /> إظهار الملف
              </button>
              <button
                onClick={() => handleStatusChange('suspended')}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Ban size={16} /> تعليق
              </button>
            </>
          ) : profile.account_status === 'active' ? (
            <>
              <button
                onClick={async () => { try { await updateProfile(id, { is_hidden: true }); setProfile((prev) => ({ ...prev, is_hidden: true })); } catch (err) { setError(err.message || 'تعذر إخفاء الملف'); } }}
                className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <EyeOff size={16} /> إخفاء الملف
              </button>
              <button
                onClick={() => handleStatusChange('suspended')}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Ban size={16} /> تعليق
              </button>
            </>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              <CheckCircle2 size={16} /> تفعيل الملف
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <User size={20} className="text-brand-600" />
              البيانات الشخصية
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldClass}>
                <p className={labelClass}>الاسم</p>
                <p className={valueClass}>{profile.الاسم}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>العمر</p>
                <p className={valueClass}>{profile.العمر} سنة</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الجنس</p>
                <p className={valueClass}>{profile.الجنس === 'male' ? 'ذكر' : 'أنثى'}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>المدينة</p>
                <p className={valueClass}>{profile.المدينة}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الحالة الاجتماعية</p>
                <p className={valueClass}>{profile.الحالة_الاجتماعية}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>المؤهل الدراسي</p>
                <p className={valueClass}>{profile.المؤهل_الدراسي}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الوظيفة</p>
                <p className={valueClass}>{profile.الوظيفة}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الطول</p>
                <p className={valueClass}>{profile.الطول} سم</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>لون البشرة</p>
                <p className={valueClass}>{profile['لون البشرة'] || profile.لون_البشرة}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>قبلي أو حضري</p>
                <p className={valueClass}>{profile.قبلي_او_حضري}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الحالة الصحية</p>
                <p className={valueClass}>{profile.الحالة_الصحية}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>الحالة المادية</p>
                <p className={valueClass}>{profile.الحالة_المادية}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Heart size={20} className="text-brand-600" />
              نبذة عن نفسه
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {profile.نبذة_عن_نفسه || 'لا يوجد وصف'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Shield size={20} className="text-brand-600" />
              حالة الحساب
            </h2>
            <div className="space-y-3">
              <div className={fieldClass}>
                <p className={labelClass}>الحالة</p>
                <p className={valueClass}>
                  {profile.account_status === 'active' && 'نشط'}
                  {profile.account_status === 'pending' && 'معلق'}
                  {profile.is_hidden && 'مخفي'}
                  {profile.account_status === 'suspended' && 'موقوف'}
                </p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>مشرف</p>
                <p className={valueClass}>{profile.is_admin ? 'نعم' : 'لا'}</p>
              </div>
              {profile.admin_role && (
                <div className={fieldClass}>
                  <p className={labelClass}>دور المشرف</p>
                  <p className={valueClass}>{profile.admin_role}</p>
                </div>
              )}
              <div className={fieldClass}>
                <p className={labelClass}>تاريخ الإنشاء</p>
                <p className={valueClass}>{new Date(profile.created_at).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <MapPin size={20} className="text-brand-600" />
              مواصفات الشريك
            </h2>
            <div className="space-y-3">
              <div className={fieldClass}>
                <p className={labelClass}>الجنس المفضل</p>
                <p className={valueClass}>{profile.partner_preferences?.preferred_gender === 'male' ? 'ذكر' : 'أنثى'}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>العمر</p>
                <p className={valueClass}>
                  {profile.partner_preferences?.min_age} - {profile.partner_preferences?.max_age} سنة
                </p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>المدينة المفضلة</p>
                <p className={valueClass}>{profile.partner_preferences?.preferred_city || 'غير محدد'}</p>
              </div>
              <div className={fieldClass}>
                <p className={labelClass}>المؤهل الدراسي المفضل</p>
                <p className={valueClass}>{profile.partner_preferences?.preferred_education || 'غير محدد'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
