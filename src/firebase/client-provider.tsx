'use client';

import React from 'react';
import { FirebaseProvider } from './provider';

// This component ensures that the Firebase provider and its context
// are only used on the client-side, preventing errors during server-side rendering.
export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <FirebaseProvider>{children}</FirebaseProvider>;
};
