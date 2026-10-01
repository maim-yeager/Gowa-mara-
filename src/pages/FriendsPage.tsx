import React, { useEffect, useState } from 'react';
import { FriendRequest, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs, 
  getDoc,
  serverTimestamp 
} from '../services/firebase';
import { Users, UserCheck, UserX, Search, MessageSquare, ExternalLink } from 'lucide-react';

export const FriendsPage: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const { navigate } = useRouter();

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');

  // Listen to received pending friend requests
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FriendRequest[];
      setFriendRequests(reqs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load friends
  useEffect(() => {
    if (!currentUser) return;

    const fQ1 = query(collection(db, 'friends'), where('user1Id', '==', currentUser.uid));
    const fQ2 = query(collection(db, 'friends'), where('user2Id', '==', currentUser.uid));

    const unsub1 = onSnapshot(fQ1, async (snap1) => {
      const user2Ids = snap1.docs.map((d) => d.data().user2Id);
      const snap2 = await getDocs(fQ2);
      const user1Ids = snap2.docs.map((d) => d.data().user1Id);
      const allFriendIds = Array.from(new Set([...user2Ids, ...user1Ids]));

      const friendProfiles: UserProfile[] = [];
      for (const id of allFriendIds) {
        const uDoc = await getDoc(doc(db, 'users', id));
        if (uDoc.exists()) {
          friendProfiles.push(uDoc.data() as UserProfile);
        }
      }
      setFriendsList(friendProfiles);
    });

    return () => unsub1();
  }, [currentUser]);

  const handleAccept = async (req: FriendRequest) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'friends'), {
        user1Id: req.senderId,
        user2Id: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'friendRequests', req.id), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Accept friend error:", err);
    }
  };

  const handleReject = async (req: FriendRequest) => {
    try {
      await updateDoc(doc(db, 'friendRequests', req.id), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Reject friend error:", err);
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff')
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map((d) => d.data() as UserProfile)
        .filter((u) => u.uid !== currentUser?.uid);
      setSearchResults(users);
    } catch (err) {
      console.error("Search users error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Friends & Connections" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'friends' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Friends ({friendsList.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all relative ${
              activeTab === 'requests' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Requests
            {friendRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-[10px] text-white font-bold">
                {friendRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'find' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Find Creators
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friendsList.length > 0 ? (
              friendsList.map((f) => (
                <div
                  key={f.uid}
                  className="glass-card p-3.5 rounded-2xl border border-white/5 flex items-center justify-between transition-all hover:border-purple-500/30"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${f.username}`)}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      {f.photoUrl ? (
                        <img src={f.photoUrl} alt={f.username} className="w-full h-full object-cover" />
                      ) : (
                        (f.username[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white hover:text-purple-300 transition-colors">
                        {f.displayName || f.username}
                      </h4>
                      <p className="text-[11px] text-purple-300/80 font-mono">@{f.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/${f.username}`)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
                      title="View Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card rounded-3xl p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No friends connected yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Find other members on Gowa Mara and send a friend request to grow your circle.
                </p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
                >
                  Find People
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {friendRequests.length > 0 ? (
              friendRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card p-3.5 rounded-2xl border border-white/5 flex items-center justify-between"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${req.senderUsername}`)}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      {req.senderAvatar ? (
                        <img src={req.senderAvatar} alt={req.senderUsername} className="w-full h-full object-cover" />
                      ) : (
                        (req.senderUsername[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">@{req.senderUsername}</h4>
                      <p className="text-[10px] text-slate-400">Sent a friend request</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(req)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1 shadow-md shadow-emerald-600/30"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-white/10"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card rounded-3xl p-10 text-center space-y-2">
                <p className="text-xs text-slate-400">No pending friend requests.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Find Users */}
        {activeTab === 'find' && (
          <div className="space-y-4">
            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
              >
                Search
              </button>
            </form>

            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => navigate(`/profile/${user.username}`)}
                  className="glass-card p-3 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        (user.username[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {user.displayName || user.username}
                      </h4>
                      <p className="text-[11px] text-purple-300 font-mono">@{user.username}</p>
                    </div>
                  </div>

                  <span className="text-xs text-purple-400 font-medium">View &rarr;</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
