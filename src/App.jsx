import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SectionSelectPage from './pages/SectionSelectPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfileFormPage from './pages/ProfileFormPage';
import ProfilesPage from './pages/ProfilesPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import MessagesPage from './pages/MessagesPage';
import ProfileViewsPage from './pages/ProfileViewsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProfileDetailPage from './pages/AdminProfileDetailPage';
import EmailConfirmedPage from './pages/EmailConfirmedPage';
import useSupabaseAuth from './hooks/useSupabaseAuth';
import useUserRole from './hooks/useUserRole';
import { signOut } from './services/authService';
import { supabase } from './lib/supabase';
import { requestBrowserNotifications, subscribeToMyNotifications, showBrowserNotification } from './services/notificationService';

const isGoogleOAuthUser = (u) => {
  if (!u) return false;
  return (
    u.app_metadata?.provider === 'google' ||
    (Array.isArray(u.app_metadata?.providers) && u.app_metadata.providers.includes('google')) ||
    (Array.isArray(u.identities) && u.identities.some((i) => i.provider === 'google'))
  );
};

function RequireCompleteProfile({ currentUser, user, profile, loading, children }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  // Enforce mandatory profile setup specifically for NEW Google OAuth users without a linked profile
  const isNewGoogleUser = isGoogleOAuthUser(user) && !profile;
  if (isNewGoogleUser) {
    return <Navigate to="/profile/create" replace />;
  }
  return children;
}

export default function App() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { role, profile, loading: roleLoading } = useUserRole(user?.id);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const sessionKickInProgress = useRef(false);

  useEffect(() => {
    if (!user) {
      setCurrentUser(null);
      return;
    }

    // Ask once for browser notifications and listen for new notifications in real time.
    requestBrowserNotifications();
    const unsubscribe = subscribeToMyNotifications(user.id, showBrowserNotification);
    return unsubscribe;
  }, [user?.id]);

  // فحص ديناميكي للحسابات الموقوفة/المحظورة أثناء الجلسة النشطة.
  // يتم الفحص عند تحميل بيانات المستخدم، وعند العودة للتبويب، وبشكل دوري.
  useEffect(() => {
    if (!user?.id) return undefined;

    let cancelled = false;

    const checkAccountStatus = async () => {
      if (cancelled || sessionKickInProgress.current) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled || error || !data) return;

      if (data.account_status === 'suspended' || data.account_status === 'banned') {
        sessionKickInProgress.current = true;
        alert('تم إيقاف حسابك. سيتم تسجيل خروجك الآن.');
        await signOut().catch(() => {});
        if (!cancelled) {
          setCurrentUser(null);
          const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
          window.location.assign(`${base}/login`);
        }
      }
    };

    checkAccountStatus();
    const intervalId = window.setInterval(checkAccountStatus, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAccountStatus();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setCurrentUser(null);
      return;
    }

    setCurrentUser({
      id: user.id,
      email: user.email,
      gender: profile?.الجنس || user.user_metadata?.gender || selectedSection || 'male',
      role: profile?.is_admin ? 'admin' : 'user',
      isAdmin: !!profile?.is_admin,
      adminRole: profile?.admin_role || null,
      adminPermissions: Array.isArray(profile?.admin_permissions) ? profile.admin_permissions : [],
      isActive: profile?.account_status === 'active',
      profileId: profile?.id || null,
    });
  }, [user, role, profile, selectedSection]);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/+$/, '') || '/'}>
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<HomePage currentUser={currentUser} />} />
          <Route
            path="/select-section"
            element={<SectionSelectPage onSelectSection={setSelectedSection} />}
          />
          <Route
            path="/register"
            element={
              currentUser ? (
                (isGoogleOAuthUser(user) && !profile) ? (
                  <Navigate to="/profile/create" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <RegisterPage
                  selectedSection={selectedSection}
                  setCurrentUser={setCurrentUser}
                />
              )
            }
          />
          <Route
            path="/login"
            element={
              currentUser ? (
                (isGoogleOAuthUser(user) && !profile) ? (
                  <Navigate to="/profile/create" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <LoginPage setCurrentUser={setCurrentUser} />
              )
            }
          />
          <Route
            path="/profile/create"
            element={
              <ProfileFormPage
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProfileFormPage
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/profiles"
            element={
              <RequireCompleteProfile currentUser={currentUser} user={user} profile={profile} loading={authLoading || roleLoading}>
                <ProfilesPage currentUser={currentUser} />
              </RequireCompleteProfile>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <RequireCompleteProfile currentUser={currentUser} user={user} profile={profile} loading={authLoading || roleLoading}>
                <ProfileDetailPage currentUser={currentUser} />
              </RequireCompleteProfile>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireCompleteProfile currentUser={currentUser} user={user} profile={profile} loading={authLoading || roleLoading}>
                <MessagesPage currentUser={currentUser} />
              </RequireCompleteProfile>
            }
          />
          <Route
            path="/profile-views"
            element={
              <RequireCompleteProfile currentUser={currentUser} user={user} profile={profile} loading={authLoading || roleLoading}>
                <ProfileViewsPage currentUser={currentUser} />
              </RequireCompleteProfile>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireCompleteProfile currentUser={currentUser} user={user} profile={profile} loading={authLoading || roleLoading}>
                <NotificationsPage currentUser={currentUser} />
              </RequireCompleteProfile>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminDashboardPage
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/admin/profiles/:id"
            element={
              <AdminProfileDetailPage
                currentUser={currentUser}
              />
            }
          />
          <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
          <Route path="/email-confirmed/" element={<EmailConfirmedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
