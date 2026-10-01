import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useRouter } from '../../context/RouterContext';
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where 
} from '../../services/firebase';
import { 
  Users, 
  UserCheck, 
  Clock, 
  ShieldBan, 
  Image as ImageIcon, 
  Flag, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const [stats, setStats] = useState<{
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    blockedUsers: number;
    suspendedUsers: number;
    totalPosts: number;
    pendingReports: number;
  }>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    totalPosts: 0,
    pendingReports: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        // Fetch all users to calculate real metrics
        const usersSnap = await getDocs(collection(db, 'users'));
        let pending = 0;
        let approved = 0;
        let blocked = 0;
        let suspended = 0;

        usersSnap.docs.forEach((doc) => {
          const status = doc.data().status;
          if (status === 'pending') pending++;
          else if (status === 'approved') approved++;
          else if (status === 'blocked') blocked++;
          else if (status === 'suspended') suspended++;
        });

        // Fetch posts
        const postsSnap = await getDocs(collection(db, 'posts'));
        
        // Fetch pending reports
        const repSnap = await getDocs(query(collection(db, 'reports'), where('status', '==', 'pending')));

        setStats({
          totalUsers: usersSnap.size,
          pendingUsers: pending,
          approvedUsers: approved,
          blockedUsers: blocked,
          suspendedUsers: suspended,
          totalPosts: postsSnap.size,
          pendingReports: repSnap.size,
        });
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const cards = [
    {
      title: 'Pending Approvals',
      value: stats.pendingUsers,
      sub: 'Awaiting creator publishing approval',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      link: '/admin/approvals',
      actionText: 'Review Applicants'
    },
    {
      title: 'Approved Creators',
      value: stats.approvedUsers,
      sub: 'Verified accounts with publishing rights',
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      link: '/admin/users'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      sub: 'Registered platform profiles',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      link: '/admin/users'
    },
    {
      title: 'Platform Posts',
      value: stats.totalPosts,
      sub: 'Social image posts published',
      icon: ImageIcon,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      link: '/admin/posts'
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      sub: 'Abuse & violation reports to triage',
      icon: Flag,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      link: '/admin/reports'
    },
    {
      title: 'Suspended / Blocked',
      value: stats.suspendedUsers + stats.blockedUsers,
      sub: 'Accounts under disciplinary action',
      icon: ShieldBan,
      color: 'text-slate-400',
      bg: 'bg-white/5 border-white/10',
      link: '/admin/users'
    },
  ];

  return (
    <AdminLayout currentTab="dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">System Metrics & Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics computed directly from Firestore database
          </p>
        </div>

        {/* Pending Approval Notice Banner */}
        {stats.pendingUsers > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-amber-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <p className="font-bold text-xs text-white">
                  {stats.pendingUsers} new account{stats.pendingUsers > 1 ? 's' : ''} awaiting approval
                </p>
                <p className="text-[11px] text-amber-200/80">
                  New users cannot publish posts until you approve them in the Approval Center.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow transition-all whitespace-nowrap ml-4"
            >
              Go to Approvals
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                onClick={() => c.link && navigate(c.link)}
                className={`p-5 rounded-2xl border ${c.bg} shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {c.title}
                  </span>
                  <div className={`p-2 rounded-xl bg-white/5 ${c.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-white">
                    {isLoading ? '...' : c.value}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{c.sub}</p>
                </div>

                {c.actionText && (
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-amber-300">
                    <span>{c.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};
