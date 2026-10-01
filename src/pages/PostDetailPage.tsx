import React, { useEffect, useState } from 'react';
import { Post, Comment } from '../types';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AppHeader } from '../components/layout/AppHeader';
import { ImageViewerModal } from '../components/common/ImageViewerModal';
import { ReportModal } from '../components/common/ReportModal';
import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Download,
  Share2, 
  Send, 
  Trash2, 
  CornerDownRight, 
  Lock, 
  Eye, 
  Flag,
  AlertCircle
} from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const { currentUser, profile, isAdmin } = useAuth();
  const { sendNotification } = useNotifications();
  const postId = params.postId;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [showImageViewer, setShowImageViewer] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch post document
  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);

    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Post;
        
        // Authorization check for private posts
        if (data.visibility === 'private' && data.ownerId !== currentUser?.uid && !isAdmin) {
          setErrorMsg('This post is private and cannot be viewed.');
          setPost(null);
        } else {
          setPost(data);
          setLikesCount(data.likeCount || 0);
          setErrorMsg(null);
        }
      } else {
        setErrorMsg('Post not found or deleted.');
        setPost(null);
      }
      setIsLoading(false);
    }, (err) => {
      console.warn("Post detail error:", err);
      setErrorMsg('Failed to load post.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId, currentUser, isAdmin]);

  // Listen to comments
  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Comment[];
      // Sort oldest to newest for chronological conversation
      items.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tA - tB;
      });
      setComments(items);
    });

    return () => unsubscribe();
  }, [postId]);

  // Check if liked
  useEffect(() => {
    if (!postId || !currentUser) return;
    const likeDocId = `${postId}_${currentUser.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'likes', likeDocId), (docSnap) => {
      setIsLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [postId, currentUser]);

  // Check if favorited
  useEffect(() => {
    if (!postId || !currentUser) return;
    const favDocId = `${currentUser.uid}_${postId}`;
    const unsubscribe = onSnapshot(doc(db, 'favorites', favDocId), (docSnap) => {
      setIsFavorited(docSnap.exists());
    });
    return () => unsubscribe();
  }, [postId, currentUser]);

  // Increment view count once
  useEffect(() => {
    if (!postId) return;
    const viewedKey = `viewed_${postId}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, 'true');
      updateDoc(doc(db, 'posts', postId), {
        viewCount: increment(1)
      }).catch(() => {});
    }
  }, [postId]);

  const toggleLike = async () => {
    if (!currentUser || !post) {
      navigate('/login');
      return;
    }
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
        await updateDoc(likeRef, {
          postId: post.id,
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        }).catch(async () => {
          // If doc doesn't exist, create it via setDoc
          const { setDoc } = await import('../services/firebase');
          await setDoc(likeRef, {
            postId: post.id,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
          });
        });
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        await updateDoc(postRef, { likeCount: newCount });

        // Notify post owner
        if (post.ownerId !== currentUser.uid) {
          await sendNotification(
            post.ownerId,
            'like',
            'New Post Like',
            `@${profile?.username || 'Someone'} liked your post "${post.title}"`,
            `/post/${post.id}`
          );
        }
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser || !post) {
      navigate('/login');
      return;
    }
    const favDocId = `${currentUser.uid}_${post.id}`;
    const favRef = doc(db, 'favorites', favDocId);
    try {
      if (isFavorited) {
        await deleteDoc(favRef);
      } else {
        const { setDoc } = await import('../services/firebase');
        await setDoc(favRef, {
          userId: currentUser.uid,
          postId: post.id,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile || !post) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) return;

    try {
      const newComment = {
        postId: post.id,
        authorId: currentUser.uid,
        authorUsername: profile.username,
        authorAvatar: profile.photoUrl || '',
        content: commentText.trim().slice(0, 1000),
        parentCommentId: replyingTo ? replyingTo.id : null,
        likeCount: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'comments'), newComment);
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });

      // Send notification to author
      if (post.ownerId !== currentUser.uid) {
        await sendNotification(
          post.ownerId,
          'comment',
          'New Comment',
          `@${profile.username} commented on your post "${post.title}"`,
          `/post/${post.id}`
        );
      }

      setCommentText('');
      setReplyingTo(null);
    } catch (err: any) {
      console.error("Comment submit error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      if (post) {
        await updateDoc(doc(db, 'posts', post.id), {
          commentCount: increment(-1)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const canShare = (post?.sharingAllowed && post?.visibility === 'public') || isAdmin;
  const isDownloadPermitted = post?.downloadAllowed !== false;

  const handleDownload = async () => {
    if (!post || !isDownloadPermitted) return;
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
      window.open(post.imageUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (!canShare || !post) return;
    const shareUrl = `${window.location.origin}/p/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader showBack />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="w-full h-80 rounded-3xl bg-slate-800 animate-pulse" />
          <div className="w-1/2 h-6 rounded bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMsg || !post) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader showBack title="Post Unavailable" />
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Post Not Accessible</h2>
          <p className="text-xs text-slate-400">{errorMsg || 'This post cannot be viewed.'}</p>
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2 rounded-full text-xs font-bold text-white bg-purple-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader showBack title={post.title} />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Main Post Card */}
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl space-y-4">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate(`/profile/${post.ownerUsername}`)}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                {post.ownerAvatar ? (
                  <img src={post.ownerAvatar} alt={post.ownerUsername} className="w-full h-full object-cover" />
                ) : (
                  (post.ownerUsername?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div>
                <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                  {post.ownerUsername}
                </span>
                <p className="text-[11px] text-slate-400">
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-full hover:bg-white/5 transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Image */}
          <div 
            className="w-full bg-slate-950 flex items-center justify-center cursor-zoom-in"
            onClick={() => setShowImageViewer(true)}
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>

          {/* Action Row */}
          <div className="px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  isLiked ? 'text-rose-500' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </div>

              {isDownloadPermitted && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-cyan-400"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}

              {canShare && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-cyan-400"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedShare ? 'Copied' : 'Share'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {post.viewCount || 0} views
              </span>
              <button
                onClick={toggleFavorite}
                className={`p-1.5 rounded-full ${isFavorited ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="px-5 pb-5 space-y-3">
            <h1 className="text-xl font-bold text-white">{post.title}</h1>
            {post.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {post.description}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    className="text-[11px] font-medium text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-5">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <span>Comments ({comments.length})</span>
          </h3>

          {/* New Comment Input */}
          {currentUser ? (
            <form onSubmit={handlePostComment} className="space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between text-[11px] bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/20">
                  <span>Replying to @{replyingTo.authorUsername}</span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={replyingTo ? `Write a reply...` : `Leave a comment...`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                  className="flex-1 px-4 py-2.5 rounded-2xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 text-center rounded-2xl bg-white/5 text-xs text-slate-400">
              <span 
                onClick={() => navigate('/login')} 
                className="text-purple-400 font-bold cursor-pointer hover:underline"
              >
                Sign in
              </span>{' '}
              to leave a comment.
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-4 pt-2">
            {topLevelComments.length > 0 ? (
              topLevelComments.map((comment) => {
                const replies = comments.filter((c) => c.parentCommentId === comment.id);
                const isAuthor = currentUser?.uid === comment.authorId;
                const canDelete = isAuthor || isAdmin;

                return (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                        {comment.authorAvatar ? (
                          <img src={comment.authorAvatar} alt={comment.authorUsername} className="w-full h-full object-cover" />
                        ) : (
                          (comment.authorUsername?.[0] || 'U').toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            @{comment.authorUsername}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          {currentUser && (
                            <button
                              onClick={() => setReplyingTo(comment)}
                              className="hover:text-purple-300 font-semibold"
                            >
                              Reply
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-rose-400/80 hover:text-rose-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="pl-6 space-y-2 border-l border-purple-500/20 ml-4">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/10">
                            <CornerDownRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-1" />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-purple-300">
                                  @{reply.authorUsername}
                                </span>
                                {(currentUser?.uid === reply.authorId || isAdmin) && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-[10px] text-rose-400 hover:text-rose-300"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-300">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No comments yet. Start the conversation!
              </p>
            )}
          </div>
        </div>
      </main>

      <ImageViewerModal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageUrl={post.imageUrl}
        title={post.title}
        allowDownload={canShare}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post.id}
        targetType="post"
      />
    </div>
  );
};
