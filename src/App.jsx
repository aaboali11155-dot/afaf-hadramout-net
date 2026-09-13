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
              <RegisterPage
                selectedSection={selectedSection}
                setCurrentUser={setCurrentUser}
              />
            }
          />
          <Route
            path="/login"
            element={<LoginPage setCurrentUser={setCurrentUser} />}
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
            element={<ProfilesPage currentUser={currentUser} />}
          />
          <Route
            path="/profile/:id"
            element={
              <ProfileDetailPage
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/messages"
            element={
              <MessagesPage
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/profile-views"
            element={
              currentUser ? (
                <ProfileViewsPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              currentUser ? (
                <NotificationsPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
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
