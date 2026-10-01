import React, { useEffect, useState } from 'react';
import { UserProfile, Post } from '../types';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AppHeader } from '../components/layout/AppHeader';
import { PostCard } from '../components/post/PostCard';
import { ReportModal } from '../components/common/ReportModal';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { 
  UserPlus, 
  UserCheck, 
  Clock, 
  MessageSquare, 
  Flag, 
  ShieldBan, 
  Grid, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export const PublicProfilePage: React.FC = () => {
  const { params, navigate } = useRouter();
  const { currentUser, profile: myProfile } = useAuth();
  const { sendNotification } = useNotifications();
  const username = params.username;

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'requested' | 'pending' | 'friends' | 'blocked'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // If viewing self, redirect to /profile
  useEffect(() => {
    if (myProfile && username && myProfile.username.toLowerCase() === username.toLowerCase()) {
      navigate('/profile', { replace: true });
    }
  }, [username, myProfile, navigate]);

  // Load user by username
  useEffect(() => {
    if (!username) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'users'),
      where('username', '==', username.toLowerCase())
    );

    getDocs(q).then((snap) => {
      if (!snap.empty) {
        const u = snap.docs[0].data() as UserProfile;
        setTargetUser(u);

        // Load public posts
        const postQ = query(
          collection(db, 'posts'),
          where('ownerId', '==', u.uid),
          where('visibility', '==', 'public'),
          where('status', '==', 'active')
        );

        onSnapshot(postQ, (postSnap) => {
          const posts = postSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
          setUserPosts(posts);
        });

      } else {
        setTargetUser(null);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.warn("Public profile error:", err);
      setIsLoading(false);
    });
  }, [username]);

  // Check friendship status
  useEffect(() => {
    if (!currentUser || !targetUser) return;

    // 1. Check if blocked
    if (myProfile?.blockedUsers?.includes(targetUser.uid)) {
      setFriendshipStatus('blocked');
      return;
    }

    // 2. Check established friends
    const fQ1 = query(
      collection(db, 'friends'),
      where('user1Id', '==', currentUser.uid),
      where('user2Id', '==', targetUser.uid)
    );
    const fQ2 = query(
      collection(db, 'friends'),
      where('user1Id', '==', targetUser.uid),
      where('user2Id', '==', currentUser.uid)
    );

    const checkFriends = async () => {
      const [s1, s2] = await Promise.all([getDocs(fQ1), getDocs(fQ2)]);
      if (!s1.empty) {
        setFriendshipStatus('friends');
        setFriendshipId(s1.docs[0].id);
        return;
      }
      if (!s2.empty) {
        setFriendshipStatus('friends');
        setFriendshipId(s2.docs[0].id);
        return;
      }

      // 3. Check pending friend requests
      const rQ1 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', currentUser.uid),
        where('receiverId', '==', targetUser.uid),
        where('status', '==', 'pending')
      );
      const rQ2 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', targetUser.uid),
        where('receiverId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const [r1, r2] = await Promise.all([getDocs(rQ1), getDocs(rQ2)]);
      if (!r1.empty) {
        setFriendshipStatus('requested'); // I requested them
        setRequestId(r1.docs[0].id);
        return;
      }
      if (!r2.empty) {
        setFriendshipStatus('pending'); // They requested me
        setRequestId(r2.docs[0].id);
        return;
      }

      setFriendshipStatus('none');
    };

    checkFriends();
  }, [currentUser, targetUser, myProfile]);

  const handleSendFriendRequest = async () => {
    if (!currentUser || !myProfile || !targetUser) {
      navigate('/login');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'friendRequests'), {
        senderId: currentUser.uid,
        senderUsername: myProfile.username,
        senderAvatar: myProfile.photoUrl || '',
        receiverId: targetUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setRequestId(docRef.id);
      setFriendshipStatus('requested');

      await sendNotification(
        targetUser.uid,
        'friend_request',
        'Friend Request',
        `@${myProfile.username} sent you a friend request`,
        `/friends`
      );
    } catch (err: any) {
      console.error("Friend request error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'friendRequests');
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId || !currentUser || !targetUser) return;
    try {
      // 1. Create friend record
      const fRef = await addDoc(collection(db, 'friends'), {
        user1Id: currentUser.uid,
        user2Id: targetUser.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Update request status to accepted
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      setFriendshipId(fRef.id);
      setFriendshipStatus('friends');

      await sendNotification(
        targetUser.uid,
        'friend_accept',
        'Friend Request Accepted',
        `@${myProfile?.username || 'User'} accepted your friend request!`,
        `/profile/${myProfile?.username}`
      );
    } catch (err) {
      console.error("Accept request error:", err);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser || !myProfile || !targetUser) {
      navigate('/login');
      return;
    }

    try {
      // Find existing chat or create new
      const q = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find((d) => {
        const data = d.data();
        return data.participantIds?.includes(targetUser.uid);
      });

      if (existing) {
        navigate(`/chat/${existing.id}`);
      } else {
        const newChat = await addDoc(collection(db, 'chats'), {
          participantIds: [currentUser.uid, targetUser.uid],
          participantDetails: {
            [currentUser.uid]: {
              username: myProfile.username,
              displayName: myProfile.displayName,
              avatar: myProfile.photoUrl || '',
            },
            [targetUser.uid]: {
              username: targetUser.username,
              displayName: targetUser.displayName,
              avatar: targetUser.photoUrl || '',
            },
          },
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          unreadCounts: { [currentUser.uid]: 0, [targetUser.uid]: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        navigate(`/chat/${newChat.id}`);
      }
    } catch (err) {
      console.error("Start chat error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader showBack />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="w-full h-48 rounded-3xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader showBack title="User Not Found" />
        <div className="max-w-md mx-auto p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">User does not exist</h2>
          <p className="text-xs text-slate-400">The requested profile @{username} was not found.</p>
          <button
            onClick={() => navigate('/home')}
            className="px-5 py-2 rounded-full text-xs font-bold text-white bg-purple-600"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader showBack title={`@${targetUser.username}`} />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-3xl flex-shrink-0">
              {targetUser.photoUrl ? (
                <img src={targetUser.photoUrl} alt={targetUser.username} className="w-full h-full object-cover" />
              ) : (
                (targetUser.username[0] || 'U').toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {targetUser.displayName || targetUser.username}
                  </h1>
                  <p className="text-xs text-purple-300 font-mono">@{targetUser.username}</p>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-full hover:bg-white/5 transition-colors"
                    title="Report User"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {targetUser.bio && (
                <p className="text-xs text-slate-300 leading-relaxed max-w-md pt-1 whitespace-pre-line">
                  {targetUser.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 text-xs">
                <div>
                  <span className="block font-bold text-white text-sm">{userPosts.length}</span>
                  <span className="text-slate-400 text-[11px]">Posts</span>
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">{targetUser.friendCount || 0}</span>
                  <span className="text-slate-400 text-[11px]">Friends</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3">
                {friendshipStatus === 'none' && (
                  <button
                    onClick={handleSendFriendRequest}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                )}

                {friendshipStatus === 'requested' && (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/10 flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Request Sent</span>
                  </button>
                )}

                {friendshipStatus === 'pending' && (
                  <button
                    onClick={handleAcceptRequest}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-md"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>
                )}

                {friendshipStatus === 'friends' && (
                  <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>Friends</span>
                  </span>
                )}

                {/* Message Button */}
                <button
                  onClick={handleStartChat}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 flex items-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Public Posts */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-2">
            <Grid className="w-4 h-4 text-purple-400" />
            <span>Public Posts ({userPosts.length})</span>
          </h3>

          {userPosts.length > 0 ? (
            <div className="space-y-5">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-8 text-center space-y-2">
              <p className="text-xs text-slate-400">No public posts from this user yet.</p>
            </div>
          )}
        </div>
      </main>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={targetUser.uid}
        targetType="user"
      />
    </div>
  );
};
