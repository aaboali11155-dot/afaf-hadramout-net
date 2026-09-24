import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, User, Heart, MessageCircle, ArrowRight, AlertCircle, Flag, Ban } from 'lucide-react';
import {
  getEducationLabel,
  getSocialLabel,
  getSkinLabel,
  getOriginLabel,
  getReligiousLabel,
  getOccupationLabel,
} from '../data/mockData';
import { fetchProfileById, recordProfileView } from '../services/profileService';
import { fetchMyContactRequests, sendContactRequest } from '../services/contactRequestService';
import { sendMessage } from '../services/messageService';
import { submitUserReport } from '../services/userReportService';
import { blockUser, isBlocked } from '../services/userBlockService';

export default function ProfileDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfileById(id);
        setProfile(data);
        if (currentUser && data?.id) {
          try {
            await recordProfileView(currentUser.id, data.id);
          } catch {
            // ignore view logging errors
          }
        }
        if (currentUser && data?.user_id) {
          const blockedStatus = await isBlocked(data.user_id);
          setBlocked(blockedStatus);
        }
      } catch (err) {
        setError(err.message || 'تعذر تحميل الملف');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id, currentUser]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">جاري تحميل الملف...</div>;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-3 text-xl font-bold text-gray-900">{error || 'الملف غير موجود'}</h2>
          <Link to="/profiles" className="btn-primary w-full">
            العودة للملفات
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.user_id;

  const isAuthorizedAdmin = currentUser?.isAdmin && (
    currentUser?.adminRole === 'owner' ||
    (currentUser?.adminRole === 'moderator' && Array.isArray(currentUser?.adminPermissions) && currentUser.adminPermissions.includes('messages'))
  );

  const canSendMessage = !isOwnProfile && currentUser && (!currentUser.isAdmin || isAuthorizedAdmin);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser) return;

    try {
      if (currentUser.isAdmin) {
        const { sendAdminMessage } = await import('../services/adminMessageService');
        await sendAdminMessage({ receiverUserId: profile.user_id, content: messageText.trim() });
      } else {
        // After approval, this form sends a real message. Before approval it creates a contact request.
        const requests = await fetchMyContactRequests();
        const approved = (requests || []).find((request) =>
          request.status === 'approved' &&
          ((request.sender_user_id === currentUser.id && request.receiver_user_id === profile.user_id) ||
            (request.sender_user_id === profile.user_id && request.receiver_user_id === currentUser.id))
        );

        if (approved) {
          await sendMessage({
            sender_id: currentUser.id,
            receiver_id: profile.user_id,
            body: messageText.trim(),
          });
        } else {
          await sendContactRequest({
            receiver_user_id: profile.user_id,
            message: messageText.trim(),
            request_type: 'private',
          });
        }
      }

      setSent(true);
      setMessageText('');
      setTimeout(() => setShowMessageForm(false), 2000);
    } catch (err) {
      setError(err.message || 'تعذر إرسال الرسالة');
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !profile?.user_id) return;
    setActionLoading('block');
    try {
      await blockUser({ blockedUserId: profile.user_id, reason: '' });
      setBlocked(true);
    } catch (err) {
      setError(err.message || 'تعذر حظر المستخدم');
    } finally {
      setActionLoading('');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!currentUser || !profile?.user_id || !reportReason.trim()) return;
    setActionLoading('report');
    try {
      await submitUserReport({
        reportedUserId: profile.user_id,
        reason: reportReason.trim(),
        details: reportDetails.trim(),
      });
      setReportSent(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSent(false);
        setReportReason('');
        setReportDetails('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'تعذر إرسال البلاغ');
    } finally {
      setActionLoading('');
    }
  };

  const getInitials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');

  return (
    <div className="mx-auto max-w-3xl py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowRight size={16} />
        عودة للملفات
      </button>

      <div className="card">
        <div className="mb-6 flex flex-col items-center gap-4 border-b border-gray-100 pb-6 text-center sm:flex-row sm:text-right">
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl text-3xl font-bold text-white ${
              profile.الجنس === 'male' ? 'bg-blue-500' : 'bg-rose-500'
            }`}
          >
            {getInitials(profile.الاسم || '')}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{profile.الاسم}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 sm:justify-start">
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                <MapPin size={14} />
                {profile.المدينة}
              </span>
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {profile.العمر} سنة
              </span>
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {getSocialLabel(profile.الحالة_الاجتماعية, profile.الجنس || profile.gender)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <User size={20} className="text-brand-600" />
              المعلومات الشخصية
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">النوع</span>
                <span className="font-semibold text-gray-900">
                  {profile.الجنس === 'male' || profile.الجنس === 'ذكر' || profile.gender === 'male' || profile.gender === 'ذكر'
                    ? 'شاب'
                    : profile.الجنس === 'female' || profile.الجنس === 'أنثى' || profile.gender === 'female' || profile.gender === 'أنثى'
                    ? 'بنت'
                    : 'غير محدد'}
                </span>
              </li>
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">المؤهل الدراسي</span>
                <span className="font-semibold text-gray-900">{getEducationLabel(profile.المؤهل_الدراسي)}</span>
              </li>
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">الوظيفة</span>
                <span className="font-semibold text-gray-900">{getOccupationLabel(profile.الوظيفة, profile.الجنس || profile.gender)}</span>
              </li>
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">الطول</span>
                <span className="font-semibold text-gray-900">{profile.الطول} سم</span>
              </li>
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">لون البشرة</span>
                <span className="font-semibold text-gray-900">{getSkinLabel(profile['لون البشرة'] || profile.لون_البشرة)}</span>
              </li>
              <li className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">الأصل</span>
                <span className="font-semibold text-gray-900">{getOriginLabel(profile.قبلي_او_حضري)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">مستوى التدين</span>
                <span className="font-semibold text-gray-900">{getReligiousLabel(profile.مستوى_التدين)}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-brand-50/50 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Heart size={20} className="text-brand-600" />
              {profile.الجنس === 'female' ? 'مواصفات الشريك المطلوبة' : 'مواصفات الشريك المطلوبة'}
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-brand-100 pb-2">
                <span className="text-gray-500">العمر</span>
                <span className="font-semibold text-gray-900">
                  من {profile.partner_preferences?.min_age} إلى {profile.partner_preferences?.max_age}
                </span>
              </li>
              <li className="flex justify-between border-b border-brand-100 pb-2">
                <span className="text-gray-500">المدن المفضلة</span>
                <span className="font-semibold text-gray-900">{profile.partner_preferences?.preferred_city || 'لا يهم'}</span>
              </li>
              <li className="flex justify-between border-b border-brand-100 pb-2">
                <span className="text-gray-500">الحالة الاجتماعية</span>
                <span className="font-semibold text-gray-900">{getSocialLabel(profile.partner_preferences?.preferred_social_status, profile.partner_preferences?.preferred_gender) || 'لا يهم'}</span>
              </li>
              <li className="flex justify-between border-b border-brand-100 pb-2">
                <span className="text-gray-500">المؤهل الدراسي</span>
                <span className="font-semibold text-gray-900">{getEducationLabel(profile.partner_preferences?.preferred_education) || 'لا يهم'}</span>
              </li>
              <li className="flex justify-between border-b border-brand-100 pb-2">
                <span className="text-gray-500">الوظيفة</span>
                <span className="font-semibold text-gray-900">{getOccupationLabel(profile.partner_preferences?.preferred_occupation, profile.partner_preferences?.preferred_gender) || 'لا يهم'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">مستوى التدين</span>
                <span className="font-semibold text-gray-900">{getReligiousLabel(profile.partner_preferences?.preferred_religious_level) || 'لا يهم'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-gray-100">
          <h2 className="mb-3 text-lg font-bold text-gray-900">نبذة عني</h2>
          <p className="leading-relaxed text-gray-700">{profile.نبذة_عن_نفسه}</p>
        </div>

        {canSendMessage && (
          <div className="mt-6 space-y-3">
            {!showMessageForm ? (
              <button
                onClick={() => setShowMessageForm(true)}
                className="btn-primary w-full"
                disabled={blocked}
              >
                <MessageCircle size={18} />
                إرسال رسالة
              </button>
            ) : (
              <form onSubmit={handleSendMessage} className="rounded-2xl bg-gray-50 p-5">
                <h3 className="mb-3 text-base font-bold text-gray-900">إرسال رسالة إلى {profile.الاسم}</h3>
                {!currentUser.isAdmin && (
                  <p className="mb-3 text-xs text-gray-500">
                    ستُرسل رسالتك للمشرف للمراجعة قبل إيصالها للطرف الآخر.
                  </p>
                )}
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="اكتب رسالتك بأدب واحترام..."
                  required
                />
                {sent && (
                  <p className="mt-2 text-sm font-semibold text-green-600">
                    {currentUser.isAdmin ? 'تم إرسال الرسالة بنجاح' : 'تم إرسال الرسالة للمراجعة بنجاح'}
                  </p>
                )}
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={() => setShowMessageForm(false)} className="btn-secondary flex-1">
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={!messageText.trim()}>
                    إرسال
                  </button>
                </div>
              </form>
            )}

            {!currentUser.isAdmin && blocked && (
              <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700">
                لقد قمت بحظر هذا المستخدم. لن تظهر له رسائلك ولن تصلك رسائله.
              </div>
            )}

            {!currentUser.isAdmin && (
              !reportOpen ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
                  >
                    <Flag size={16} />
                    بلاغ عن الملف
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={blocked || actionLoading === 'block'}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Ban size={16} />
                    {blocked ? 'محظور' : 'حظر'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReport} className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
                    <Flag size={18} className="text-red-600" />
                    بلاغ عن {profile.الاسم}
                  </h3>
                  <p className="mb-3 text-xs text-gray-500">
                    أرسل بلاغاً للمشرف. لن يتم إبلاغ الطرف الآخر بهويتك.
                  </p>
                  <input
                    type="text"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="input-field mb-3"
                    placeholder="سبب البلاغ (مثال: محتوى مخالف، تصرف غير لائق)"
                    required
                  />
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="تفاصيل إضافية (اختياري)"
                  />
                  {reportSent && (
                    <p className="mt-2 text-sm font-semibold text-green-600">تم إرسال البلاغ بنجاح، سيراجعه المشرف</p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <button type="button" onClick={() => setReportOpen(false)} className="btn-secondary flex-1">
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                      disabled={!reportReason.trim() || actionLoading === 'report'}
                    >
                      {actionLoading === 'report' ? 'جاري الإرسال...' : <><SendIcon size={16} /> إرسال البلاغ</>}
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        )}

        {!currentUser && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-center">
            <p className="text-sm text-amber-800">يجب تسجيل الدخول للتواصل مع هذا الملف</p>
            <Link to="/login" className="mt-3 inline-block text-sm font-bold text-amber-700 hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SendIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}