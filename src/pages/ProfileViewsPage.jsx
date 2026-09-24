import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight, User, MapPin, Clock } from 'lucide-react';
import { fetchMyProfile, fetchMyProfileViews } from '../services/profileService';
import { getSocialLabel } from '../data/mockData';

export default function ProfileViewsPage({ currentUser }) {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadViews() {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        const myProfile = await fetchMyProfile(currentUser.id);
        if (!myProfile?.id) {
          setLoading(false);
          return;
        }
        const data = await fetchMyProfileViews(myProfile.id);
        setViews(data || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل قائمة الزيارات');
      } finally {
        setLoading(false);
      }
    }
    loadViews();
  }, [currentUser]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">جاري تحميل قائمة الزيارات...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/profile/edit"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowRight size={20} />
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">من زار ملفي</h1>
      </div>

      <div className="card">
        {views.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <Eye size={48} className="mx-auto mb-4 text-gray-300" />
            <p>لم يزر ملفك أحد بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {views.map((view) => {
              const visitor = view.visitor;
              return (
                <Link
                  key={view.id}
                  to={visitor?.id ? `/profile/${visitor.id}` : '#'}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label={visitor?.الاسم ? `فتح ملف ${visitor.الاسم}` : 'فتح ملف الزائر'}
                  onClick={(e) => { if (!visitor?.id) e.preventDefault(); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{visitor?.الاسم || 'مستخدم'}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {visitor?.العمر && <span>العمر: {visitor.العمر}</span>}
                        {visitor?.المدينة && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {visitor.المدينة}
                          </span>
                        )}
                        {visitor?.الحالة_الاجتماعية && <span>• {getSocialLabel(visitor.الحالة_الاجتماعية, visitor.الجنس || visitor.gender)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-left text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(view.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
