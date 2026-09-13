import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, AlertCircle, Pencil, ArrowRight } from 'lucide-react';
import {
  cities,
  getSocialStatuses,
  getMaritalPreferences,
  educationLevels,
  occupations,
  skinColors,
  origins,
  religiousLevels,
} from '../data/mockData';
import { fetchMyProfile, createProfile, updateProfile } from '../services/profileService';
import { savePartnerPreference } from '../services/partnerPreferenceService';

export default function ProfileFormPage({ currentUser }) {
  const navigate = useNavigate();
  const [existingProfile, setExistingProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    city: '',
    socialStatus: '',
    education: '',
    occupation: '',
    height: '',
    skinColor: '',
    origin: '',
    religiousLevel: '',
    aboutMe: '',
    partnerSpecs: {
      minAge: '',
      maxAge: '',
      cities: [],
      socialStatus: '',
      education: '',
      occupation: '',
      religiousLevel: '',
    },
  });
  const [errors, setErrors] = useState({});
  const socialOptions = getSocialStatuses(currentUser?.gender);
  const partnerMaritalOptions = getMaritalPreferences(currentUser?.gender === 'male' ? 'female' : 'male');

  useEffect(() => {
    if (!currentUser?.id) return;
    async function loadProfile() {
      const profile = await fetchMyProfile(currentUser.id);
      if (profile) {
        setExistingProfile(profile);
        setFormData({
          name: profile.الاسم || '',
          age: profile.العمر || '',
          city: profile.المدينة || '',
          socialStatus: profile.الحالة_الاجتماعية || '',
          education: profile.المؤهل_الدراسي || '',
          occupation: profile.الوظيفة || '',
          height: profile.الطول || '',
          skinColor: profile['لون البشرة'] || profile.لون_البشرة || '',
          origin: profile.قبلي_او_حضري || '',
          religiousLevel: profile.مستوى_التدين || '',
          aboutMe: profile.نبذة_عن_نفسه || '',
          partnerSpecs: {
            minAge: profile.partner_preferences?.min_age || profile.partner_preferences?.[0]?.min_age || '',
            maxAge: profile.partner_preferences?.max_age || profile.partner_preferences?.[0]?.max_age || '',
            cities: profile.partner_preferences?.preferred_city
              ? [profile.partner_preferences.preferred_city]
              : profile.partner_preferences?.[0]?.preferred_city
              ? [profile.partner_preferences[0].preferred_city]
              : [],
            socialStatus: profile.partner_preferences?.preferred_social_status || profile.partner_preferences?.[0]?.preferred_social_status || '',
            education: profile.partner_preferences?.preferred_education || profile.partner_preferences?.[0]?.preferred_education || '',
            occupation: profile.partner_preferences?.preferred_occupation || profile.partner_preferences?.[0]?.preferred_occupation || '',
            religiousLevel: profile.partner_preferences?.preferred_religious_level || profile.partner_preferences?.[0]?.preferred_religious_level || '',
          },
        });
      }
    }
    loadProfile();
  }, [currentUser?.id]);



  if (existingProfile && !editing) {
    const partner = existingProfile.partner_preferences || existingProfile.partner_preferences?.[0] || {};
    const value = (v) => (v === null || v === undefined || v === '' ? 'غير محدد' : v);
    const cityValue = Array.isArray(partner) ? partner[0]?.preferred_city : partner.preferred_city;
    return (
      <div className="mx-auto max-w-3xl py-6">
        <div className="card">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <User size={28} />
            </div>
            <h1 className="section-title mb-2">ملفي الشخصي</h1>
            <p className="text-sm text-gray-600">هذه هي البيانات المحفوظة في ملفك</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['الاسم', existingProfile.الاسم],
              ['العمر', existingProfile.العمر],
              ['المدينة', existingProfile.المدينة],
              ['الحالة الاجتماعية', existingProfile.الحالة_الاجتماعية],
              ['المؤهل الدراسي', existingProfile.المؤهل_الدراسي],
              ['الوظيفة', existingProfile.الوظيفة],
              ['الطول', existingProfile.الطول ? `${existingProfile.الطول} سم` : ''],
              ['لون البشرة', existingProfile['لون البشرة'] || existingProfile.لون_البشرة],
              ['الأصل', existingProfile.قبلي_او_حضري],
              ['مستوى التدين', existingProfile.مستوى_التدين],
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl bg-gray-50 p-4">
                <div className="mb-1 text-xs font-medium text-gray-500">{label}</div>
                <div className="font-semibold text-gray-900">{value(val)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="mb-1 text-xs font-medium text-gray-500">نبذة عني</div>
            <div className="whitespace-pre-wrap font-medium text-gray-900">{value(existingProfile.نبذة_عن_نفسه)}</div>
          </div>

          <div className="mt-6 rounded-2xl bg-brand-50/60 p-4">
            <h2 className="mb-4 text-lg font-bold text-gray-900">مواصفات الشريك المطلوبة</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['العمر', partner.min_age && partner.max_age ? `${partner.min_age} - ${partner.max_age}` : 'غير محدد'],
                ['المدينة', cityValue],
                ['الحالة الاجتماعية', partner.preferred_social_status],
                ['المؤهل الدراسي', partner.preferred_education],
                ['الوظيفة', partner.preferred_occupation],
                ['مستوى التدين', partner.preferred_religious_level],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-white/70 p-3">
                  <div className="mb-1 text-xs font-medium text-gray-500">{label}</div>
                  <div className="font-semibold text-gray-900">{value(val)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => { setEditing(true); setStep(1); }} className="btn-primary">
              <Pencil size={18} />
              تعديل الملف
            </button>
            <button type="button" onClick={() => navigate('/profiles')} className="btn-secondary">
              <ArrowRight size={18} />
              العودة للملفات
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-3 text-xl font-bold text-gray-900">يجب تسجيل الدخول أولاً</h2>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
      if (!formData.age || formData.age < 18 || formData.age > 80) newErrors.age = 'العمر يجب أن يكون بين 18 و80';
      if (!formData.city) newErrors.city = 'اختر المدينة';
      if (!formData.socialStatus) newErrors.socialStatus = 'اختر الحالة الاجتماعية';
      if (currentUser?.gender === 'female' && formData.socialStatus === 'married') newErrors.socialStatus = 'لا يمكن للمتزوجة التسجيل كطالبة زواج';
      if (!formData.education) newErrors.education = 'اختر المؤهل الدراسي';
      if (!formData.occupation) newErrors.occupation = 'اختر الوظيفة';
    }

    if (currentStep === 2) {
      if (!formData.height || formData.height < 100 || formData.height > 250) newErrors.height = 'الطول يجب أن يكون بين 100 و250 سم';
      if (!formData.skinColor) newErrors.skinColor = 'اختر لون البشرة';
      if (!formData.origin) newErrors.origin = 'اختر القبلي/الحضري';
      if (!formData.religiousLevel) newErrors.religiousLevel = 'اختر مستوى التدين';
    }

    if (currentStep === 3) {
      if (!formData.partnerSpecs.minAge || formData.partnerSpecs.minAge < 18) newErrors.minAge = 'العمر الأدنى مطلوب';
      if (!formData.partnerSpecs.maxAge || formData.partnerSpecs.maxAge > 80) newErrors.maxAge = 'العمر الأقصى مطلوب';
      if (formData.partnerSpecs.minAge > formData.partnerSpecs.maxAge) {
        newErrors.minAge = 'العمر الأدنى يجب أن يكون أقل من الأقصى';
      }
      if (formData.partnerSpecs.cities.length === 0) newErrors.cities = 'اختر مدينة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePartnerChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      partnerSpecs: { ...prev.partnerSpecs, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCityToggle = (city) => {
    setFormData((prev) => {
      const cities = prev.partnerSpecs.cities.includes(city)
        ? prev.partnerSpecs.cities.filter((c) => c !== city)
        : [...prev.partnerSpecs.cities, city];
      return { ...prev, partnerSpecs: { ...prev.partnerSpecs, cities } };
    });
    setErrors((prev) => ({ ...prev, cities: undefined }));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const profilePayload = {
        user_id: currentUser.id,
        gender: currentUser.gender,
        الاسم: formData.name,
        العمر: Number(formData.age),
        المدينة: formData.city,
        الحالة_الاجتماعية: formData.socialStatus,
        المؤهل_الدراسي: formData.education,
        الوظيفة: formData.occupation,
        الطول: Number(formData.height),
        'لون البشرة': formData.skinColor,
        لون_البشرة: formData.skinColor,
        قبلي_او_حضري: formData.origin,
        مستوى_التدين: formData.religiousLevel,
        نبذة_عن_نفسه: formData.aboutMe,
        account_status: existingProfile?.account_status || 'pending',
      };

      let profile;
      if (existingProfile?.id) {
        profile = await updateProfile(existingProfile.id, profilePayload);
      } else {
        profile = await createProfile(profilePayload);
      }

      await savePartnerPreference(profile.id, {
        preferred_gender: currentUser.gender === 'male' ? 'female' : 'male',
        min_age: Number(formData.partnerSpecs.minAge),
        max_age: Number(formData.partnerSpecs.maxAge),
        preferred_city: formData.partnerSpecs.cities[0] || '',
        preferred_education: formData.partnerSpecs.education,
        preferred_skin: formData.partnerSpecs.skinColor || '',
        preferred_tribal: formData.partnerSpecs.origin || '',
        preferred_social_status: formData.partnerSpecs.socialStatus || '',
        preferred_occupation: formData.partnerSpecs.occupation || '',
        preferred_religious_level: formData.partnerSpecs.religiousLevel || '',
        notes: '',
      });

      navigate('/profiles');
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'حدث خطأ أثناء حفظ الملف' }));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'المعلومات الأساسية' },
    { num: 2, label: 'المواصفات الشخصية' },
    { num: 3, label: 'مواصفات الشريك' },
  ];

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <User size={28} />
          </div>
          <h1 className="section-title mb-2">ملفي الشخصي</h1>
          <p className="text-sm text-gray-600">أكمل بياناتك بصدق لنساعدك في إيجاد الشريك المناسب</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    step >= s.num ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.num}
                </div>
                <span className="hidden text-xs font-medium text-gray-600 sm:block">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 rounded-full ${step > s.num ? 'bg-brand-600' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="input-field"
                  placeholder="الاسم الثلاثي"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">العمر</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="input-field"
                  placeholder="مثال: 28"
                />
                {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">المدينة</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الحالة الاجتماعية</label>
                <select
                  value={formData.socialStatus}
                  onChange={(e) => handleChange('socialStatus', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {socialOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errors.socialStatus && <p className="mt-1 text-xs text-red-600">{errors.socialStatus}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">المؤهل الدراسي</label>
                <select
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {educationLevels.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
                {errors.education && <p className="mt-1 text-xs text-red-600">{errors.education}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الوظيفة</label>
                <select
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {occupations.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {errors.occupation && <p className="mt-1 text-xs text-red-600">{errors.occupation}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الطول (سم)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="input-field"
                  placeholder="مثال: 170"
                />
                {errors.height && <p className="mt-1 text-xs text-red-600">{errors.height}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">لون البشرة</label>
                <select
                  value={formData.skinColor}
                  onChange={(e) => handleChange('skinColor', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {skinColors.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.skinColor && <p className="mt-1 text-xs text-red-600">{errors.skinColor}</p>}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الأصل</label>
                <select
                  value={formData.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {origins.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.origin && <p className="mt-1 text-xs text-red-600">{errors.origin}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">مستوى التدين</label>
                <select
                  value={formData.religiousLevel}
                  onChange={(e) => handleChange('religiousLevel', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {religiousLevels.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {errors.religiousLevel && <p className="mt-1 text-xs text-red-600">{errors.religiousLevel}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">نبذة عني</label>
              <textarea
                value={formData.aboutMe}
                onChange={(e) => handleChange('aboutMe', e.target.value)}
                className="input-field min-h-[120px] resize-none"
                placeholder="اكتب نبذة مختصرة عن شخصيتك وطموحاتك..."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-brand-50/60 p-4 text-center">
              <h2 className="text-lg font-bold text-gray-900">
                {currentUser?.gender === 'male' ? 'مواصفات البنت التي أبحث عنها' : 'مواصفات الشاب الذي أبحث عنه'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">حدد مواصفات شريك الحياة الذي تبحث عنه</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">العمر الأدنى</label>
                <input
                  type="number"
                  value={formData.partnerSpecs.minAge}
                  onChange={(e) => handlePartnerChange('minAge', e.target.value)}
                  className="input-field"
                  placeholder="مثال: 22"
                />
                {errors.minAge && <p className="mt-1 text-xs text-red-600">{errors.minAge}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">العمر الأقصى</label>
                <input
                  type="number"
                  value={formData.partnerSpecs.maxAge}
                  onChange={(e) => handlePartnerChange('maxAge', e.target.value)}
                  className="input-field"
                  placeholder="مثال: 30"
                />
                {errors.maxAge && <p className="mt-1 text-xs text-red-600">{errors.maxAge}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">المدن المفضلة للشريك</label>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityToggle(city)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      formData.partnerSpecs.cities.includes(city)
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              {errors.cities && <p className="mt-1 text-xs text-red-600">{errors.cities}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الحالة الاجتماعية المطلوبة</label>
                <select
                  value={formData.partnerSpecs.socialStatus}
                  onChange={(e) => handlePartnerChange('socialStatus', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {partnerMaritalOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">المؤهل الدراسي المطلوب</label>
                <select
                  value={formData.partnerSpecs.education}
                  onChange={(e) => handlePartnerChange('education', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  <option value="any">لا يهم</option>
                  {educationLevels.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">الوظيفة المطلوبة</label>
                <select
                  value={formData.partnerSpecs.occupation}
                  onChange={(e) => handlePartnerChange('occupation', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  <option value="any">لا يهم</option>
                  {occupations.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">مستوى التدين المطلوب</label>
                <select
                  value={formData.partnerSpecs.religiousLevel}
                  onChange={(e) => handlePartnerChange('religiousLevel', e.target.value)}
                  className="select-field"
                >
                  <option value="">اختر</option>
                  {religiousLevels.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-50"
          >
            السابق
          </button>

          {step < 3 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              التالي
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'جاري الحفظ...' : 'حفظ الملف الشخصي'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}