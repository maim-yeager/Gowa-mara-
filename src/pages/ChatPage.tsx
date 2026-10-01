import React, { useEffect, useState } from 'react';
import { Chat } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../services/firebase';
import { MessageSquare, Search, PlusCircle, Clock } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const { navigate } = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];
      
      // Sort by lastMessageTimestamp descending
      items.sort((a, b) => {
        const tA = a.lastMessageTimestamp?.seconds || a.createdAt?.seconds || 0;
        const tB = b.lastMessageTimestamp?.seconds || b.createdAt?.seconds || 0;
        return tB - tA;
      });

      setChats(items);
      setIsLoading(false);
    }, (err) => {
      console.warn("Chats error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen pb-20">
        <AppHeader title="Direct Messages" />
        <div className="max-w-md mx-auto p-12 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Sign In to Chat</h2>
          <p className="text-xs text-slate-400">Connect and chat in real-time with creators and friends.</p>
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

  const filteredChats = chats.filter((c) => {
    if (!searchTerm) return true;
    const otherId = c.participantIds.find((id) => id !== currentUser.uid);
    const otherUser = otherId && c.participantDetails ? c.participantDetails[otherId] : null;
    return otherUser?.username?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Conversations" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Search Chats */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Chat List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 rounded-2xl h-18 bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-2">
            {filteredChats.map((chat) => {
              const otherId = chat.participantIds.find((id) => id !== currentUser.uid);
              const otherUser = otherId && chat.participantDetails ? chat.participantDetails[otherId] : null;
              const unread = (chat.unreadCounts && chat.unreadCounts[currentUser.uid]) || 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="glass-card p-3.5 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-purple-500/30 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                      {otherUser?.avatar ? (
                        <img src={otherUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (otherUser?.username?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {otherUser?.displayName || otherUser?.username || 'Member'}
                        </h4>
                        <span className="text-[10px] text-purple-300 font-mono">
                          @{otherUser?.username}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                        {chat.lastMessage || 'Sent an attachment or new message'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-500">
                      {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-600 text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No active conversations</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Visit any user's profile and tap "Message" to start a direct private conversation.
            </p>
            <button
              onClick={() => navigate('/friends')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
            >
              Browse Friends
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
