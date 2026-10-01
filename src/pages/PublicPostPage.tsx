import React, { useEffect, useState } from 'react';
import { Post } from '../types';
import { useRouter } from '../context/RouterContext';
import { db, doc, getDoc } from '../services/firebase';
import { BrandLogo } from '../components/common/BrandLogo';
import { DeveloperCredit } from '../components/common/DeveloperCredit';
import { ImageViewerModal } from '../components/common/ImageViewerModal';
import { Heart, MessageCircle, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';

export const PublicPostPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const postId = params.postId;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [showViewer, setShowViewer] = useState<boolean>(false);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);

    getDoc(doc(db, 'posts', postId)).then((docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Post;
        // Verify public access invariant
        if (data.visibility === 'public' && data.sharingAllowed && data.status === 'active') {
          setPost(data);
          setAccessDenied(false);
        } else {
          setPost(null);
          setAccessDenied(true);
        }
      } else {
        setPost(null);
        setAccessDenied(true);
      }
      setIsLoading(false);
    }).catch(() => {
      setAccessDenied(true);
      setIsLoading(false);
    });
  }, [postId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070a13] text-white">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (accessDenied || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#070a13] text-white text-center">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Public Sharing Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This image post is either private or external public URL sharing has not been enabled by the publisher.
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-purple-600 hover:bg-purple-500"
          >
            Explore Gowa Mara Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-6 py-4 glass-panel border-b border-white/5 flex items-center justify-between">
        <BrandLogo size="sm" onClick={() => navigate('/home')} />
        <button
          onClick={() => navigate(`/post/${post.id}`)}
          className="text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-4 py-1.5 rounded-full transition-all"
        >
          Open in Community
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                {post.ownerAvatar ? (
                  <img src={post.ownerAvatar} alt={post.ownerUsername} className="w-full h-full object-cover" />
                ) : (
                  (post.ownerUsername?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div>
                <span className="font-bold text-sm text-white">@{post.ownerUsername}</span>
                <p className="text-[11px] text-slate-400">
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Verified Public
            </span>
          </div>

          {/* Image */}
          <div 
            className="w-full bg-slate-950 flex items-center justify-center cursor-zoom-in"
            onClick={() => setShowViewer(true)}
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="max-h-[75vh] w-full object-contain"
            />
          </div>

          {/* Details */}
          <div className="p-5 space-y-2">
            <h1 className="text-xl font-bold text-white">{post.title}</h1>
            {post.description && (
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            )}
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-500" /> {post.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" /> {post.commentCount || 0}
              </span>
            </div>
          </div>
        </div>
      </main>

      <DeveloperCredit variant="footer" />

      {showViewer && (
        <ImageViewerModal
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          imageUrl={post.imageUrl}
          title={post.title}
          allowDownload
        />
      )}
    </div>
  );
};
