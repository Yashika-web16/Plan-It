import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch or create user profile in Firestore
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        const isAdminEmail = fbUser.email === 'seema.nagdev16@gmail.com';
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Force admin role if email matches, even if stored as 'user'
          if (isAdminEmail && userData.role !== 'admin') {
            const updatedUser = { ...userData, role: 'admin' as const };
            await setDoc(doc(db, 'users', fbUser.uid), updatedUser, { merge: true });
            setUser(updatedUser);
          } else {
            setUser(userData);
          }
        } else {
          const newUser: User = {
            uid: fbUser.uid,
            name: fbUser.displayName || 'Anonymous',
            email: fbUser.email || '',
            role: isAdminEmail ? 'admin' : 'user',
            photoURL: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', fbUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const { loginWithGoogle } = await import('./firebase');
    await loginWithGoogle();
  };

  const logout = async () => {
    const { logout: firebaseLogout } = await import('./firebase');
    await firebaseLogout();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!firebaseUser || !user) return;
    const updatedUser = { ...user, ...data };
    await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser, { merge: true });
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
