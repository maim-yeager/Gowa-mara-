import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { 
  Bell, 
  CheckCheck, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ShieldCheck, 
  Megaphone, 
  Clock 
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { navigate } = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'approval':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Notifications" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Header action */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">Activity Center</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold text-white bg-pink-600 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.link) navigate(n.link);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'glass-card border-white/5 opacity-75 hover:opacity-100'
                    : 'glass-card border-purple-500/30 bg-purple-950/20 shadow-lg'
                }`}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No notifications yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              When someone likes your posts, comments, or sends a friend request, updates will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
