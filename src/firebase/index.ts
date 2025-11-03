'use client';
import { useMemo } from 'react';
import type { Query, DocumentReference } from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Export hooks from the provider
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// A memoized, idempotent function to initialize Firebase services
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export const initializeFirebase = () => {
  if (!firebaseApp) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
};


/**
 * A wrapper around useMemo that provides a stable reference to a Firestore query or document.
 * This is crucial for preventing infinite loops in `useCollection` and `useDoc` hooks.
 * @param factory A function that returns a Firestore query or document reference.
 * @param deps The dependency array for the useMemo hook.
 * @returns A memoized Firestore query or document reference.
 */
export function useMemoFirebase<T extends Query | DocumentReference>(
  factory: () => T | null | undefined,
  deps: React.DependencyList
): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRef = useMemo(factory, deps);
  if (memoizedRef) {
    (memoizedRef as any).__memo = true;
  }
  return memoizedRef as T | null;
}
