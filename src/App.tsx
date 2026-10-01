import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { NotificationProvider } from './context/NotificationContext';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { BottomNavigation } from './components/layout/BottomNavigation';

// User Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { UploadPage } from './pages/UploadPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { FriendsPage } from './pages/FriendsPage';
import { ChatPage } from './pages/ChatPage';
import { ChatConversationPage } from './pages/ChatConversationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PublicPostPage } from './pages/PublicPostPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { isAdmin, isLoading, currentUser } = useAuth();

  // Route Dispatcher
  const renderRoute = () => {
    // Admin Login direct route
    if (currentPath === '/admin/login') {
      return <LoginPage initialAdminMode={true} />;
    }

    // Admin Routes Guard
    if (currentPath.startsWith('/admin')) {
      if (!isLoading && !isAdmin) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-[#070a13] text-center">
            <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Admin Authorization Required</h2>
              <p className="text-xs text-slate-400">
                You must be authenticated as the authorized administrator (<span className="text-amber-400 font-mono font-semibold">mdmaim.69@gmail.com</span>) to access the Gowa Mara Admin Console.
              </p>
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg"
                >
                  Log In to Admin Portal
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 transition-colors"
                >
                  Return to Home Feed
                </button>
              </div>
            </div>
          </div>
        );
      }

      if (currentPath === '/admin/approvals') return <AdminApprovalsPage />;
      if (currentPath === '/admin/users') return <AdminUsersPage />;
      if (currentPath === '/admin/posts') return <AdminPostsPage />;
      if (currentPath === '/admin/reports') return <AdminReportsPage />;
      if (currentPath === '/admin/activity') return <AdminActivityPage />;
      if (currentPath === '/admin/announcements') return <AdminAnnouncementsPage />;
      if (currentPath === '/admin/settings') return <AdminSettingsPage />;
      return <AdminDashboardPage />;
    }

    // Public Post Route
    if (currentPath.startsWith('/p/')) return <PublicPostPage />;

    // Post Detail Route
    if (currentPath.startsWith('/post/')) return <PostDetailPage />;

    // Public User Profile Route
    if (currentPath.startsWith('/profile/') || currentPath.startsWith('/u/')) {
      return <PublicProfilePage />;
    }

    // Chat Conversation Route
    if (currentPath.startsWith('/chat/')) return <ChatConversationPage />;

    // Main User Routes
    switch (currentPath) {
      case '/':
      case '/home':
        return <HomePage />;
      case '/explore':
        return <ExplorePage />;
      case '/upload':
      case '/editor':
        return <UploadPage />;
      case '/favorites':
        return <FavoritesPage />;
      case '/profile':
        return <ProfilePage />;
      case '/friends':
        return <FriendsPage />;
      case '/chat':
        return <ChatPage />;
      case '/notifications':
        return <NotificationsPage />;
      case '/search':
        return <SearchPage />;
      case '/settings':
        return <SettingsPage />;
      case '/login':
      case '/admin/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      default:
        return <HomePage />;
    }
  };

  const isAdminRoute = currentPath.startsWith('/admin');
  const isAuthRoute = currentPath === '/login' || currentPath === '/register' || currentPath.startsWith('/p/');

  return (
    <div className="min-h-screen bg-[#070a13] font-body selection:bg-purple-500/30 selection:text-purple-200">
      {/* Desktop Sidebar (hidden on mobile, auth, and admin) */}
      {!isAdminRoute && !isAuthRoute && <DesktopSidebar />}

      {/* Main Content View with desktop sidebar offset */}
      <div className={`${!isAdminRoute && !isAuthRoute ? 'md:pl-64 lg:pl-72' : ''} min-h-screen transition-all`}>
        {renderRoute()}
      </div>

      {/* Mobile Floating Bottom Navigation (hidden on desktop, auth, and admin) */}
      {!isAdminRoute && !isAuthRoute && <BottomNavigation />}
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
