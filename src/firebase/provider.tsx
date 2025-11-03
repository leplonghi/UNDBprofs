'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';

interface FirebaseContextState {
  user: User | null;
  isUserLoading: boolean;
  auth: Auth;
  firestore: Firestore;
  app: FirebaseApp;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
    children: ReactNode;
    auth: Auth;
    firestore: Firestore;
    app: FirebaseApp;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  auth,
  firestore,
  app
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
  }, [auth]);

  return (
    <FirebaseContext.Provider value={{ ...userAuthState, auth, firestore, app }}>
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
