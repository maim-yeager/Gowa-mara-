import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { ApprovalStatusCard } from '../components/common/ApprovalStatusCard';
import { DeveloperCredit } from '../components/common/DeveloperCredit';
import { AvatarEditorModal } from '../components/profile/AvatarEditorModal';
import { Post } from '../types';
import { db, collection, query, where, onSnapshot } from '../services/firebase';
import { 
  User, 
  Settings, 
  Edit3, 
  Grid, 
  Image as ImageIcon, 
  ShieldCheck, 
  Clock, 
  Bookmark,
  Users,
  Camera,
  Heart,
  Eye,
  Calendar,
  Sparkles
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, profile, logout, updateUserBio } = useAuth();
  const { navigate } = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState<boolean>(false);
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [bioInput, setBioInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'posts'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Post[];
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(items);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (profile) {
      setDisplayNameInput(profile.displayName || profile.username);
      setBioInput(profile.bio || '');
    }
  }, [profile]);

  if (!currentUser || !profile) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader title="Profile" />
        <div className="max-w-md mx-auto p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-purple-400">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Join Gowa Mara</h2>
          <p className="text-xs text-slate-400">
            Sign in or create an account to start sharing and collecting social images.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const handleSaveTextProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserBio(bioInput, displayNameInput);
      setIsEditingBio(false);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSaved = async (newUrl: string) => {
    await updateUserBio(profile.bio || '', profile.displayName, newUrl);
  };

  const statusBadge = {
    approved: { label: 'Verified Creator', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', icon: ShieldCheck },
    pending: { label: 'Pending Approval', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300', icon: Clock },
    suspended: { label: 'Suspended', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: Clock },
    blocked: { label: 'Blocked', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: Clock },
    rejected: { label: 'Rejected', bg: 'bg-slate-500/15 border-slate-500/30 text-slate-300', icon: Clock },
  }[profile.status] || { label: profile.status, bg: 'bg-slate-500/15 text-slate-300', icon: Clock };

  const StatusIcon = statusBadge.icon;
  const userAvatar = profile.photoUrl || profile.avatarUrl;
  const joinDate = profile.createdAt?.toDate 
    ? profile.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Member';

  const totalLikes = posts.reduce((acc, p) => acc + (p.likeCount || 0), 0);
  const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="My Profile" />

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Pending Card if needed */}
        <ApprovalStatusCard />

        {/* Distinctive Glass/Neumorphic Profile Header */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-purple-600/20 via-pink-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Interactive Large Avatar with Studio Trigger */}
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarStudio(true)}>
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-tr from-purple-950 to-slate-900 border-2 border-purple-500/50 shadow-2xl flex items-center justify-center text-purple-200 font-extrabold text-4xl group-hover:border-purple-400 transition-all">
                {userAvatar ? (
                  <img src={userAvatar} alt={profile.username} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  (profile.displayName?.[0] || profile.username[0] || 'U').toUpperCase()
                )}
              </div>

              {/* Camera Badge to Upload Avatar */}
              <button
                type="button"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg border-2 border-[#090d18] transition-transform group-hover:scale-110 active:scale-95"
                title="Change Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Details */}
            <div className="flex-1 text-center sm:text-left space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-xs text-purple-300 font-mono mt-0.5">@{profile.username}</p>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border self-center sm:self-auto ${statusBadge.bg}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusBadge.label}</span>
                </span>
              </div>

              {/* Real Bio with Clean Empty State */}
              {profile.bio ? (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl whitespace-pre-line pt-0.5">
                  {profile.bio}
                </p>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-slate-400">
                  <span>No bio added yet.</span>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-purple-400 font-semibold hover:underline"
                  >
                    Add a short bio
                  </button>
                </div>
              )}

              {/* Join Date */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Joined {joinDate}</span>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 pt-3 text-xs border-t border-white/5">
                <div className="text-center sm:text-left">
                  <span className="block font-extrabold text-white text-base">{posts.length}</span>
                  <span className="text-slate-400 text-[11px]">Posts</span>
                </div>
                <div 
                  className="text-center sm:text-left cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/friends')}
                >
                  <span className="block font-extrabold text-white text-base">{profile.friendCount || 0}</span>
                  <span className="text-slate-400 text-[11px]">Friends</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="block font-extrabold text-white text-base">{totalLikes}</span>
                  <span className="text-slate-400 text-[11px]">Likes</span>
                </div>
                {totalViews > 0 && (
                  <div className="text-center sm:text-left">
                    <span className="block font-extrabold text-white text-base">{totalViews}</span>
                    <span className="text-slate-400 text-[11px]">Views</span>
                  </div>
                )}
              </div>

              {/* Action Buttons & Shortcuts */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3">
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => navigate('/favorites')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1.5 transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Saved Posts</span>
                </button>

                <button
                  onClick={() => navigate('/friends')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Friends</span>
                </button>

                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Bio & Display Name Modal */}
        {isEditingBio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-white">Edit Profile Details</h3>
              <form onSubmit={handleSaveTextProfile} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={500}
                    placeholder="Tell the community about yourself, your camera or passion..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/30"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User's Posts in Responsive Grid (Mobile 2 col, Tablet 3 col, Desktop 3-4 col) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-purple-400" />
              <span>Published Content ({posts.length})</span>
            </h3>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {posts.map((post) => (
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

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-xs font-bold text-white truncate">{post.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3 h-3 fill-rose-500" /> {post.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Eye className="w-3 h-3" /> {post.viewCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-10 text-center space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No posts published yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Once approved, upload your images to share them with the Gowa Mara world.
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all inline-flex items-center gap-1.5"
              >
                <span>Create Image Post</span>
              </button>
            </div>
          )}
        </div>

        {/* Developer Credit Card */}
        <div className="pt-4">
          <DeveloperCredit variant="card" />
        </div>
      </main>

      {/* Avatar Studio Modal */}
      {showAvatarStudio && (
        <AvatarEditorModal
          isOpen={showAvatarStudio}
          onClose={() => setShowAvatarStudio(false)}
          onAvatarSaved={handleAvatarSaved}
        />
      )}
    </div>
  );
};
