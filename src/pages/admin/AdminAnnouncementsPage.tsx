import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Announcement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from '../../services/firebase';
import { recordAdminLog } from '../../services/adminLogService';
import { Megaphone, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(list);
    } catch (err) {
      console.error("Fetch announcements error:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !message.trim()) return;
    setIsSubmitting(true);

    try {
      const newAnn = {
        title: title.trim(),
        message: message.trim(),
        priority,
        active: true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'announcements'), newAnn);
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        'announcement_created',
        'announcement',
        docRef.id,
        `Created announcement: "${title}"`
      );

      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err) {
      console.error("Create announcement error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        'announcement_deleted',
        'announcement',
        id,
        'Deleted announcement'
      );
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete announcement error:", err);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', ann.id), {
        active: !ann.active,
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, active: !a.active } : a))
      );
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  return (
    <AdminLayout currentTab="announcements">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" />
            <span>Site-Wide Announcements</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast messages and operational notices directly to community members.
          </p>
        </div>

        {/* Creation Form */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Publish New Announcement</span>
          </h3>

          <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scheduled Platform Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low (Info)</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Announcement Message
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write your announcement content here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Announcements */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white">Active & Past Announcements</h3>
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`glass-card p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                a.active ? 'border-purple-500/30' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {a.priority}
                  </span>
                  <h4 className="text-sm font-bold text-white">{a.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    a.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {a.active ? 'Active on Site' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">{a.message}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(a)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10"
                >
                  {a.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
