import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
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
  Image as ImageIcon, 
  Search, 
  Eye, 
  EyeOff, 
  Trash2, 
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import { ImageViewerModal } from '../../components/common/ImageViewerModal';

export const AdminPostsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'posts'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(list);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleToggleHide = async (post: Post) => {
    if (!currentUser) return;
    const newStatus = post.status === 'hidden' ? 'active' : 'hidden';
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        `post_${newStatus}`,
        'post',
        post.id,
        `Post "${post.title}" status changed to ${newStatus}`
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      console.error("Hide post error:", err);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!currentUser) return;
    if (!window.confirm(`Permanently delete post "${post.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        'post_deleted',
        'post',
        post.id,
        `Post "${post.title}" permanently removed`
      );
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchTerm) return true;
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerUsername.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AdminLayout currentTab="posts">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>Post Moderation & Content Safety</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit public and restricted image posts across the platform.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by post title or publisher username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`glass-card rounded-2xl overflow-hidden border transition-all ${
                post.status === 'hidden'
                  ? 'border-amber-500/30 opacity-70'
                  : 'border-white/10 hover:border-cyan-500/40'
              }`}
            >
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(post.imageUrl)}>
                <img
                  src={post.thumbnailUrl || post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    post.visibility === 'public' ? 'bg-cyan-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    {post.visibility}
                  </span>
                  {post.status === 'hidden' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-900">
                      Hidden
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <div>
                  <h4 className="font-bold text-xs text-white truncate">{post.title}</h4>
                  <p className="text-[10px] text-slate-400">By @{post.ownerUsername}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <button
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHide(post)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.status === 'hidden'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
                      }`}
                      title={post.status === 'hidden' ? 'Restore Post' : 'Hide Post'}
                    >
                      {post.status === 'hidden' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDeletePost(post)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <ImageViewerModal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
        />
      )}
    </AdminLayout>
  );
};
