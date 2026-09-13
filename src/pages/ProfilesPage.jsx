import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart, Filter, Eye, AlertCircle } from 'lucide-react';
import {
  cities,
  getSocialStatuses,
  educationLevels,
  getEducationLabel,
  getSocialLabel,
  getOriginLabel,
  getReligiousLabel,
} from '../data/mockData';
import { fetchApprovedProfiles } from '../services/profileService';
import { fetchBlockedUserIds } from '../services/userBlockService';

export default function ProfilesPage({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockedIds, setBlockedIds] = useState([]);
  const [filters, setFilters] = useState({
    gender: currentUser?.gender === 'male' ? 'female' : currentUser?.gender === 'female' ? 'male' : '',
    city: '',
    minAge: '',
    maxAge: '',
    socialStatus: '',
    education: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const targetGender = currentUser?.gender === 'male' ? 'female' : currentUser?.gender === 'female' ? 'male' : '';
  const socialOptions = getSocialStatuses(targetGender);

  useEffect(() => {
    if (currentUser?.gender) setFilters((prev) => ({ ...prev, gender: targetGender }));
  }, [currentUser?.gender]);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      try {
        const [data, blocked] = await Promise.all([
          fetchApprovedProfiles(),
          fetchBlockedUserIds().catch(() => []),
        ]);
        setProfiles(data || []);
        setBlockedIds(blocked || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل الملفات');
      } finally {
        setLoading(false);
      }
    }
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const profileGender = profile.الجنس || profile.gender;
      const matchGender = filters.gender ? profileGender === filters.gender : true;
      const matchCity = filters.city ? profile.المدينة === filters.city : true;
      const matchMinAge = filters.minAge ? profile.العمر >= Number(filters.minAge) : true;
      const matchMaxAge = filters.maxAge ? profile.العمر <= Number(filters.maxAge) : true;
      const matchSocial = filters.socialStatus ? profile.الحالة_الاجتماعية === filters.socialStatus : true;
      const matchEducation = filters.education ? profile.المؤهل_الدراسي === filters.education : true;
      const matchSearch = filters.search
        ? (profile.الاسم || '').toLowerCase().includes(filters.search.toLowerCase()) ||
          (profile.المدينة || '').includes(filters.search)
        : true;
      const notBlocked = !blockedIds.includes(profile.user_id);
      const notOwn = profile.user_id !== currentUser?.id;
      const eligible = !(profileGender === 'female' && profile.الحالة_الاجتماعية === 'married');

      return notOwn && eligible && matchGender && matchCity && matchMinAge && matchMaxAge && matchSocial && matchEducation && matchSearch && notBlocked;
    });
  }, [profiles, filters, blockedIds, currentUser?.id]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const handleReset = () => {
    setFilters({
      gender: currentUser?.gender === 'male' ? 'female' : currentUser?.gender === 'female' ? 'male' : '',
      city: '',
      minAge: '',
      maxAge: '',
      socialStatus: '',
      education: '',
      search: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="section-title mb-2">استعراض الملفات الشخصية</h1>
        <p className="text-gray-600">ابحث عن شريك حياتك المناسب بين الملفات المعتمدة</p>
      </div>

      {/* Search & filter toggle */}
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field pr-10"
              placeholder="ابحث بالاسم أو المدينة..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter size={18} />
            {showFilters ? 'إخفاء التصفية' : 'تصفية متقدمة'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">الجنس</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                className="select-field"
              >
                <option value="">الكل</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">المدينة</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="select-field"
              >
                <option value="">الكل</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">الحالة الاجتماعية</label>
              <select
                value={filters.socialStatus}
                onChange={(e) => setFilters({ ...filters, socialStatus: e.target.value })}
                className="select-field"
              >
                <option value="">الكل</option>
                {socialOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">المؤهل الدراسي</label>
              <select
                value={filters.education}
                onChange={(e) => setFilters({ ...filters, education: e.target.value })}
                className="select-field"
              >
                <option value="">الكل</option>
                {educationLevels.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">العمر من</label>
              <input
                type="number"
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                className="input-field"
                placeholder="18"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">العمر إلى</label>
              <input
                type="number"
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                className="input-field"
                placeholder="80"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <button onClick={handleReset} className="btn-secondary w-full">
                إعادة ضبط الفلاتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        عدد النتائج: <span className="font-bold text-brand-700">{filteredProfiles.length}</span> ملف شخصي
      </p>

      {/* Profiles grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">جاري تحميل الملفات...</div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-soft">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-bold text-gray-900">لا توجد ملفات مطابقة</h3>
          <p className="text-gray-600">جرب تعديل معايير البحث أو تصفح الملفات المتاحة</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="card flex flex-col transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white ${
                  profile.الجنس === 'male' ? 'bg-blue-500' : 'bg-rose-500'
                }`}>
                  {getInitials(profile.الاسم || '')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{profile.الاسم}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    {profile.المدينة}
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <span className="block text-xs text-gray-500">العمر</span>
                  <span className="font-semibold text-gray-900">{profile.العمر} سنة</span>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <span className="block text-xs text-gray-500">الحالة</span>
                  <span className="font-semibold text-gray-900">{getSocialLabel(profile.الحالة_الاجتماعية, profile.الجنس || profile.gender)}</span>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <span className="block text-xs text-gray-500">المؤهل</span>
                  <span className="font-semibold text-gray-900">{getEducationLabel(profile.المؤهل_الدراسي)}</span>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <span className="block text-xs text-gray-500">التدين</span>
                  <span className="font-semibold text-gray-900">{getReligiousLabel(profile.مستوى_التدين)}</span>
                </div>
              </div>

              <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-600">
                {profile.نبذة_عن_نفسه}
              </p>

              <Link
                to={`/profile/${profile.id}`}
                className="btn-secondary w-full"
              >
                <Eye size={18} />
                عرض الملف
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}