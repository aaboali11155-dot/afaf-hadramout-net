const ACTION_LABELS = {
  contact_request_review_contact_request_approved: 'اعتماد طلب تواصل',
  contact_request_review_contact_request_rejected: 'رفض طلب تواصل',
  contact_request_approved: 'اعتماد طلب تواصل',
  contact_request_rejected: 'رفض طلب تواصل',
  message_approved: 'اعتماد رسالة',
  message_rejected: 'رفض رسالة',
  message_sent: 'إرسال رسالة',
  profile_approved: 'اعتماد الملف الشخصي',
  profile_hidden: 'إخفاء الملف الشخصي',
  profile_updated: 'تحديث الملف الشخصي',
  warning: 'إرسال تحذير',
  suspend: 'تعليق الحساب',
  ban: 'حظر الحساب',
  report_resolved: 'معالجة بلاغ',
  report_ignored: 'تجاهل بلاغ',
  site_issue_resolved: 'معالجة بلاغ موقع',
  site_issue_closed: 'إغلاق بلاغ موقع',
  admin_created: 'إضافة مشرف',
  admin_updated: 'تعديل صلاحيات مشرف',
  admin_revoked: 'إلغاء صلاحيات مشرف',
};

const normalize = (value) => String(value ?? '').trim();

export function getAuditActionLabel(action) {
  const raw = normalize(action);
  if (!raw) return 'عملية إدارية';
  if (ACTION_LABELS[raw]) return ACTION_LABELS[raw];

  const lower = raw.toLowerCase();
  if (lower.includes('contact_request') && lower.includes('approved')) return 'اعتماد طلب تواصل';
  if (lower.includes('contact_request') && lower.includes('rejected')) return 'رفض طلب تواصل';
  if (lower.includes('message') && lower.includes('approved')) return 'اعتماد رسالة';
  if (lower.includes('message') && lower.includes('rejected')) return 'رفض رسالة';
  if (lower.includes('profile') && lower.includes('hidden')) return 'إخفاء الملف الشخصي';
  if (lower.includes('profile') && lower.includes('approved')) return 'اعتماد الملف الشخصي';
  if (lower.includes('suspend')) return 'تعليق الحساب';
  if (lower.includes('ban')) return 'حظر الحساب';
  if (lower.includes('warning')) return 'إرسال تحذير';
  if (lower.includes('admin') && lower.includes('revok')) return 'إلغاء صلاحيات مشرف';
  if (lower.includes('admin') && (lower.includes('update') || lower.includes('edit'))) return 'تعديل صلاحيات مشرف';
  if (lower.includes('admin') && (lower.includes('create') || lower.includes('add'))) return 'إضافة مشرف';

  return raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditDate(value) {
  if (!value) return 'غير متوفر';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير متوفر';

  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function getAuditDetails(row) {
  const raw = normalize(row?.details ?? row?.description ?? row?.metadata ?? '');
  if (!raw) {
    const label = getAuditActionLabel(row?.action ?? row?.event_type);
    return `تم تنفيذ: ${label}`;
  }

  // Keep original content available to the UI while removing only obvious UUID clutter.
  return raw.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    'معرّف محفوظ في السجل'
  );
}

export function formatAuditLogRow(row, { adminNameMap = {}, userNameMap = {} } = {}) {
  const adminId = row?.admin_user_id ?? row?.admin_id ?? row?.user_id ?? null;
  const targetId = row?.target_user_id ?? row?.reported_user_id ?? row?.target_id ?? row?.entity_id ?? null;

  return {
    ...row,
    displayAction: getAuditActionLabel(row?.action ?? row?.event_type),
    displayAdminName: adminNameMap[adminId] || row?.admin_name || 'غير معروف',
    displayUserName: userNameMap[targetId] || row?.target_user_name || 'غير محدد',
    displayDetails: getAuditDetails(row),
    displayTargetName: userNameMap[targetId] || row?.target_user_name || (targetId ? 'مستخدم غير معروف' : 'لا يوجد هدف'),
    displayTargetType: row?.entity_type ?? row?.target_type ?? '',
    displayDate: formatAuditDate(row?.created_at ?? row?.timestamp ?? row?.occurred_at),
  };
}
