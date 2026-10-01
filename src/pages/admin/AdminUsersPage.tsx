import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { UserProfile, UserStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from '../../services/firebase';
import { recordAdminLog } from '../../services/adminLogService';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Clock, 
  ShieldBan, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  Filter
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => d.data() as UserProfile);
      setUsers(list);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (user: UserProfile, newStatus: UserStatus) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        `user_status_${newStatus}`,
        'user',
        user.uid,
        `Status of @${user.username} changed to ${newStatus}`
      );
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout currentTab="users">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>User Directory & Permissions</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage accounts, approval states, and disciplinary actions.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs">
                          {u.photoUrl ? (
                            <img src={u.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (u.username[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{u.displayName || u.username}</p>
                          <p className="text-[10px] text-purple-300 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                        u.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        u.status === 'blocked' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(u, 'approved')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                        )}
                        {u.status !== 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(u, 'suspended')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
                          >
                            Suspend
                          </button>
                        )}
                        {u.status !== 'blocked' && (
                          <button
                            onClick={() => handleUpdateStatus(u, 'blocked')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
