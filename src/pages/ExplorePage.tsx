import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { db, collection, query, where, limit, onSnapshot } from '../services/firebase';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { Search, Compass, Eye, Heart } from 'lucide-react';
import { ImageViewerModal } from '../components/common/ImageViewerModal';

export const ExplorePage: React.FC = () => {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  const tags = ['all', 'cyber', 'art', 'minimal', 'dark', 'neon', 'tech', 'nature', 'ui'];

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      where('status', '==', 'active'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Post[];
      setPosts(items);
    });

    return () => unsubscribe();
  }, []);

  const filtered = posts.filter((p) => {
    const matchesSearch = searchTerm === '' || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = selectedTag === 'all' ||
      p.tags?.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())) ||
      p.category?.toLowerCase() === selectedTag.toLowerCase();

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Explore Spaces" />

      <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tags, categories, images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all shadow-inner"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize ${
                selectedTag === t
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* Explore Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 cursor-pointer shadow-md hover:border-purple-500/40 transition-all duration-300"
              >
                <img
                  src={post.thumbnailUrl || post.imageUrl}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover overlay with title & like count */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-xs font-bold text-white truncate">
                    {post.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                    <span>@{post.ownerUsername}</span>
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <Heart className="w-3 h-3 fill-rose-500" /> {post.likeCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No images match your search</h3>
            <p className="text-xs text-slate-400">Try changing keywords or removing filters.</p>
          </div>
        )}
      </main>

      {selectedImage && (
        <ImageViewerModal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
        />
      )}
    </div>
  );
};
