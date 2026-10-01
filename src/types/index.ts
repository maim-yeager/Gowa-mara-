export type UserStatus = 'pending' | 'approved' | 'suspended' | 'blocked' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoUrl?: string;
  avatarUrl?: string;
  bio?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: any;
  updatedAt?: any;
  lastActive?: any;
  postCount: number;
  friendCount: number;
  likeCount: number;
  blockedUsers?: string[];
}

export type PostVisibility = 'public' | 'friends' | 'private';
export type PostStatus = 'active' | 'hidden' | 'deleted';

export interface Post {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerAvatar?: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  visibility: PostVisibility;
  sharingAllowed: boolean;
  downloadAllowed?: boolean;
  status: PostStatus;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  parentCommentId?: string;
  likeCount: number;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: any;
  updatedAt?: any;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: any;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  updatedAt?: any;
}

export interface Friend {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  participantIds: string[];
  participantDetails?: {
    [uid: string]: {
      username: string;
      displayName?: string;
      avatar?: string;
    };
  };
  lastMessage?: string;
  lastMessageTimestamp?: any;
  unreadCounts?: { [uid: string]: number };
  createdAt: any;
  updatedAt?: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  text: string;
  imageUrl?: string;
  replyTo?: string;
  status: 'sent' | 'read';
  createdAt: any;
}

export type NotificationType = 
  | 'friend_request' 
  | 'friend_accept' 
  | 'like' 
  | 'comment' 
  | 'message' 
  | 'approval' 
  | 'announcement' 
  | 'status_change';

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  senderUsername?: string;
  senderAvatar?: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: any;
}

export interface Favorite {
  id: string;
  userId: string;
  postId: string;
  createdAt: any;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user' | 'message';
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'urgent';
  active: boolean;
  startTime?: any;
  endTime?: any;
  createdBy: string;
  createdAt: any;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: any;
}

export interface AppSettings {
  registrationEnabled: boolean;
  approvalRequired: boolean;
  maxUploadSizeMb: number;
  allowedFormats: string[];
  sharingEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt?: any;
}
