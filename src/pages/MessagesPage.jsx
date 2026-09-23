import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, AlertCircle, ChevronLeft } from 'lucide-react';
import { fetchUserMessages, sendMessage } from '../services/messageService';
import { markConversationAsRead, groupAndSortConversations } from '../services/messageReadService';
import { fetchBlockedUserIds } from '../services/userBlockService';

/**
 * Page 2 fix: Messages is now reserved for real messages only.
 * Contact requests are intentionally NOT fetched/rendered here; they live in Notifications.
 * Conversations are grouped by the other user's ID so one conversation card is shown per user.
 */
export default function MessagesPage({ currentUser }) {
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatText, setChatText] = useState('');
  const [_unreadRefresh, setUnreadRefresh] = useState(0);
  const conversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    async function loadMessages() {
      setLoading(true);
      setError('');
      try {
        const [messages, blocked] = await Promise.all([
          fetchUserMessages(currentUser.id),
          fetchBlockedUserIds().catch(() => []),
        ]);
        setChatMessages(messages || []);
        setBlockedIds(blocked || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل الرسائل');
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [currentUser?.id]);

  // Keep the conversation viewport at the newest message when opening,
  // sending, or receiving messages, without changing the existing styling.
  useEffect(() => {
    if (!selectedConversation) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [selectedConversation, chatMessages.length]);

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

  const visibleMessages = chatMessages.filter((message) => {
    const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
    return otherUserId && !blockedIds.includes(otherUserId);
  });

  // One card per conversation, ordered by the latest message and carrying unread counts.
  const grouped = groupAndSortConversations(visibleMessages, currentUser.id);
  const conversations = grouped.map((group) => {
    const latest = group.latestMessage;
    const otherName = latest?.sender_id === currentUser.id ? (latest.receiver_name || 'مستخدم') : (latest.sender_name || 'مستخدم');
    return { ...group, id: `conversation-${group.userId}`, other_user_id: group.userId, other_name: otherName, latest: { ...latest, content: latest?.content ?? latest?.body ?? '' } };
  });

  const selectedOtherUserId = selectedConversation?.other_user_id || null;
  const selectedMessages = selectedOtherUserId
    ? visibleMessages
        .filter((message) => {
          const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
          return otherUserId === selectedOtherUserId;
        })
        .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    : [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    if (conversation?.other_user_id) {
      await markConversationAsRead(conversation.other_user_id);
      setChatMessages((prev) => prev.map((m) => (m.receiver_id === currentUser.id && m.sender_id === conversation.other_user_id) ? { ...m, is_read: true } : m));
      setUnreadRefresh((v) => v + 1);
    }
    setTimeout(() => {
      conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };


  const handleSend = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !selectedOtherUserId) return;

    try {
      const msg = await sendMessage({
        sender_id: currentUser.id,
        receiver_id: selectedOtherUserId,
        body: chatText.trim(),
      });
      setChatMessages((prev) => [
        ...prev,
        { ...msg, content: msg.content ?? msg.body ?? '', sender_id: currentUser.id, receiver_id: selectedOtherUserId },
      ]);
      setChatText('');
    } catch (err) {
      setError(err.message || 'تعذر إرسال الرسالة');
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="mb-6 text-center">
        <h1 className="section-title mb-2">الرسائل</h1>
        <p className="text-gray-600">المراسلات والدردشات الفعلية فقط</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-brand-600" />
          <h2 className="text-lg font-bold text-gray-900">المحادثات</h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
            لا توجد مراسلات فعلية بعد. طلبات التواصل تظهر في الإشعارات.
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => openConversation(conversation)}
                className={`w-full rounded-2xl border p-4 text-right transition-all hover:border-brand-300 hover:shadow-soft ${
                  selectedConversation?.id === conversation.id ? 'border-brand-500 bg-brand-50/50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-bold text-gray-900">{conversation.other_name}</span>
                  <span className="text-xs text-gray-400">{formatDate(conversation.latest.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{conversation.latest.content} {conversation.unreadCount > 0 && <span className="mr-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{conversation.unreadCount}</span>}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                  <MessageSquare size={14} /> فتح المحادثة <ChevronLeft size={14} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={conversationRef} className="mt-6 card scroll-mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900">
            {selectedConversation ? `المحادثة مع ${selectedConversation.other_name}` : 'المحادثة'}
          </h3>
        </div>

        <div className="flex min-h-0 flex-col">
          <div
            className="mb-4 max-h-80 min-h-[18rem] flex-1 space-y-2 overflow-y-auto rounded-2xl bg-gray-50 p-3"
            aria-live="polite"
          >
            {!selectedConversation ? (
              <p className="text-center text-sm text-gray-500">اختر محادثة لعرض الرسائل</p>
            ) : selectedMessages.length === 0 ? (
              <p className="text-center text-sm text-gray-500">لا توجد رسائل بعد</p>
            ) : (
              selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl p-3 text-sm ${
                    message.sender_id === currentUser.id
                      ? 'mr-8 bg-brand-50 text-gray-800'
                      : 'ml-8 bg-white text-gray-800'
                  }`}
                >
                  <div>{message.content}</div>
                  <div className="mt-1 text-[10px] text-gray-400">{formatDate(message.created_at)}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {selectedConversation && (
            <form onSubmit={handleSend} className="mt-auto flex shrink-0 gap-2 border-t border-gray-100 pt-3">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="input-field flex-1"
                placeholder="اكتب رسالتك..."
                aria-label="نص الرسالة"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={!chatText.trim()}>
                <Send size={16} /> إرسال
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
