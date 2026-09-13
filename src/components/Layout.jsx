import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, MessageCircle, Shield, LogOut, User, Home, Menu, X, Eye, Bell } from 'lucide-react';
import IssueReportButton from './IssueReportButton';
import NotificationsDropdown from './NotificationsDropdown';

export default function Layout({ children, currentUser, onLogout }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navLinks = currentUser
    ? currentUser.role === 'admin'
      ? [
          { path: '/admin', label: 'لوحة التحكم', icon: Shield },
          { path: '/profiles', label: 'استعراض الملفات', icon: Users },
          { path: '/messages', label: 'الرسائل', icon: MessageCircle },
        ]
      : [
          { path: '/', label: 'الرئيسية', icon: Home },
          { path: '/profiles', label: 'استعراض الملفات', icon: Users },
          { path: '/messages', label: 'الرسائل', icon: MessageCircle },
          { path: '/notifications', label: 'الإشعارات', icon: Bell },
          { path: '/profile-views', label: 'من زار ملفي', icon: Eye },
          { path: '/profile/edit', label: 'ملفي', icon: User },
        ]
    : [
        { path: '/', label: 'الرئيسية', icon: Heart },
        { path: '/register', label: 'التسجيل', icon: User },
        { path: '/login', label: 'تسجيل الدخول', icon: LogOut },
      ];

  return (
    <div className="min-h-screen bg-sand-50/50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Heart size={20} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-brand-800">عفاف حضرموت نت</span>
              <span className="text-[10px] leading-tight text-brand-600">منصة زواج خيري</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
            {currentUser && (
              <>
                <NotificationsDropdown currentUser={currentUser} />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} />
                  خروج
                </button>
              </>
            )}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-brand-100 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              {currentUser && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  تسجيل الخروج
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">{children}</main>

      <IssueReportButton />
    </div>
  );
}