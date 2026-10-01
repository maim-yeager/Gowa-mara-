import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Report } from '../../types';
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
import { Flag, Check, X, ShieldAlert, AlertCircle, Trash2 } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(list);
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (report: Report, resolution: 'resolved' | 'dismissed') => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: resolution,
        updatedAt: serverTimestamp(),
      });
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        `report_${resolution}`,
        'report',
        report.id,
        `Report against ${report.targetType} ${report.targetId} was marked as ${resolution}`
      );
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: resolution } : r))
      );
    } catch (err) {
      console.error("Resolve report error:", err);
    }
  };

  return (
    <AdminLayout currentTab="reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-400" />
            <span>Community Abuse Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Review user-submitted violation flags and enforce community guidelines.
          </p>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all ${
                  r.status === 'pending'
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-white/5 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300">
                        {r.targetType}
                      </span>
                      <h4 className="text-sm font-bold text-white capitalize">{r.reason}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        r.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {r.description || 'No additional details provided by reporter.'}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>Target ID: {r.targetId}</span>
                      <span>&bull;</span>
                      <span>Reporter ID: {r.reporterId}</span>
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(r, 'resolved')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                      >
                        Take Action & Resolve
                      </button>
                      <button
                        onClick={() => handleResolve(r, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center space-y-2">
            <Check className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No abuse reports</h4>
            <p className="text-xs text-slate-400">All community reports have been resolved.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
