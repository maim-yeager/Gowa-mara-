import React, { useState, useEffect } from 'react';
import { Post, UserProfile } from '../types';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { db, collection, query, where, getDocs, limit } from '../services/firebase';
import { 
  Search, 
  Users, 
  Grid, 
  Tag, 
  Heart, 
  Eye, 
  Clock, 
  X, 
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'tags'>('all');
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [tagResults, setTagResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gowamara_recent_searches');
      return stored ? JSON.parse(stored) : ['nature', 'cyber', 'minimal', 'photography'];
    } catch {
      return ['nature', 'cyber', 'minimal'];
    }
  });

  const popularTags = ['photography', 'cybersecurity', 'ui', 'nature', 'dark', 'wallpapers', 'minimal', 'sunset'];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');
    if (qParam) {
      setSearchTerm(qParam);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim().toLowerCase();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('gowamara_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('gowamara_recent_searches');
    } catch {}
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setPostResults([]);
      setUserResults([]);
      setTagResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const term = searchTerm.trim().toLowerCase();
      saveRecentSearch(term);

      try {
        // 1. Search Users by prefix
        const uQ = query(
          collection(db, 'users'),
          where('username', '>=', term),
          where('username', '<=', term + '\uf8ff'),
          limit(15)
        );
        const uSnap = await getDocs(uQ);
        setUserResults(uSnap.docs.map((d) => d.data() as UserProfile));

        // 2. Search Posts
        const pQ = query(
          collection(db, 'posts'),
          where('visibility', '==', 'public'),
          where('status', '==', 'active'),
          limit(40)
        );
        const pSnap = await getDocs(pQ);
        const allPosts = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));

        const matchedPosts = allPosts.filter((p) => {
          return (
            p.title.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term) ||
            p.tags?.some((t) => t.toLowerCase().includes(term)) ||
            p.category?.toLowerCase().includes(term) ||
            p.ownerUsername.toLowerCase().includes(term)
          );
        });
        setPostResults(matchedPosts);

        // 3. Extract matching tags
        const matchedTags = new Set<string>();
        allPosts.forEach((p) => {
          p.tags?.forEach((t) => {
            if (t.toLowerCase().includes(term)) {
              matchedTags.add(t.toLowerCase());
            }
          });
        });
        popularTags.forEach((pt) => {
          if (pt.includes(term)) matchedTags.add(pt);
        });
        setTagResults(Array.from(matchedTags).slice(0, 12));

      } catch (err) {
        console.error("Search query error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Search Gowa Mara" />

      <main className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Animated Search Bar with Clear Button */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-purple-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search creators, images, tags, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-11 py-3.5 rounded-2xl glass-input text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-xl transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'users', label: `Users (${userResults.length})` },
            { id: 'posts', label: `Posts (${postResults.length})` },
            { id: 'tags', label: `Tags (${tagResults.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty Search: Show Recent Searches & Trending Tags */}
        {!searchTerm && (
          <div className="space-y-6 pt-2">
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-purple-400 hover:underline text-[11px]"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchTerm(s)}
                      className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all flex items-center gap-1.5"
                    >
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Topics */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
                <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                <span>Trending Tags</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Searching Loader */}
        {isSearching && (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
            <span>Scanning community index...</span>
          </div>
        )}

        {/* Search Results Display */}
        {searchTerm && !isSearching && (
          <div className="space-y-6">
            {/* 1. USERS SECTION */}
            {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Creators & Users ({userResults.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {userResults.map((u) => {
                    const avatar = u.photoUrl || u.avatarUrl;
                    return (
                      <div
                        key={u.uid}
                        onClick={() => navigate(`/profile/${u.username}`)}
                        className="glass-card p-3.5 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-purple-500/40 hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-purple-900 to-slate-800 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs flex-shrink-0">
                            {avatar ? (
                              <img src={avatar} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              (u.displayName?.[0] || u.username[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {u.displayName || u.username}
                            </h4>
                            <p className="text-[11px] text-purple-300 font-mono">@{u.username}</p>
                            {u.bio && (
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">{u.bio}</p>
                            )}
                          </div>
                        </div>

                        <span className="text-xs text-purple-400 font-semibold ml-2">&rarr;</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. TAGS SECTION */}
            {(activeTab === 'all' || activeTab === 'tags') && tagResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <span>Matching Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tagResults.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTagClick(t)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. POSTS SECTION */}
            {(activeTab === 'all' || activeTab === 'posts') && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-pink-400" />
                  <span>Matching Image Posts ({postResults.length})</span>
                </h3>

                {postResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {postResults.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 cursor-pointer shadow-md hover:border-purple-500/40 transition-all"
                      >
                        <img
                          src={post.thumbnailUrl || post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                          <p className="text-xs font-bold text-white truncate">{post.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                            <span>@{post.ownerUsername}</span>
                            <span className="flex items-center gap-1 text-rose-400">
                              <Heart className="w-3 h-3 fill-rose-500" /> {post.likeCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">No image posts matched your search terms.</p>
                )}
              </div>
            )}

            {/* Total Empty State */}
            {userResults.length === 0 && postResults.length === 0 && tagResults.length === 0 && (
              <div className="glass-card rounded-3xl p-10 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white">No results found for "{searchTerm}"</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try searching for different keywords, usernames, or browse trending tags.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
