import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { 
  db, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../../services/firebase';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Download, 
  Share2, 
  MoreVertical, 
  Flag, 
  Trash2, 
  Eye, 
  Lock
} from 'lucide-react';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { ReportModal } from '../common/ReportModal';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { navigate } = useRouter();
  const { currentUser, isAdmin } = useAuth();
  
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(post.likeCount || 0);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showImageViewer, setShowImageViewer] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const isOwner = currentUser?.uid === post.ownerId;
  const canModerate = isOwner || isAdmin;
  const canShare = (post.sharingAllowed && post.visibility === 'public') || isAdmin;
  const isDownloadPermitted = post.downloadAllowed !== false;

  // Listen to like status
  useEffect(() => {
    if (!currentUser) {
      setIsLiked(false);
      return;
    }
    const likeDocId = `${post.id}_${currentUser.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'likes', likeDocId), (docSnap) => {
      setIsLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [post.id, currentUser]);

  // Listen to save / favorite status
  useEffect(() => {
    if (!currentUser) {
      setIsFavorited(false);
      return;
    }
    const favDocId = `${currentUser.uid}_${post.id}`;
    const unsubscribe = onSnapshot(doc(db, 'favorites', favDocId), (docSnap) => {
      setIsFavorited(docSnap.exists());
    });
    return () => unsubscribe();
  }, [post.id, currentUser]);

  const toggleLike = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    const likeDocId = `${post.id}_${currentUser.uid}`;
    const likeRef = doc(db, 'likes', likeDocId);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        const newCount = Math.max(0, likesCount - 1);
        setLikesCount(newCount);
        await updateDoc(postRef, { likeCount: newCount });
      } else {
        await setDoc(likeRef, {
          postId: post.id,
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        await updateDoc(postRef, { likeCount: newCount });
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const favDocId = `${currentUser.uid}_${post.id}`;
    const favRef = doc(db, 'favorites', favDocId);
    try {
      if (isFavorited) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          userId: currentUser.uid,
          postId: post.id,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const handleDownload = async () => {
    if (!isDownloadPermitted) return;
    setIsDownloading(true);
    try {
      const response = await fetch(post.imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanTitle = post.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 35) || 'image';
      link.download = `gowa-mara-${cleanTitle}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Direct link fallback
      window.open(post.imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      onPostDeleted?.(post.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${post.id}`);
    }
  };

  const handleShare = () => {
    if (!canShare) return;
    const shareUrl = `${window.location.origin}/p/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const formattedDate = post.createdAt?.toDate 
    ? post.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Recent';

  return (
    <article className="glass-card rounded-3xl overflow-hidden border border-white/8 shadow-xl transition-all duration-300 hover:border-purple-500/30">
      {/* 1. Author Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${post.ownerUsername}`)}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-tr from-purple-900 to-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs sm:text-sm shadow">
            {post.ownerAvatar ? (
              <img src={post.ownerAvatar} alt={post.ownerUsername} className="w-full h-full object-cover" />
            ) : (
              (post.ownerUsername?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors">
                {post.ownerUsername}
              </span>
              {post.visibility === 'private' && (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400">{formattedDate}</span>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Post options"
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 w-44 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl p-1.5 z-20 backdrop-blur-xl animate-fade-in">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span>Report Post</span>
              </button>

              {canModerate && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Image Content Area */}
      <div 
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer group"
        onClick={() => setShowImageViewer(true)}
      >
        <img
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Floating Category Badge */}
        {post.category && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-purple-200">
            {post.category}
          </div>
        )}

        {/* Tap to expand overlay */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1 text-[11px] font-semibold bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
            <Eye className="w-3 h-3" /> Full View
          </span>
        </div>
      </div>

      {/* 3. Action Bar: ♡ Like   💬 Comment   🔖 Save   ↓ Download */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Like */}
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-90 ${
              isLiked ? 'text-rose-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-rose-500 scale-110' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => navigate(`/post/${post.id}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={toggleFavorite}
            aria-label="Save Post"
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-90 ${
              isFavorited ? 'text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-amber-400 scale-110' : ''}`} />
            <span className="hidden sm:inline">{isFavorited ? 'Saved' : 'Save'}</span>
          </button>

          {/* Download (when permitted) */}
          {isDownloadPermitted && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label="Download Image"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors active:scale-90"
            >
              <Download className={`w-5 h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {/* Share (Only if authorized) */}
          {canShare && (
            <button
              onClick={handleShare}
              title="Copy share link"
              className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-[11px]">{copiedShare ? 'Copied!' : 'Share'}</span>
            </button>
          )}
        </div>

        {/* View Count */}
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> {post.viewCount || 0}
        </span>
      </div>

      {/* 4. Title, Description & Tags */}
      <div className="p-4 pt-2.5 space-y-2">
        <h3 
          onClick={() => navigate(`/post/${post.id}`)}
          className="font-bold text-white text-sm sm:text-base hover:text-purple-300 transition-colors cursor-pointer line-clamp-2"
        >
          {post.title}
        </h3>

        {post.description && (
          <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag, i) => (
              <span 
                key={i} 
                onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                className="text-[10px] font-medium text-purple-300/80 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/15 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageViewerModal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={post.imageUrl}
        title={post.title}
        allowDownload={isDownloadPermitted}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post.id}
        targetType="post"
      />
    </article>
  );
};
