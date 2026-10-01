import React, { useEffect, useState } from 'react';
import { db, collection, query, where, onSnapshot } from '../../services/firebase';
import { Announcement } from '../../types';
import { Megaphone, AlertTriangle, Info, X } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Announcement[];
      setAnnouncements(items);
    }, (err) => {
      // announcements might be empty initially
      console.warn("Announcements notice:", err.message);
    });

    return () => unsubscribe();
  }, []);

  const activeVisible = announcements.filter((a) => !dismissed[a.id]);

  if (activeVisible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {activeVisible.map((a) => (
        <div
          key={a.id}
          className={`p-3.5 rounded-2xl border flex items-start gap-3 relative transition-all ${
            a.priority === 'urgent'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
              : a.priority === 'normal'
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-200'
              : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-white/10 mt-0.5">
            {a.priority === 'urgent' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Megaphone className="w-4 h-4 text-purple-300" />
            )}
          </div>

          <div className="flex-1 pr-6">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">
              {a.title}
            </h4>
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
              {a.message}
            </p>
          </div>

          <button
            onClick={() => setDismissed((prev) => ({ ...prev, [a.id]: true }))}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
