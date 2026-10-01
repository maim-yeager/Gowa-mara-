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
    // Admin Routes Guard
    if (currentPath.startsWith('/admin')) {
      if (!isLoading && !isAdmin) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-[#070a13] text-center">
            <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/10 space-y-4">
              <h2 className="text-lg font-bold text-rose-400">Admin Authorization Required</h2>
              <p className="text-xs text-slate-400">
                You must be logged in as an authorized administrator to access the Gowa Mara Admin Console.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500"
              >
                Sign In to Admin
              </button>
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
