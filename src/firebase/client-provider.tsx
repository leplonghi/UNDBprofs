'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This component now has a single responsibility: initializing Firebase
// on the client-side and passing the services to the provider.
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The useMemo hook ensures that initializeFirebase() is called only once
  // per component lifecycle, returning the singleton instance of Firebase services.
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
