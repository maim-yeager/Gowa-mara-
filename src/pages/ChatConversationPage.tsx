import React, { useEffect, useState, useRef } from 'react';
import { Chat, Message } from '../types';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/layout/AppHeader';
import { ImageViewerModal } from '../components/common/ImageViewerModal';
import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { uploadImageToServer } from '../services/uploadService';
import { readFileAsDataUrl } from '../utils/imageProcessor';
import { 
  Send, 
  Image as ImageIcon, 
  ArrowLeft, 
  CheckCheck, 
  CornerDownRight, 
  X, 
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';

export const ChatConversationPage: React.FC = () => {
  const { params, navigate, goBack } = useRouter();
  const { currentUser, profile } = useAuth();
  const chatId = params.chatId;

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [selectedViewerImage, setSelectedViewerImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat document
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
      if (docSnap.exists()) {
        const c = { id: docSnap.id, ...docSnap.data() } as Chat;
        // Verify participant
        if (!c.participantIds.includes(currentUser.uid)) {
          navigate('/chat');
          return;
        }
        setChat(c);

        // Clear my unread count
        if (c.unreadCounts && c.unreadCounts[currentUser.uid] > 0) {
          updateDoc(doc(db, 'chats', chatId), {
            [`unreadCounts.${currentUser.uid}`]: 0
          }).catch(() => {});
        }
      }
    });

    return () => unsub();
  }, [chatId, currentUser]);

  // Load live messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  const otherParticipantId = chat?.participantIds.find((id) => id !== currentUser?.uid);
  const otherUser = otherParticipantId && chat?.participantDetails ? chat.participantDetails[otherParticipantId] : null;

  const handleSelectImage = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewImage(dataUrl);
      setPreviewFile(file);
    } catch (err) {
      console.error("Image read error:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile || !chatId || isSending) return;
    if (!inputText.trim() && !previewImage) return;

    setIsSending(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;

      // If an image attachment was selected, upload securely to backend
      if (previewImage) {
        const uploadRes = await uploadImageToServer(previewImage, `chat_${chatId}_${Date.now()}`);
        if (uploadRes.success && uploadRes.data) {
          uploadedImageUrl = uploadRes.data.url;
        } else {
          // If server reports missing key or failure, fallback or notify
          console.warn("Chat upload notice:", uploadRes.error);
        }
      }

      const msgData = {
        chatId,
        senderId: currentUser.uid,
        senderUsername: profile.username,
        senderAvatar: profile.photoUrl || '',
        text: inputText.trim().slice(0, 2000),
        imageUrl: uploadedImageUrl || (previewImage ? previewImage : null),
        replyTo: replyToMessage ? replyToMessage.text.slice(0, 60) : null,
        status: 'sent',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);

      // Update chat last message
      const lastText = uploadedImageUrl ? '📷 Photo' : inputText.trim().slice(0, 80);
      const updates: any = {
        lastMessage: lastText,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (otherParticipantId) {
        updates[`unreadCounts.${otherParticipantId}`] = (chat?.unreadCounts?.[otherParticipantId] || 0) + 1;
      }
      await updateDoc(doc(db, 'chats', chatId), updates);

      setInputText('');
      setPreviewImage(null);
      setPreviewFile(null);
      setReplyToMessage(null);
    } catch (err: any) {
      console.error("Send message error:", err);
      handleFirestoreError(err, OperationType.CREATE, `chats/${chatId}/messages`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a13] text-slate-100">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 px-4 py-3 glass-panel border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => otherUser?.username && navigate(`/profile/${otherUser.username}`)}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
              {otherUser?.avatar ? (
                <img src={otherUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (otherUser?.username?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                {otherUser?.displayName || otherUser?.username || 'Member'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-medium">● Active in Gowa Mara</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 overflow-y-auto space-y-3 pb-32">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md space-y-1 relative group ${
                  isMe
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-br-xs'
                    : 'glass-card border border-white/10 text-slate-100 rounded-bl-xs'
                }`}
              >
                {/* Reply Snippet */}
                {msg.replyTo && (
                  <div className={`p-1.5 px-2.5 rounded-lg text-[10px] mb-1.5 flex items-center gap-1.5 opacity-90 ${
                    isMe ? 'bg-black/25 text-purple-100' : 'bg-white/10 text-slate-300'
                  }`}>
                    <CornerDownRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate italic">{msg.replyTo}</span>
                  </div>
                )}

                {/* Attached Image */}
                {msg.imageUrl && (
                  <div 
                    className="rounded-xl overflow-hidden cursor-zoom-in my-1 max-h-60 max-w-sm bg-black/40"
                    onClick={() => setSelectedViewerImage(msg.imageUrl || null)}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Message Text */}
                {msg.text && (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Timestamp & Status */}
                <div className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                  isMe ? 'text-purple-200' : 'text-slate-400'
                }`}>
                  <span>
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3 text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Composer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-3 glass-panel border-t border-white/10 backdrop-blur-2xl">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Reply Context Bar */}
          {replyToMessage && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs text-purple-300">
              <span className="truncate">Replying: {replyToMessage.text}</span>
              <button onClick={() => setReplyToMessage(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Attachment Preview */}
          {previewImage && (
            <div className="relative inline-block rounded-xl overflow-hidden border border-purple-500/40 w-20 h-20">
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPreviewImage(null);
                  setPreviewFile(null);
                }}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Composer Row */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Attach Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleSelectImage(e.target.files[0]);
              }}
            />

            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !previewImage)}
              className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>

      {selectedViewerImage && (
        <ImageViewerModal
          isOpen={true}
          onClose={() => setSelectedViewerImage(null)}
          imageUrl={selectedViewerImage}
        />
      )}
    </div>
  );
};
