import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { APP_CONFIG } from '../../config/appConfig';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  Image as ImageIcon, 
  Flag, 
  Megaphone, 
  Activity, 
  Sliders, 
  ArrowLeft, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode; currentTab: string }> = ({
  children,
  currentTab
}) => {
  const { currentPath, navigate } = useRouter();
  const { currentUser, profile, isAdmin, logout } = useAuth();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approval Center', path: '/admin/approvals', icon: UserCheck, badge: 'Crucial' },
    { id: 'users', label: 'User Directory', path: '/admin/users', icon: Users },
    { id: 'posts', label: 'Post Moderation', path: '/admin/posts', icon: ImageIcon },
    { id: 'reports', label: 'Abuse Reports', path: '/admin/reports', icon: Flag },
    { id: 'announcements', label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { id: 'activity', label: 'Audit Logs', path: '/admin/activity', icon: Activity },
    { id: 'settings', label: 'Platform Settings', path: '/admin/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#060811] text-slate-100 flex flex-col md:flex-row">
      {/* Admin Dedicated Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 bg-[#090d18] border-r border-white/5 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Admin Header */}
          <div className="p-4 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <BrandLogo size="sm" onClick={() => navigate('/admin/dashboard')} />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gowa Mara Platform Control
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Exit */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => navigate('/home')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User App</span>
          </button>

          <div className="pt-2 text-center text-[10px] text-slate-500">
            Authenticated Admin: <span className="text-slate-300 font-mono">{currentUser?.email}</span>
          </div>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 border-b border-white/5 bg-[#090d18]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h1 className="font-bold text-base text-white capitalize">
              {currentTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src={APP_CONFIG.adminPicUrl}
                alt={APP_CONFIG.developerName}
                className="w-8 h-8 rounded-full object-cover border border-amber-400/40 bg-slate-800"
              />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{APP_CONFIG.developerName}</p>
                <p className="text-[10px] text-amber-300 font-mono leading-tight">{currentUser?.email || APP_CONFIG.adminEmail}</p>
              </div>
            </div>
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign Out"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
