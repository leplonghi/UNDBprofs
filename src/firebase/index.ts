'use client';
import { useMemo } from 'react';
import { Query, DocumentReference, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Export hooks from the provider
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// A memoized, idempotent function to initialize Firebase services
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

export const initializeFirebase = () => {
  if (!firebaseApp) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
  }
  return { firebaseApp, auth, firestore, storage };
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

/**
 * Non-blocking fire-and-forget Firestore setDoc operation with error handling.
 * @param docRef - The DocumentReference for the document to set.
 * @param data - The data to write to the document.
 * @param options - SetOptions to control the write behavior.
 */
export function setDocumentNonBlocking(
    docRef: DocumentReference,
    data: any,
    options?: { merge?: boolean }
) {
    setDoc(docRef, data, options || {})
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: options?.merge ? 'update' : 'create',
                requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}

/**
 * Non-blocking fire-and-forget Firestore deleteDoc operation with error handling.
 * @param docRef - The DocumentReference for the document to delete.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
    deleteDoc(docRef)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}
