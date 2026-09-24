import React, { useState, useEffect } from 'react';
import { formatAuditLogRow } from '../lib/adminAuditLogFormatter';

import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Unlock,
  Eye,
  EyeOff,
  Flag,
  ScrollText,
} from 'lucide-react';
import { fetchAllProfiles, updateProfile } from '../services/profileService';
import { fetchAllContactRequests, updateContactRequest } from '../services/contactRequestService';
import { fetchAllSiteIssues, updateSiteIssue } from '../services/siteIssueService';
import { fetchAllUserReports, updateUserReport } from '../services/userReportService';
import { makeAdmin, revokeAdmin, getAdminPermissionState, ADMIN_PERMISSIONS } from '../services/adminRoleService';
import { fetchAllUserBlocks, unblockUser } from '../services/adminBlockService';
import { fetchAllMessages, updateMessageStatus } from '../services/messageService';
import { fetchAdminAuditLog, logAdminAction } from '../services/adminAuditService';
import { supabase } from '../lib/supabase';

export default function AdminDashboardPage({ currentUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [issues, setIssues] = useState([]);
  const [reports, setReports] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [statFilter, setStatFilter] = useState(null);
  const [adminState, setAdminState] = useState({ isOwner: currentUser?.adminRole === 'owner', moderatorCount: 0, permissions: [] });
  const [adminModalUser, setAdminModalUser] = useState(null);
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState([]);
  const [reportAction, setReportAction] = useState('');
  const [reportActionMessage, setReportActionMessage] = useState('');
  const [reportActionBusy, setReportActionBusy] = useState(false);
  const [auditAdminNameMap, setAuditAdminNameMap] = useState({});
  const [auditUserNameMap, setAuditUserNameMap] = useState({});



  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    async function loadData() {
      try {
        const [p, r, m, i, rep, b, a] = await Promise.all([
          fetchAllProfiles().catch(() => []),
          fetchAllContactRequests().catch(() => []),
          fetchAllMessages().catch(() => []),
          fetchAllSiteIssues().catch(() => []),
          fetchAllUserReports().catch((err) => { throw new Error(`تعذر تحميل بلاغات المستخدمين: ${err.message || err}`); }),
          fetchAllUserBlocks().catch(() => []),
          fetchAdminAuditLog().catch(() => []),
        ]);
        setProfiles(p || []); setRequests(r || []); setMessages(m || []); setIssues(i || []); setReports(rep || []); setBlocks(b || []); setAuditLogs(a || []);
      loadAuditDisplayData(a || []);
      } catch (err) {
        setError(err.message || 'تعذر تحميل بيانات لوحة التحكم');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser?.isAdmin]);

  useEffect(() => {
    if (!currentUser?.isAdmin || activeTab !== 'reports') return;
    let cancelled = false;
    const refreshReports = async () => {
      try {
        const data = await fetchAllUserReports();
        if (!cancelled) setReports(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'تعذر تحديث بلاغات المستخدمين');
      }
    };
    refreshReports();
    const timer = window.setInterval(refreshReports, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [currentUser?.isAdmin, activeTab]);

  useEffect(() => {
    if (currentUser?.isAdmin) {
      getAdminPermissionState().then((state) => {
        setAdminState(state);
        if (!state.isOwner && state.permissions.length) {
          const first = state.permissions[0];
          setActiveTab(first === 'profiles' ? 'profiles' : first);
        }
      }).catch(() => {});
    }
  }, [currentUser?.id, currentUser?.adminRole]);

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-3 text-xl font-bold text-gray-900">وصول مرفوض</h2>
          <p className="mb-6 text-gray-600">هذه الصفحة مخصصة للمشرفين فقط.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalUsers: profiles.length,
    pendingProfiles: profiles.filter((p) => p.account_status === 'pending').length,
    pendingMessages: messages.filter((m) => m.status === 'pending').length,
    approvedProfiles: profiles.filter((p) => p.account_status === 'active').length,
    openIssues: issues.filter((i) => i.status === 'open').length,
    openReports: reports.filter((r) => r.status === 'open').length,
  };

  const handleApproveProfile = async (profileId) => {
    if (!can('profiles')) return setError('ليست لديك صلاحية إدارة الملفات');
    try {
      await updateProfile(profileId, { account_status: 'active' });
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, account_status: 'active' } : p)));
      const profile = profiles.find((p) => p.id === profileId);
      await logAdminAction({ action: 'approve_profile', entityType: 'profile', entityId: profile?.user_id || null, details: { description: 'اعتماد ملف المستخدم' } });
    } catch (err) {
      setError(err.message || 'تعذر تحديث حالة الملف');
    }
  };


  const handleSuspendProfile = async (profileId) => {
    if (!can('profiles')) return setError('ليست لديك صلاحية إدارة الملفات');
    try {
      await updateProfile(profileId, { account_status: 'suspended' });
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, account_status: 'suspended' } : p)));
      const profile = profiles.find((p) => p.id === profileId);
      await logAdminAction({ action: 'suspend_profile', entityType: 'profile', entityId: profile?.user_id || null, details: { description: 'تعليق حساب المستخدم' } });
    } catch (err) {
      setError(err.message || 'تعذر تعليق الملف');
    }
  };

  const handleReviewRequest = async (requestId, status) => {
    if (!can('requests')) return setError('ليست لديك صلاحية مراجعة طلبات التواصل');
    try {
      await updateContactRequest(requestId, { status });
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
      await logAdminAction({ action: `review_contact_request_${status}`, entityType: 'contact_request', entityId: null, details: { description: `مراجعة طلب تواصل: ${status}`, request_id: requestId } });
    } catch (err) {
      setError(err.message || 'تعذر تحديث حالة الطلب');
    }
  };

  const handleReviewMessage = async (messageId, status) => {
    if (!can('messages')) return setError('ليست لديك صلاحية مراجعة الرسائل');
    try {
      const updated = await updateMessageStatus(messageId, status);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      await logAdminAction({ action: `review_message_${status}`, entityType: 'message', entityId: messageId, details: { description: `مراجعة رسالة: ${status}` } });
    } catch (err) {
      setError(err.message || 'تعذر تحديث حالة الرسالة');
    }
  };

  const handleReviewIssue = async (issueId, status) => {
    if (!can('issues')) return setError('ليست لديك صلاحية بلاغات الموقع');
    try {
      await updateSiteIssue(issueId, { status });
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status } : i)));
      await logAdminAction({ action: `review_site_issue_${status}`, entityType: 'site_issue', entityId: issueId, details: { description: `مراجعة بلاغ موقع: ${status}` } });
    } catch (err) {
      setError(err.message || 'تعذر تحديث حالة البلاغ');
    }
  };

  const handleReportAdminAction = async (report, action) => {
    if (!can('reports')) return setError('ليست لديك صلاحية بلاغات المستخدمين');
    if (!report?.id || !action) return setError('يجب تحديد الإجراء قبل إنهاء البلاغ');
    if (action === 'message' && !reportActionMessage.trim()) return setError('اكتب الرسالة قبل إرسالها');
    setReportActionBusy(true);
    try {
      const targetUserId = report.reported_user_id;
      const labels = {
        warning: 'إرسال تحذير',
        message: 'إرسال رسالة مباشرة',
        hide_profile: 'إخفاء الملف الشخصي',
        suspend: 'تعليق الحساب',
        ban: 'حظر الحساب نهائيًا',
        ignore: 'تجاهل البلاغ (لا يستدعي إجراء)',
      };
      if (action === 'message') {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user?.id) throw new Error('يجب تسجيل الدخول');
        const { error } = await supabase.from('messages').insert({
          sender_id: auth.user.id,
          receiver_id: targetUserId,
          body: reportActionMessage.trim(),
          status: 'approved',
        });
        if (error) throw error;
      } else if (action === 'warning') {
        const { error } = await supabase.from('notifications').insert({
          user_id: targetUserId, title: 'تنبيه من إدارة الموقع', body: 'تم تسجيل تنبيه على حسابك بسبب بلاغ تمت مراجعته من الإدارة.', type: 'warning', is_read: false
        });
        if (error) throw error;
      } else if (action === 'hide_profile' || action === 'suspend' || action === 'ban') {
        const updates = action === 'hide_profile' ? { is_hidden: true } : { account_status: action === 'suspend' ? 'suspended' : 'banned' };
        const { error } = await supabase.from('profiles').update(updates).eq('user_id', targetUserId);
        if (error) throw error;
      }
      const status = action === 'ignore' ? 'dismissed' : 'resolved';
      const note = labels[action];
      await updateUserReport(report.id, { status, admin_note: note });
      await logAdminAction({
        action: `user_report_${action}`,
        entityType: 'user_report',
        entityId: report.id,
        details: {
          description: note,
          report_id: report.id,
          target_user_id: targetUserId || null,
          action,
          timestamp: new Date().toISOString(),
        },
      });
      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status, admin_note: note } : r));
      setSelectedReportId(null);
      setReportAction('');
      setReportActionMessage('');
    } catch (err) {
      setError(err.message || 'تعذر تنفيذ الإجراء الإداري');
    } finally {
      setReportActionBusy(false);
    }
  };

  const handleReviewReport = async (reportId, status) => {
    if (!can('reports')) return setError('ليست لديك صلاحية بلاغات المستخدمين');
    try {
      const updates = { status, admin_note: status === 'open' ? 'تمت إعادة فتح البلاغ.' : null };
      await updateUserReport(reportId, updates);
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, ...updates } : r));
      await logAdminAction({ action: `review_user_report_${status}`, entityType: 'user_report', entityId: reportId, details: { description: `مراجعة بلاغ مستخدم: ${status}`, report_id: reportId } });
      setReportAction('');
      setReportActionMessage('');
    } catch (err) { setError(err.message || 'تعذر تحديث حالة البلاغ'); }
  };

  const handleMakeAdmin = async (userId, role = 'moderator', permissions = []) => {
    try {
      const updated = await makeAdmin(userId, role, permissions);
      setProfiles((prev) => prev.map((p) => (p.user_id === userId ? { ...p, is_admin: updated.is_admin, admin_role: updated.admin_role, admin_permissions: updated.admin_permissions } : p)));
      setAdminModalUser(null);
      setAdminState((prev) => ({ ...prev, moderatorCount: Math.max(prev.moderatorCount, 0) + 1 }));
      await logAdminAction({ action: 'grant_admin_role', entityType: 'user', entityId: userId, details: { description: 'منح مشرف إضافي بصلاحيات محددة', permissions } });
    } catch (err) {
      setError(err.message || 'تعذر ترقية المستخدم');
    }
  };

  const handleRevokeAdmin = async (userId) => {
    try {
      const updated = await revokeAdmin(userId);
      setProfiles((prev) => prev.map((p) => (p.user_id === userId ? { ...p, is_admin: updated.is_admin, admin_role: updated.admin_role } : p)));
    } catch (err) {
      setError(err.message || 'تعذر إلغاء صلاحية المشرف');
    }
  };

  const handleUnblockUser = async (blockId) => {
    if (!can('blocks')) return setError('ليست لديك صلاحية إدارة الحظر');
    try {
      await unblockUser(blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      await logAdminAction({ action: 'unblock_user', entityType: 'user_block', entityId: blockId, details: { description: 'إلغاء حظر المستخدم' } });
    } catch (err) {
      setError(err.message || 'تعذر إلغاء الحظر');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const can = (permission) => adminState.isOwner || adminState.permissions.includes(permission);

  const tabs = [
    { id: 'profiles', label: 'الملفات', icon: FileText },
    { id: 'requests', label: 'طلبات التواصل', icon: SendIcon },
    { id: 'messages', label: 'الرسائل', icon: MessageSquare },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'admins', label: 'إدارة المشرفين', icon: Shield, ownerOnly: true },
    { id: 'issues', label: 'بلاغات الموقع', icon: Flag },
    { id: 'reports', label: 'بلاغات المستخدمين', icon: AlertCircle },
    { id: 'blocks', label: 'الحظر', icon: Ban },
    { id: 'audit', label: 'السجل', icon: ScrollText },
  ].filter((tab) => {
    if (tab.ownerOnly) return adminState.isOwner;
    if (tab.id === 'profiles' || tab.id === 'users') return can('profiles');
    return can(tab.id);
  });



  const loadAuditDisplayData = async (rows = []) => {
    const adminIds = [...new Set(rows.map((r) => r.admin_user_id ?? r.admin_id ?? r.user_id).filter(Boolean))];
    const targetIds = [...new Set(rows.map((r) => r.target_user_id ?? r.reported_user_id ?? r.target_id ?? r.entity_id).filter(Boolean))];
    const ids = [...new Set([...adminIds, ...targetIds])];

    if (!ids.length) {
      setAuditAdminNameMap({});
      setAuditUserNameMap({});
      return;
    }

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id,الاسم')
        .in('user_id', ids);

      if (error) throw error;
      const map = {};
      (profiles || []).forEach((p) => {
        map[p.user_id] = p.الاسم || 'بدون اسم';
      });

      const admins = {};
      const users = {};
      adminIds.forEach((id) => { admins[id] = map[id] || 'غير معروف'; });
      targetIds.forEach((id) => { users[id] = map[id] || 'غير محدد'; });

      setAuditAdminNameMap(admins);
      setAuditUserNameMap(users);
    } catch (error) {
      console.error('audit profile names fetch failed', error);
    }
  };

  const getFormattedAuditRows = () =>
    [...(auditLogs || [])]
      .sort((a, b) => new Date(b.created_at || b.timestamp || 0).getTime() - new Date(a.created_at || a.timestamp || 0).getTime())
      .map((row) => formatAuditLogRow(row, {
        adminNameMap: auditAdminNameMap,
        userNameMap: auditUserNameMap,
      }));

  return (
    <div className="admin-dashboard space-y-6">
      <div className="admin-dashboard-header text-center">
        <h1 className="section-title mb-2">لوحة تحكم المشرف</h1>
        <p className="text-gray-600">إدارة المستخدمين والملفات والرسائل</p>
      </div>

      {/* Stats */}
      <div className="admin-dashboard-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600', tab: 'profiles', filter: null },
          { label: 'ملفات معتمدة', value: stats.approvedProfiles, icon: CheckCircle2, color: 'bg-green-50 text-green-600', tab: 'profiles', filter: 'active' },
          { label: 'ملفات معلقة', value: stats.pendingProfiles, icon: FileText, color: 'bg-amber-50 text-amber-600', tab: 'profiles', filter: 'pending' },
          { label: 'رسائل معلقة', value: stats.pendingMessages, icon: MessageSquare, color: 'bg-rose-50 text-rose-600', tab: 'messages', filter: 'pending' },
          { label: 'بلاغات الموقع المفتوحة', value: stats.openIssues, icon: Flag, color: 'bg-red-50 text-red-600', tab: 'issues', filter: 'open' },
          { label: 'بلاغات المستخدمين المفتوحة', value: stats.openReports, icon: AlertCircle, color: 'bg-red-50 text-red-600', tab: 'reports', filter: 'open' },
        ].map((stat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => { setActiveTab(stat.tab); setStatFilter(stat.filter); }}
            className="card flex w-full cursor-pointer items-center gap-4 text-right transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-300"
            aria-label={`فتح ${stat.label}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="admin-dashboard-panel card">
        <div className="admin-dashboard-tabs mb-6 flex gap-2 border-b border-gray-100 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStatFilter(null); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profiles tab */}
        {activeTab === 'profiles' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-right text-gray-500">
                  <th className="pb-3 font-medium">الاسم</th>
                  <th className="pb-3 font-medium">الجنس</th>
                  <th className="pb-3 font-medium">المدينة</th>
                  <th className="pb-3 font-medium">الحالة</th>
                  <th className="pb-3 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {profiles.filter((profile) => !statFilter || activeTab !== 'profiles' || profile.account_status === statFilter).map((profile) => (
                  <tr key={profile.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/profiles/${profile.id}`)}
                        className="text-brand-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-300 rounded"
                        title="فتح ملف المستخدم"
                      >
                        {profile.الاسم || 'مستخدم'}
                      </button>
                    </td>
                    <td className="py-3 text-gray-600">{profile.الجنس === 'male' ? 'ذكر' : 'أنثى'}</td>
                    <td className="py-3 text-gray-600">{profile.المدينة}</td>
                    <td className="py-3">
                      {profile.account_status === 'active' && !profile.is_hidden ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 size={12} /> معتمد
                        </span>
                      ) : profile.account_status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          <ClockIcon size={12} /> معلق
                        </span>
                      ) : profile.is_hidden ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          <EyeOff size={12} /> مخفي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          <Ban size={12} /> موقوف
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {profile.account_status === 'pending' && (
                          <button
                            onClick={() => handleApproveProfile(profile.id)}
                            className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100"
                            title="اعتماد"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleSuspendProfile(profile.id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="تعليق"
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/profiles/${profile.id}`)}
                          className="rounded-lg bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>}
        {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Contact requests tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد طلبات تواصل</div>
            ) : (
              requests.filter((req) => !statFilter || req.status === statFilter).map((req) => (
                <div key={req.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">من:</span> {req.sender_name || 'مستخدم'}{' '}
                      <span className="text-gray-400">←</span>{' '}
                      <span className="font-bold text-gray-900">إلى:</span> {req.receiver_name || 'مستخدم'}
                    </div>
                    {req.status === 'pending' ? <span className="text-xs font-semibold text-amber-700">قيد المراجعة</span> : <span className="text-xs font-semibold text-gray-600">{req.status}</span>}
                  </div>
                  <p className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{req.message || 'بدون رسالة'}</p>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReviewRequest(req.id, 'approved')} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">موافقة</button>
                      <button onClick={() => handleReviewRequest(req.id, 'rejected')} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">رفض</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد رسائل</div>
            ) : (
              messages.filter((msg) => !statFilter || msg.status === statFilter).map((msg) => (
                <div key={msg.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">من:</span> {msg.sender_name || 'مستخدم'}{' '}
                      <span className="text-gray-400">←</span>{' '}
                      <span className="font-bold text-gray-900">إلى:</span> {msg.receiver_name || 'مستخدم'}
                    </div>
                    {msg.status === 'pending' ? <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">قيد المراجعة</span> : msg.status === 'approved' ? <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">معتمدة</span> : <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">مرفوضة</span>}
                  </div>
                  <p className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{msg.content ?? msg.body ?? ''}</p>
                  {msg.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReviewMessage(msg.id, 'approved')} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">موافقة</button>
                      <button onClick={() => handleReviewMessage(msg.id, 'rejected')} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">رفض</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Admin management tab — owner only */}
        {activeTab === 'admins' && adminState.isOwner && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">إدارة المشرفين</h2>
                <p className="text-sm text-gray-500">
                  إضافة المشرفين وتحديد الصلاحيات المسموح بها لكل مشرف.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                المشرفون الإضافيون: {adminState.moderatorCount} / 2
              </span>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              إدارة المشرفين متاحة للمشرف العام فقط. الصلاحيات تُفرض أيضًا من قاعدة البيانات، وليس من الواجهة فقط.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-right text-gray-500">
                    <th className="pb-3 font-medium">الاسم</th>
                    <th className="pb-3 font-medium">البريد</th>
                    <th className="pb-3 font-medium">الدور</th>
                    <th className="pb-3 font-medium">الصلاحيات</th>
                    <th className="pb-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.filter((profile) => profile.is_admin).map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-semibold text-gray-900">{profile.الاسم || 'بدون اسم'}</td>
                      <td className="py-3 text-gray-600" dir="ltr">{profile.email || '-'}</td>
                      <td className="py-3 text-gray-600">
                        {profile.admin_role === 'owner' ? 'مشرف عام' : 'مشرف'}
                      </td>
                      <td className="py-3 text-gray-600">
                        {profile.admin_role === 'owner'
                          ? 'جميع الصلاحيات'
                          : (Array.isArray(profile.admin_permissions) && profile.admin_permissions.length
                            ? profile.admin_permissions
                                .map((id) => ADMIN_PERMISSIONS.find((permission) => permission.id === id)?.label || id)
                                .join('، ')
                            : 'لا توجد صلاحيات')}
                      </td>
                      <td className="py-3">
                        {profile.admin_role !== 'owner' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminModalUser(profile);
                                setSelectedAdminPermissions(
                                  Array.isArray(profile.admin_permissions) ? profile.admin_permissions : []
                                );
                              }}
                              className="rounded-lg bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
                              title="تعديل الصلاحيات"
                            >
                              <Shield size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeAdmin(profile.user_id)}
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                              title="إلغاء صلاحية المشرف"
                            >
                              <Unlock size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900">إضافة مشرف جديد</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.filter((profile) => !profile.is_admin).map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    disabled={adminState.moderatorCount >= 2}
                    onClick={() => {
                      setAdminModalUser(profile);
                      setSelectedAdminPermissions([]);
                    }}
                    className="rounded-xl border border-gray-100 bg-white p-3 text-right text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="font-semibold text-gray-900">{profile.الاسم || 'بدون اسم'}</div>
                    <div className="mt-1 text-xs text-gray-500" dir="ltr">{profile.email || '-'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="admin-users-section">
            <div className="admin-users-mobile space-y-3">
              {profiles.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا يوجد مستخدمون</div>
              ) : profiles.map((profile) => (
                <div key={profile.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                      className="min-w-0 flex-1 text-right"
                      title="فتح ملف المستخدم"
                    >
                      <div className="truncate text-base font-bold text-gray-900">{profile.الاسم || 'بدون اسم'}</div>
                      <div className="mt-1 truncate text-xs text-gray-500" dir="ltr">{profile.email || '-'}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                      className="shrink-0 rounded-xl bg-brand-50 p-2.5 text-brand-600 hover:bg-brand-100"
                      title="فتح الملف"
                      aria-label={`فتح ملف ${profile.الاسم || 'المستخدم'}`}
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-gray-50 p-2.5"><span className="text-gray-500">الدور</span><div className="mt-1 font-semibold text-gray-800">{profile.is_admin ? `مشرف (${profile.admin_role || 'بدون دور'})` : 'مستخدم'}</div></div>
                    <div className="rounded-xl bg-gray-50 p-2.5"><span className="text-gray-500">الحالة</span><div className="mt-1 font-semibold text-gray-800">{profile.account_status === 'active' ? 'نشط' : profile.account_status === 'suspended' ? 'موقوف' : 'معلق'}</div></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{formatDate(profile.created_at)}</span>
                    {!profile.is_admin ? (
                      adminState.isOwner && <button onClick={() => { setAdminModalUser(profile); setSelectedAdminPermissions([]); }} className="rounded-lg bg-brand-50 p-2 text-brand-600 hover:bg-brand-100" title="إضافة مشرف بصلاحيات محددة"><Shield size={16} /></button>
                    ) : (
                      <button onClick={() => handleRevokeAdmin(profile.user_id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" title="إلغاء الصلاحية"><Unlock size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-users-desktop overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-right text-gray-500">
                  <th className="pb-3 font-medium">البريد</th>
                  <th className="pb-3 font-medium">الاسم</th>
                  <th className="pb-3 font-medium">الدور</th>
                  <th className="pb-3 font-medium">الحالة</th>
                  <th className="pb-3 font-medium">تاريخ التسجيل</th>
                  <th className="pb-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {profiles.filter((profile) => !statFilter || activeTab !== 'profiles' || profile.account_status === statFilter).map((profile) => (
                  <tr key={profile.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-semibold text-gray-900" dir="ltr">{profile.email || '-'}</td>
                    <td className="py-3 text-gray-600">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                        className="font-semibold text-gray-800 underline-offset-4 hover:text-brand-600 hover:underline"
                        title="فتح ملف المستخدم"
                      >
                        {profile.الاسم || 'بدون اسم'}
                      </button>
                    </td>
                    <td className="py-3 text-gray-600">{profile.is_admin ? `مشرف (${profile.admin_role || 'بدون دور'})` : 'مستخدم'}</td>
                    <td className="py-3">
                      {profile.account_status === 'active' && !profile.is_hidden ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">نشط</span>
                      ) : profile.account_status === 'suspended' ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">موقوف</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">معلق</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(profile.created_at)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {!profile.is_admin ? (
                          <button
                            onClick={() => { setAdminModalUser(profile); setSelectedAdminPermissions([]); }}
                            className="rounded-lg bg-brand-50 p-2 text-brand-600 hover:bg-brand-100"
                            title="إضافة مشرف بصلاحيات محددة"
                          >
                            <Shield size={16} />
                          </button>
                        ) : adminState.isOwner ? (
                          <button
                            onClick={() => handleRevokeAdmin(profile.user_id)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            title="إلغاء الصلاحية"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          </div>
        )}

        {/* Issues tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد بلاغات</div>
            ) : (
              issues.filter((issue) => {
                if (!statFilter) return true;
                if (statFilter === 'open') return ['new', 'open', 'in_progress'].includes(issue.status);
                return issue.status === statFilter;
              }).map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">من:</span> {issue.reporter_name || issue.user_email || issue.email || 'غير محدد'}{' '}
                      {issue.created_at && (
                        <span className="mr-2 text-xs text-gray-400">({formatDateTime(issue.created_at)})</span>
                      )}
                    </div>
                    {['new', 'open'].includes(issue.status) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <AlertCircle size={12} /> {issue.status === 'new' ? 'جديد' : 'مفتوح'}
                      </span>
                    ) : issue.status === 'in_progress' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <ClockIcon size={12} /> قيد المعالجة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} /> مغلق
                      </span>
                    )}
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {issue.issue_type === 'bug' ? 'عطل تقني' : issue.issue_type === 'content' ? 'محتوى غير لائق' : issue.issue_type === 'account' ? 'مشكلة في الحساب' : 'أخرى'}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{issue.title}</p>
                  </div>
                  <p className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{issue.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {['new', 'open'].includes(issue.status) && (
                      <button
                        onClick={() => handleReviewIssue(issue.id, 'in_progress')}
                        className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        <ClockIcon size={14} /> قيد المعالجة
                      </button>
                    )}
                    {issue.status !== 'closed' && (
                      <button
                        onClick={() => handleReviewIssue(issue.id, 'closed')}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle2 size={14} /> إغلاق
                      </button>
                    )}
                    {issue.status === 'closed' && (
                      <button
                        onClick={() => handleReviewIssue(issue.id, 'open')}
                        className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        <Unlock size={14} /> إعادة فتح
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد بلاغات بين المستخدمين</div>
            ) : (
              reports.filter((report) => !statFilter || report.status === statFilter).map((report) => (
                <div key={report.id} className="rounded-2xl border border-red-100 bg-red-50/30 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-gray-900">بلاغ المستخدم</div>
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(selectedReportId === report.id ? null : report.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={14} /> {selectedReportId === report.id ? 'إخفاء التفاصيل' : 'فتح البلاغ والتفاصيل'}
                    </button>
                  </div>
                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => report.reporter_id && navigate(`/profile/${report.reporter_id}`)}
                      className="rounded-xl border border-gray-200 bg-white p-3 text-right transition hover:border-gray-300"
                      disabled={!report.reporter_id}
                    >
                      <div className="text-xs font-semibold text-gray-500">المبلّغ</div>
                      <div className="mt-1 font-bold text-gray-900">{report.reporter_name || 'مستخدم غير معروف'}</div>
                      {report.reporter_profile && (
                        <div className="mt-1 text-xs text-gray-500">
                          {report.reporter_profile.العمر ? `${report.reporter_profile.العمر} سنة` : ''}
                          {report.reporter_profile.المدينة ? ` • ${report.reporter_profile.المدينة}` : ''}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => report.reported_user_id && navigate(`/profile/${report.reported_user_id}`)}
                      className="rounded-xl border border-red-100 bg-white p-3 text-right transition hover:border-red-200"
                      disabled={!report.reported_user_id}
                    >
                      <div className="text-xs font-semibold text-red-600">المبلّغ عنه</div>
                      <div className="mt-1 font-bold text-gray-900">{report.reported_name || 'مستخدم غير معروف'}</div>
                      {report.reported_profile && (
                        <div className="mt-1 text-xs text-gray-500">
                          {report.reported_profile.العمر ? `${report.reported_profile.العمر} سنة` : ''}
                          {report.reported_profile.المدينة ? ` • ${report.reported_profile.المدينة}` : ''}
                        </div>
                      )}
                    </button>
                  </div>
                  {selectedReportId === report.id && (
                    <div className="mt-3 rounded-xl border border-red-100 bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-700">تفاصيل البلاغ</div>
                    {report.status === 'open' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <AlertCircle size={12} /> مفتوح
                      </span>
                    ) : report.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} /> تم الحل
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        <XCircle size={12} /> تم التجاهل
                      </span>
                    )}
                    </div>
                  <div className="mb-1 text-sm font-semibold text-gray-900">{report.reason}</div>
                  <p className="mb-3 text-sm text-gray-600">{report.details || 'لا توجد تفاصيل'}</p>
                  <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-2 text-sm font-semibold text-gray-800">الإجراء الإداري</div>
                    <select
                      value={selectedReportId === report.id ? reportAction : ''}
                      onChange={(e) => {
                        setReportAction(e.target.value);
                        if (e.target.value !== 'message') setReportActionMessage('');
                      }}
                      className="input-field w-full"
                      disabled={reportActionBusy}
                    >
                      <option value="">اختر الإجراء قبل إنهاء البلاغ</option>
                      <option value="warning">إرسال تحذير</option>
                      <option value="message">إرسال رسالة مباشرة</option>
                      <option value="hide_profile">إخفاء الملف الشخصي</option>
                      <option value="suspend">تعليق الحساب</option>
                      <option value="ban">حظر الحساب نهائيًا</option>
                      <option value="ignore">تجاهل البلاغ (لا يستدعي إجراء)</option>
                    </select>
                    {reportAction === 'message' && selectedReportId === report.id && (
                      <textarea
                        value={reportActionMessage}
                        onChange={(e) => setReportActionMessage(e.target.value)}
                        className="input-field mt-2 min-h-[90px] w-full"
                        placeholder="اكتب رسالة المستخدم..."
                        disabled={reportActionBusy}
                      />
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleReportAdminAction(report, reportAction)}
                          disabled={!reportAction || reportActionBusy || (reportAction === 'message' && !reportActionMessage.trim())}
                          className="btn-primary disabled:opacity-50"
                        >
                          {reportActionBusy ? 'جارٍ التنفيذ...' : 'تأكيد الإجراء وإنهاء البلاغ'}
                        </button>
                      )}
                      {report.status !== 'open' && (
                        <button
                          type="button"
                          onClick={() => handleReviewReport(report.id, 'open')}
                          className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          <Unlock size={14} /> إعادة فتح
                        </button>
                      )}
                    </div>
                  </div>
                      </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

        {/* Blocks tab */}
        {activeTab === 'blocks' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-right text-gray-500">
                  <th className="pb-3 font-medium">الحاسب المحظور</th>
                  <th className="pb-3 font-medium">المحظور من قبل</th>
                  <th className="pb-3 font-medium">السبب</th>
                  <th className="pb-3 font-medium">تاريخ الحظر</th>
                  <th className="pb-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {blocks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500">لا توجد عمليات حظر</td>
                  </tr>
                ) : (
                  blocks.map((block) => (
                    <tr key={block.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 text-gray-900">{block.blocked_name || block.blocked_email || '-'}</td>
                      <td className="py-3 text-gray-600">{block.blocker_name || block.blocker_email || '-'}</td>
                      <td className="py-3 text-gray-600">{block.reason || '-'}</td>
                      <td className="py-3 text-gray-500">{formatDate(block.created_at)}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleUnblockUser(block.id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          title="إلغاء الحظر"
                        >
                          <Unlock size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit tab */}
        {activeTab === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-right text-gray-500">
                  <th className="pb-3 font-medium">المشرف</th>
                  <th className="pb-3 font-medium">الإجراء</th>
                  <th className="pb-3 font-medium">الهدف</th>
                  <th className="pb-3 font-medium">التفاصيل</th>
                  <th className="pb-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm text-gray-500">لا توجد سجلات</td>
                  </tr>
                ) : (
                  getFormattedAuditRows().map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 text-gray-900">{log.displayAdminName || log.admin_name || log.admin_email || '-'}</td>
                      <td className="py-3 text-gray-600">{log.displayAction}</td>
                      <td className="py-3 text-gray-600">{log.displayTargetName}{log.displayTargetType ? ` (${log.displayTargetType})` : ''}</td>
                      <td className="py-3 text-gray-600">{log.displayDetails || '-'}</td>
                      <td className="py-3 text-gray-500">{formatDateTime(log.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adminModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-gray-900">{adminModalUser.is_admin ? 'تعديل صلاحيات المشرف' : 'إضافة مشرف بصلاحيات محددة'}</h2><p className="mt-1 text-sm text-gray-500">{adminModalUser.الاسم || 'المستخدم'}</p></div>
              <button type="button" onClick={() => setAdminModalUser(null)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm">إغلاق</button>
            </div>
            <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
              المالك فقط يستطيع إدارة المشرفين. يمكن تحديد الصلاحيات من هنا، ولا يمكن للمشرف المحدود فتح هذا القسم أو تعديل صلاحياته.
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ADMIN_PERMISSIONS.map((permission) => (
                <label key={permission.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-100 p-3 text-sm">
                  <input type="checkbox" checked={selectedAdminPermissions.includes(permission.id)} onChange={(e) => setSelectedAdminPermissions((prev) => e.target.checked ? [...prev, permission.id] : prev.filter((id) => id !== permission.id))} />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={(!adminModalUser.is_admin && adminState.moderatorCount >= 2) || selectedAdminPermissions.length === 0}
                onClick={() => handleMakeAdmin(adminModalUser.user_id, 'moderator', selectedAdminPermissions)}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adminModalUser.is_admin ? 'تحديث الصلاحيات' : 'حفظ صلاحيات المشرف'}
              </button>
              <button type="button" onClick={() => setAdminModalUser(null)} className="rounded-xl bg-gray-100 px-4 py-2 font-semibold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SendIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function ClockIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}