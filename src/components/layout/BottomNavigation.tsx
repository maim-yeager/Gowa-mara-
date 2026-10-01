import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  ExploreIcon, 
  UploadIcon, 
  ChatIcon, 
  ProfileIcon 
} from '../common/Icons';

export const BottomNavigation: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { isApproved, currentUser } = useAuth();

  // Hide on admin routes or full-screen image editor
  if (currentPath.startsWith('/admin') || currentPath === '/editor') {
    return null;
  }

  const navItems = [
    { label: 'Home', path: '/home', icon: HomeIcon, match: ['/', '/home'] },
    { label: 'Explore', path: '/explore', icon: ExploreIcon, match: ['/explore'] },
    { 
      label: 'Upload', 
      path: '/upload', 
      icon: UploadIcon, 
      isAction: true,
      match: ['/upload'] 
    },
    { label: 'Chat', path: '/chat', icon: ChatIcon, match: ['/chat', '/friends'] },
    { label: 'Profile', path: '/profile', icon: ProfileIcon, match: ['/profile', '/settings'] },
  ];

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass-panel bg-[#0d1222]/85 backdrop-blur-2xl rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/10 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.match.includes(currentPath) || currentPath.startsWith(item.path + '/');
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login');
                    } else {
                      navigate('/upload');
                    }
                  }}
                  aria-label="Upload post"
                  className="relative -top-4 flex flex-col items-center group focus:outline-none"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-400 p-[2px] shadow-lg shadow-purple-600/30 group-active:scale-95 transition-all">
                    <div className="w-full h-full bg-[#0d1222] rounded-[14px] flex items-center justify-center text-white group-hover:bg-transparent transition-colors">
                      <Icon className="w-6 h-6 text-pink-300 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 mt-1">
                    Upload
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'text-purple-400 scale-105' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-purple-500/10 rounded-2xl border border-purple-500/20 -z-10 animate-fade-in" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''}`} />
                <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-0.5 shadow-[0_0_6px_#c084fc]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
