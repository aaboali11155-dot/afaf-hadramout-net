import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { submitSiteIssue } from '../services/siteIssueService';

export default function IssueReportButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    issue_type: 'bug',
    title: '',
    description: '',
    user_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    setLoading(true);
    setError('');
    try {
      await submitSiteIssue({
        title: form.title.trim(),
        description: form.description.trim(),
        issue_type: form.issue_type,
        user_email: form.user_email.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setForm({ issue_type: 'bug', title: '', description: '', user_email: '' });
      }, 2000);
    } catch (err) {
      setError(err.message || 'تعذر إرسال البلاغ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating report button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lift transition-all hover:bg-red-700 hover:scale-105 active:scale-95"
        aria-label="إرسال بلاغ"
      >
        <AlertTriangle size={18} />
        <span>بلاغ</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">إرسال بلاغ عن مشكلة</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="rounded-2xl bg-green-50 p-6 text-center text-green-700">
                <p className="font-semibold">تم إرسال البلاغ بنجاح</p>
                <p className="mt-1 text-sm">شكرًا لك، سيتم مراجعته من قبل المشرف.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">نوع المشكلة</label>
                  <select
                    value={form.issue_type}
                    onChange={(e) => setForm({ ...form, issue_type: e.target.value })}
                    className="select-field"
                  >
                    <option value="bug">عطل تقني</option>
                    <option value="content">محتوى غير لائق</option>
                    <option value="account">مشكلة في الحساب</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">عنوان المشكلة</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: لا يمكن تسجيل الدخول"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">وصف المشكلة</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="اشرح المشكلة بالتفصيل..."
                    rows={4}
                    className="input-field resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">بريدك الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={form.user_email}
                    onChange={(e) => setForm({ ...form, user_email: e.target.value })}
                    placeholder="للتواصل معك عند الحاجة"
                    className="input-field"
                    dir="ltr"
                  />
                </div>

                {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                <button
                  type="submit"
                  disabled={loading || !form.title.trim() || !form.description.trim()}
                  className="btn-primary w-full"
                >
                  {loading ? 'جاري الإرسال...' : <><Send size={16} /> إرسال البلاغ</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
