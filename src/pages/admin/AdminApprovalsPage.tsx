import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from '../../services/firebase';
import { recordAdminLog } from '../../services/adminLogService';
import { 
  UserCheck, 
  UserX, 
  ShieldBan, 
  AlertTriangle, 
  Clock, 
  Check, 
  Mail, 
  Calendar 
} from 'lucide-react';

export const AdminApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((d) => d.data() as UserProfile);
      setPendingUsers(users);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (user: UserProfile, newStatus: 'approved' | 'rejected' | 'suspended' | 'blocked') => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Send audit log
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        `user_${newStatus}`,
        'user',
        user.uid,
        `User @${user.username} was marked as ${newStatus}`
      );

      // Send in-app notification to the user
      await sendNotification(
        user.uid,
        newStatus === 'approved' ? 'approval' : 'status_change',
        newStatus === 'approved' ? 'Account Approved!' : 'Account Status Updated',
        newStatus === 'approved'
          ? 'Congratulations! An administrator has approved your account. You can now create and publish image posts!'
          : `Your account status has been updated to: ${newStatus}`,
        '/upload'
      );

      setActionSuccess(`User @${user.username} has been ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      console.error("Approval action error:", err);
    }
  };

  return (
    <AdminLayout currentTab="approvals">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Account Approval Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review new registrant submissions and grant or restrict posting privileges.
          </p>
        </div>

        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 rounded-2xl h-28 bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : pendingUsers.length > 0 ? (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.uid}
                className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl transition-all hover:border-amber-500/30"
              >
                {/* User Info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xl flex-shrink-0">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      (user.username[0] || 'U').toUpperCase()
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">
                        {user.displayName || user.username}
                      </h3>
                      <span className="text-xs text-amber-300 font-mono">@{user.username}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.email}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Just registered'}</span>
                      </span>
                    </div>

                    {user.bio && (
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed max-w-lg">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  <button
                    onClick={() => handleAction(user, 'approved')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve User</span>
                  </button>

                  <button
                    onClick={() => handleAction(user, 'rejected')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleAction(user, 'blocked')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
                    title="Block User"
                  >
                    <ShieldBan className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">All caught up!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no pending accounts waiting for approval. When new users register, they will appear here immediately.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
