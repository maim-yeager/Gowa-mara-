import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLog } from '../../types';
import { db, collection, getDocs, limit, query, orderBy } from '../../services/firebase';
import { Activity, ShieldCheck, Clock } from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const snap = await getDocs(collection(db, 'adminLogs'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminLog));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setLogs(list);
      } catch (err) {
        console.error("Fetch audit logs error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <AdminLayout currentTab="activity">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Immutable Administrative Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only record of all administrative actions taken on Gowa Mara.
          </p>
        </div>

        {logs.length > 0 ? (
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-amber-300 font-bold">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{log.adminEmail}</td>
                    <td className="py-3 px-4 uppercase text-[10px] text-purple-300">{log.targetType}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">{log.targetId}</td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-300">{log.details || '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center space-y-2">
            <p className="text-xs text-slate-400">No administrative logs recorded yet.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
