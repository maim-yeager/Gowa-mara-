import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from '../common/BrandLogo';
import { 
  SearchIcon, 
  NotificationIcon, 
  BackIcon, 
  SparklesIcon 
} from '../common/Icons';
import { ShieldAlert, Search } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = false }) => {
  const { currentPath, navigate, goBack } = useRouter();
  const { currentUser, profile, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [desktopSearchQuery, setDesktopSearchQuery] = useState<string>('');

  const isRootTab = ['/', '/home', '/explore', '/upload', '/chat', '/profile'].includes(currentPath);
  const shouldShowBack = showBack || (!isRootTab && !currentPath.startsWith('/admin'));

  const handleDesktopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (desktopSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(desktopSearchQuery.trim())}`);
    }
  };

  const userAvatar = profile?.photoUrl || profile?.avatarUrl;
  const userInitial = (profile?.displayName?.[0] || profile?.username?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 backdrop-blur-2xl">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Back button (if internal) + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {shouldShowBack && (
            <button
              onClick={goBack}
              aria-label="Go back"
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
            >
              <BackIcon className="w-5 h-5" />
            </button>
          )}

          {title ? (
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-white truncate max-w-[160px] sm:max-w-xs">
                {title}
              </h2>
            </div>
          ) : (
            <BrandLogo size="sm" onClick={() => navigate('/home')} />
          )}
        </div>

        {/* Desktop / Tablet Center Search Bar */}
        <div className="hidden sm:flex flex-1 max-w-sm mx-4">
          <form onSubmit={handleDesktopSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search creators, images, tags..."
              value={desktopSearchQuery}
              onChange={(e) => setDesktopSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full glass-input text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-inner transition-all"
            />
          </form>
        </div>

        {/* Right Action Icons: Search (mobile), Bell (Notifications), Profile Avatar (DP) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Admin panel badge if admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-full transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Search Button (Mobile visible, taps to /search) */}
          <button
            onClick={() => navigate('/search')}
            aria-label="Search Gowa Mara"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          {/* Notifications Bell with Unread Badge */}
          {currentUser && (
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
              className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
            >
              <NotificationIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-full px-1 shadow-lg ring-2 ring-[#070a13] animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Avatar [DP] Interaction */}
          {currentUser ? (
            <button
              onClick={() => navigate('/profile')}
              aria-label="Open My Profile"
              className="group relative flex items-center p-0.5 rounded-full ring-2 ring-purple-500/40 hover:ring-purple-400 transition-all active:scale-95 ml-1"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-gradient-to-tr from-purple-900 to-slate-800 flex items-center justify-center text-purple-200 font-bold text-xs shadow-md">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={profile?.username || 'Avatar'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 px-3.5 py-1.5 rounded-full transition-all shadow-md active:scale-95 ml-1"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
