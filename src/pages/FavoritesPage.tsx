import React, { useEffect, useState } from 'react';
import { Post, Favorite } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PostCard } from '../components/post/PostCard';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc 
} from '../services/firebase';
import { Bookmark, Sparkles } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigate } = useRouter();
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const favs = snapshot.docs.map((d) => d.data() as Favorite);
      const postPromises = favs.map((f) => getDoc(doc(db, 'posts', f.postId)));
      const postSnapshots = await Promise.all(postPromises);

      const loadedPosts = postSnapshots
        .filter((snap) => snap.exists())
        .map((snap) => ({ id: snap.id, ...snap.data() } as Post));

      setFavoritePosts(loadedPosts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader title="Saved Favorites" />
        <div className="max-w-md mx-auto p-12 text-center space-y-4">
          <Bookmark className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Sign In to View Favorites</h2>
          <p className="text-xs text-slate-400">Save and collect your favorite posts in one place.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-purple-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Saved Favorites" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card rounded-3xl h-64 bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : favoritePosts.length > 0 ? (
          <div className="space-y-5">
            {favoritePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={(id) => setFavoritePosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <Bookmark className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No favorites saved yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap the bookmark icon on any post to keep it in your personal collection.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
            >
              Explore Feed
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
