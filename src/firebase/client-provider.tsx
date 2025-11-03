'use client';

import React from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

// This component ensures that Firebase is initialized once on the client
// and provides the initialized instances to the FirebaseProvider.
export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Initialize Firebase and get the instances.
  // This function is idempotent, so it's safe to call on every render.
  const { firebaseApp, auth, firestore, storage } = initializeFirebase();

  return (
    <FirebaseProvider app={firebaseApp} auth={auth} firestore={firestore} storage={storage}>
      {children}
    </FirebaseProvider>
  );
};
