import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { fetchMyContactRequests, sendContactRequest } from '../services/contactRequestService';
import { fetchUserMessages, sendMessage } from '../services/messageService';
import { fetchBlockedUserIds } from '../services/userBlockService';

export default function MessagesPage({ currentUser }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const conversationRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    async function loadRequests() {
      try {
        const [data, blocked] = await Promise.all([
          fetchMyContactRequests(),
          fetchBlockedUserIds().catch(() => []),
        ]);
        setRequests(data || []);
        try { setChatMessages(await fetchUserMessages(currentUser.id)); } catch { setChatMessages([]); }
        setBlockedIds(blocked || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل الرسائل');
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-3 text-xl font-bold text-gray-900">يجب تسجيل الدخول</h2>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const approvedReceived = requests.filter(
    (r) => r.receiver_user_id === currentUser.id && r.status === 'approved' && !blockedIds.includes(r.sender_user_id)
  );
  const approvedRequests = requests.filter(
    (r) => r.status === 'approved' && !blockedIds.includes(r.sender_user_id === currentUser.id ? r.receiver_user_id : r.sender_user_id)
  );

  const sentRequests = requests.filter(
    (r) => r.sender_user_id === currentUser.id && !blockedIds.includes(r.receiver_user_id)
  );

  const receivedMessages = chatMessages
    .filter((m) => m.receiver_id === currentUser.id && !blockedIds.includes(m.sender_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const conversationForMessage = (message) => ({
    id: `message-${message.id}`,
    sender_user_id: message.sender_id,
    receiver_user_id: message.receiver_id,
    sender_name: message.sender_name || 'مستخدم',
    receiver_name: message.receiver_name || 'مستخدم',
    status: 'approved',
  });

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedRequest) return;

    if (selectedRequest.status !== 'approved') {
      setError('لا يمكن إرسال الرد قبل اعتماد طلب التواصل من المشرف');
      return;
    }

    const receiverId = selectedRequest.sender_user_id === currentUser.id
      ? selectedRequest.receiver_user_id
      : selectedRequest.sender_user_id;
    try {
      await sendMessage({ sender_id: currentUser.id, receiver_id: receiverId, body: replyText.trim() });
      setReplyText('');
      setSelectedRequest(null);
      setError('تم إرسال الرد بنجاح، وسيظهر للطرف الآخر بعد اعتماد المشرف.');
    } catch (err) {
      setError(err.message || 'تعذر إرسال الرد');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 size={12} />
            تمت الموافقة
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            <XCircle size={12} />
            مرفوضة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Clock size={12} />
            قيد المراجعة
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="mb-6 text-center">
        <h1 className="section-title mb-2">الرسائل</h1>
        <p className="text-gray-600">رسائلك المرسلة والواردة بعد مراجعة المشرف</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Received requests */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">طلبات التواصل الواردة المعتمدة</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>
          ) : approvedReceived.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              لا توجد طلبات واردة معتمدة بعد
            </div>
          ) : (
            <div className="space-y-3">
              {approvedReceived.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-soft ${
                    selectedRequest?.id === req.id ? 'border-brand-500 bg-brand-50/50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-gray-900">{req.sender_name || 'مستخدم'}</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="mb-2 text-sm text-gray-700 line-clamp-2">{req.message}</p>
                  <span className="text-xs text-gray-400">{formatDate(req.reviewed_at || req.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Received messages */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">الرسائل الواردة</h2>
          </div>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>
          ) : receivedMessages.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              لا توجد رسائل واردة بعد
            </div>
          ) : (
            <div className="space-y-3">
              {receivedMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    setSelectedConversation(conversationForMessage(message));
                    setTimeout(() => conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                  }}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-right transition-all hover:border-brand-300 hover:shadow-soft"
                  aria-label={`فتح محادثة مع ${message.sender_name || 'مستخدم'}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900">من: {message.sender_name || 'مستخدم'}</span>
                    <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    <MessageSquare size={14} /> فتح المحادثة <ChevronLeft size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sent requests */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Send size={20} className="text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">طلبات التواصل المرسلة</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>
          ) : sentRequests.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              لم ترسل أي طلبات بعد
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => {
                const canOpenConversation = req.status === 'approved';
                const openConversation = () => {
                  if (!canOpenConversation) return;
                  setSelectedConversation(req);
                  setTimeout(() => conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                };
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={openConversation}
                    disabled={!canOpenConversation}
                    className={`w-full text-right rounded-2xl border p-4 transition-all ${
                      canOpenConversation
                        ? 'cursor-pointer border-gray-100 bg-white hover:border-brand-300 hover:shadow-soft'
                        : 'cursor-default border-gray-100 bg-white'
                    }`}
                    aria-label={canOpenConversation ? `فتح محادثة ${req.receiver_name || 'مستخدم'}` : `طلب تواصل مع ${req.receiver_name || 'مستخدم'} قيد المراجعة`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">إلى: {req.receiver_name || 'مستخدم'}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="mb-2 text-sm text-gray-700 line-clamp-2">{req.message}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                      {canOpenConversation && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                          <MessageSquare size={14} />
                          فتح المحادثة
                          <ChevronLeft size={14} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {approvedRequests.length > 0 && (
        <div ref={conversationRef} className="mt-6 card scroll-mt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900">المحادثة{selectedConversation ? ` مع ${selectedConversation.sender_user_id === currentUser.id ? (selectedConversation.receiver_name || 'مستخدم') : (selectedConversation.sender_name || 'مستخدم')}` : ''}</h3>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {approvedRequests.map((req) => {
              const otherUserId = req.sender_user_id === currentUser.id ? req.receiver_user_id : req.sender_user_id;
              const otherName = req.sender_user_id === currentUser.id ? (req.receiver_name || 'مستخدم') : (req.sender_name || 'مستخدم');
              return <button key={req.id} onClick={() => setSelectedConversation(req)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${selectedConversation?.id === req.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'}`}>{otherName}</button>;
            })}
          </div>
          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-gray-50 p-3">
            {selectedConversation ? (() => {
              const otherUserId = selectedConversation.sender_user_id === currentUser.id ? selectedConversation.receiver_user_id : selectedConversation.sender_user_id;
              const visible = chatMessages.filter(m => (m.sender_id === currentUser.id && m.receiver_id === otherUserId) || (m.sender_id === otherUserId && m.receiver_id === currentUser.id));
              const requestMessage = requests.find(r => r.status === 'approved' && ((r.sender_user_id === currentUser.id && r.receiver_user_id === otherUserId) || (r.sender_user_id === otherUserId && r.receiver_user_id === currentUser.id)))?.message;
              const history = requestMessage && !visible.some(m => m.content === requestMessage)
                ? [{ id: `request-${selectedConversation.id}`, sender_id: otherUserId, receiver_id: currentUser.id, content: requestMessage, created_at: selectedConversation.created_at || new Date().toISOString() }, ...visible]
                : visible;
              return history.length ? history.map(m => <div key={m.id} className={`rounded-xl p-3 text-sm ${m.sender_id === currentUser.id ? 'mr-8 bg-brand-50 text-gray-800' : 'ml-8 bg-white text-gray-800'}`}>{m.content}</div>) : <p className="text-center text-sm text-gray-500">لا توجد رسائل بعد</p>;
            })() : <p className="text-center text-sm text-gray-500">اختر محادثة</p>}
          </div>
          {selectedConversation && (
            <form onSubmit={async (e) => {
              e.preventDefault(); if (!chatText.trim()) return;
              const receiverId = selectedConversation.sender_user_id === currentUser.id ? selectedConversation.receiver_user_id : selectedConversation.sender_user_id;
              try {
                const msg = await sendMessage({ sender_id: currentUser.id, receiver_id: receiverId, body: chatText.trim() });
                setChatMessages(prev => [...prev, { ...msg, content: msg.content ?? msg.body ?? '' }]); setChatText('');
              } catch (err) { setError(err.message || 'تعذر إرسال الرسالة'); }
            }} className="flex gap-2">
              <input value={chatText} onChange={e => setChatText(e.target.value)} className="input-field flex-1" placeholder="اكتب رسالتك..." />
              <button className="btn-primary" disabled={!chatText.trim()}>إرسال</button>
            </form>
          )}
        </div>
      )}

      {/* Reply form */}
      {selectedRequest && selectedRequest.status === 'approved' && (
        <div className="mt-6 card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">الرد على {selectedRequest.sender_name || 'مستخدم'}</h3>
            <button onClick={() => setSelectedRequest(null)} className="text-xs text-gray-500 hover:text-gray-700">
              إغلاق
            </button>
          </div>
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="input-field min-h-[100px] resize-none"
              placeholder="اكتب ردك..."
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={!replyText.trim()}>
              <Send size={16} />
              إرسال
            </button>
          </form>
        </div>
      )}
    </div>
  );
}