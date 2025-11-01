'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let firebaseServices: FirebaseServices | null = null;

// This function is designed to work in both production (App Hosting) and local development.
// It ensures Firebase is initialized only once.
export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }
  
  let app: FirebaseApp;
  
  if (getApps().length === 0) {
    // In a production App Hosting environment, the SDK is automatically configured.
    // In this case, `initializeApp()` can be called without arguments.
    try {
      // First, try to initialize without a config. This will work in App Hosting.
      app = initializeApp();
    } catch (e) {
      // If automatic initialization fails (expected in local dev), fall back to local config.
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          'Firebase automatic initialization failed. Falling back to local firebaseConfig. Ensure hosting environment is set up correctly.',
          e
        );
      }
      app = initializeApp(firebaseConfig);
    }
  } else {
    // If an app is already initialized, get it. This prevents re-initialization on hot-reloads.
    app = getApp();
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  firebaseServices = { firebaseApp: app, auth, firestore };
  
  return firebaseServices;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';