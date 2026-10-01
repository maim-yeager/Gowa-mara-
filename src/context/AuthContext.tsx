import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from '../services/firebase';
import { User } from 'firebase/auth';
import { UserProfile, UserStatus, UserRole } from '../types';
import { APP_CONFIG } from '../config/appConfig';

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isApproved: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, username: string, displayName: string) => Promise<void>;
  adminQuickLogin: (pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserBio: (bio: string, displayName?: string, photoUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!user) {
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user is configured as admin
      const isConfiguredAdmin = user.email?.toLowerCase().trim() === APP_CONFIG.adminEmail.toLowerCase().trim();
      if (isConfiguredAdmin) {
        setIsAdmin(true);
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to live user profile changes
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            
            // Check admin status from doc role, admin registry, or configured admin
            if (data.role === 'admin' || isConfiguredAdmin) {
              setIsAdmin(true);
              // Ensure database role and status are in sync for configured admin
              if (isConfiguredAdmin && (data.role !== 'admin' || data.status !== 'approved')) {
                await updateDoc(userDocRef, {
                  role: 'admin',
                  status: 'approved',
                  updatedAt: serverTimestamp()
                }).catch(() => {});
              }
              // Ensure doc in /admins collection exists
              await setDoc(doc(db, 'admins', user.uid), {
                email: user.email,
                role: 'superadmin',
                addedAt: serverTimestamp()
              }, { merge: true }).catch(() => {});
            } else {
              // Check admin doc
              try {
                const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                setIsAdmin(adminDoc.exists());
              } catch {
                setIsAdmin(false);
              }
            }
            setIsLoading(false);
          } else {
            // First time login - initialize user profile
            const cleanUsername = (user.displayName || user.email?.split('@')[0] || 'user')
              .toLowerCase()
              .replace(/[^a-z0-9_.-]/g, '')
              .slice(0, 30) || (isConfiguredAdmin ? 'maim' : 'user_' + user.uid.slice(0, 6));

            const initialProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              username: cleanUsername,
              displayName: user.displayName || (isConfiguredAdmin ? 'Maim' : cleanUsername),
              photoUrl: user.photoURL || '',
              bio: isConfiguredAdmin ? APP_CONFIG.developerBio : '',
              status: isConfiguredAdmin ? 'approved' : 'pending',
              role: isConfiguredAdmin ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              lastActive: serverTimestamp(),
              postCount: 0,
              friendCount: 0,
              likeCount: 0,
              blockedUsers: []
            };

            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
            if (isConfiguredAdmin) {
              setIsAdmin(true);
              // Register in admins collection
              await setDoc(doc(db, 'admins', user.uid), {
                email: user.email,
                role: 'superadmin',
                addedAt: serverTimestamp()
              });
            }
            setIsLoading(false);
          }
        }, (error) => {
          console.warn("Firestore profile snapshot warning:", error);
          if (isConfiguredAdmin) {
            setIsAdmin(true);
          }
          setIsLoading(false);
        });

      } catch (err) {
        console.error("Auth profile initialization error:", err);
        if (isConfiguredAdmin) {
          setIsAdmin(true);
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, username: string, displayName: string) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const isConfiguredAdmin = email.toLowerCase() === APP_CONFIG.adminEmail.toLowerCase();
      
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: email,
        username: username.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 50),
        displayName: displayName || username,
        photoUrl: '',
        bio: '',
        status: isConfiguredAdmin ? 'approved' : 'pending',
        role: isConfiguredAdmin ? 'admin' : 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        postCount: 0,
        friendCount: 0,
        likeCount: 0,
        blockedUsers: []
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      if (isConfiguredAdmin) {
        await setDoc(doc(db, 'admins', cred.user.uid), {
          email: email,
          role: 'superadmin',
          addedAt: serverTimestamp()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const adminQuickLogin = async (pass: string) => {
    if (!pass || pass.length < 6) {
      throw new Error('Please enter a password with at least 6 characters.');
    }
    setIsLoading(true);
    const adminEmail = APP_CONFIG.adminEmail;

    try {
      // First attempt to sign in with existing credentials
      await signInWithEmailAndPassword(auth, adminEmail, pass);
    } catch (err: any) {
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      // If user does not exist yet or credentials not recognized, attempt initial account creation
      if (
        errCode === 'auth/user-not-found' || 
        errCode === 'auth/invalid-credential' || 
        errMsg.includes('user-not-found') || 
        errMsg.includes('invalid-credential')
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, adminEmail, pass);
          const initialAdminProfile: UserProfile = {
            uid: cred.user.uid,
            email: adminEmail,
            username: 'maim',
            displayName: 'Maim',
            photoUrl: APP_CONFIG.adminPicUrl,
            bio: APP_CONFIG.developerBio,
            status: 'approved',
            role: 'admin',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            postCount: 0,
            friendCount: 0,
            likeCount: 0,
            blockedUsers: []
          };

          await setDoc(doc(db, 'users', cred.user.uid), initialAdminProfile);
          await setDoc(doc(db, 'admins', cred.user.uid), {
            email: adminEmail,
            role: 'superadmin',
            addedAt: serverTimestamp()
          });
          setProfile(initialAdminProfile);
          setIsAdmin(true);
          return;
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            throw new Error('Incorrect password for admin account (' + adminEmail + '). Please enter the password you registered with, or click Reset Password.');
          }
          throw createErr;
        }
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserBio = async (bio: string, displayName?: string, photoUrl?: string) => {
    if (!currentUser) return;
    const updates: any = {
      bio: bio.slice(0, 500),
      updatedAt: serverTimestamp()
    };
    if (displayName) updates.displayName = displayName.slice(0, 100);
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;

    await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
  };

  const isUserAdmin = Boolean(
    (currentUser?.email && currentUser.email.toLowerCase().trim() === APP_CONFIG.adminEmail.toLowerCase().trim()) ||
    profile?.role === 'admin' ||
    isAdmin
  );

  const isUserApproved = Boolean(
    isUserAdmin ||
    profile?.status === 'approved'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAdmin: isUserAdmin,
        isApproved: isUserApproved,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        adminQuickLogin,
        logout,
        resetPassword,
        updateUserBio
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
