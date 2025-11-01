'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { auth, firestore } from './client'; 
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextState {
  user: User | null;
  isUserLoading: boolean;
  auth: typeof auth;
  firestore: Firestore;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userAuthState, setUserAuthState] = useState<{
    user: User | null;
    isUserLoading: boolean;
  }>({
    user: null,
    isUserLoading: true, 
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false });
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ ...userAuthState, auth, firestore }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useUser() {
    const { user, isUserLoading } = useFirebase();
    return { user, isUserLoading };
}

export function useAuth() {
    const { auth } = useFirebase();
    return auth;
}

export function useFirestore() {
    const { firestore } = useFirebase();
    return firestore;
}
