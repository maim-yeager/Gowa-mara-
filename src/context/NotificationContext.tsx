import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  handleFirestoreError,
  OperationType 
} from '../services/firebase';
import { useAuth } from './AuthContext';
import { AppNotification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (
    recipientId: string, 
    type: NotificationType, 
    title: string, 
    body: string, 
    link?: string
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];
        // Sort in memory by createdAt descending
        items.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const item of unread) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { read: true });
      } catch (err) {
        console.error("Mark all as read error:", err);
      }
    }
  };

  const sendNotification = async (
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string,
    link: string = '/notifications'
  ) => {
    if (!currentUser || recipientId === currentUser.uid) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        senderId: currentUser.uid,
        senderUsername: profile?.username || 'User',
        senderAvatar: profile?.photoUrl || '',
        type,
        title,
        body,
        link,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Notification send ignored or restricted:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
