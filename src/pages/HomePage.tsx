import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { AnnouncementBanner } from '../components/common/AnnouncementBanner';
import { ApprovalStatusCard } from '../components/common/ApprovalStatusCard';
import { PostCard } from '../components/post/PostCard';
import { DeveloperCredit } from '../components/common/DeveloperCredit';
import { Sparkles, Image as ImageIcon, PlusCircle, Compass } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { currentUser, profile, isApproved } = useAuth();
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = [
    'all',
    'Photography',
    'Digital Art',
    'Cybersecurity',
    'UI/UX Design',
    'Wallpapers',
    'Anime',
    'Nature'
  ];

  useEffect(() => {
    setIsLoading(true);
    // Real query for active public posts
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      where('status', '==', 'active'),
      limit(40)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Post[];

        // Sort by timestamp desc
        items.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setPosts(items);
        setIsLoading(false);
      },
      (err) => {
        console.warn("Posts load warning:", err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredPosts = categoryFilter === 'all'
    ? posts
    : posts.filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase());

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* Active Admin Announcements */}
        <AnnouncementBanner />

        {/* Approval Card if Pending or Suspended */}
        <ApprovalStatusCard />

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-3xl p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 rounded bg-slate-800" />
                    <div className="w-16 h-2 rounded bg-slate-800" />
                  </div>
                </div>
                <div className="w-full h-64 rounded-2xl bg-slate-800/80" />
                <div className="w-3/4 h-4 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-5">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center space-y-4 border border-white/5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">No posts in this feed yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Be the first approved creator to publish a stunning image to Gowa Mara!
              </p>
            </div>
            {isApproved ? (
              <button
                onClick={() => navigate('/upload')}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Post</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/explore')}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 transition-all inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Other Spaces</span>
              </button>
            )}
          </div>
        )}

        {/* Footer Credit */}
        <div className="pt-6">
          <DeveloperCredit variant="footer" />
        </div>
      </main>
    </div>
  );
};
