import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from '../common/BrandLogo';
import { DeveloperCredit } from '../common/DeveloperCredit';
import {
  HomeIcon,
  ExploreIcon,
  UploadIcon,
  ChatIcon,
  ProfileIcon,
  NotificationIcon
} from '../common/Icons';
import {
  Bookmark,
  Users,
  Settings,
  ShieldAlert,
  LogOut
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { currentUser, profile, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();

  if (currentPath.startsWith('/admin')) {
    return null;
  }

  const links = [
    { label: 'Home Feed', path: '/home', icon: HomeIcon },
    { label: 'Explore Space', path: '/explore', icon: ExploreIcon },
    { label: 'Create Post', path: '/upload', icon: UploadIcon, badge: 'New' },
    { label: 'Messages', path: '/chat', icon: ChatIcon },
    { label: 'Notifications', path: '/notifications', icon: NotificationIcon, count: unreadCount },
    { label: 'Friends', path: '/friends', icon: Users },
    { label: 'Saved Favorites', path: '/favorites', icon: Bookmark },
    { label: 'My Profile', path: '/profile', icon: ProfileIcon },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 fixed left-0 top-0 bottom-0 z-30 p-4 border-r border-white/5 bg-[#090d18]/90 backdrop-blur-2xl">
      <div className="pt-2 pb-6 px-2">
        <BrandLogo size="md" showSubtitle onClick={() => navigate('/home')} />
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {links.map((link) => {
          const isActive = currentPath === link.path || (link.path !== '/home' && currentPath.startsWith(link.path));
          const Icon = link.icon;

          return (
            <button
              key={link.path}
              onClick={() => {
                if (!currentUser && ['/upload', '/chat', '/notifications', '/favorites', '/profile'].includes(link.path)) {
                  navigate('/login');
                } else {
                  navigate(link.path);
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium text-sm transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/10 text-purple-300 border border-purple-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>

              {link.count && link.count > 0 ? (
                <span className="text-xs font-bold text-white bg-pink-600 px-2 py-0.5 rounded-full">
                  {link.count}
                </span>
              ) : null}

              {link.badge && !link.count && (
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
            >
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Admin Management</span>
            </button>
          </div>
        )}
      </nav>

      {/* User profile snippet & credit */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        {currentUser ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5">
            <div 
              className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
              onClick={() => navigate('/profile')}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center text-purple-300 font-bold text-sm border border-purple-500/30">
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  (profile?.username?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.displayName || profile?.username}
                </p>
                <p className="text-[10px] text-purple-300/80 truncate">
                  @{profile?.username}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 transition-all text-center shadow-md"
          >
            Sign In / Register
          </button>
        )}

        <div className="px-2">
          <DeveloperCredit variant="compact" />
        </div>
      </div>
    </aside>
  );
};
