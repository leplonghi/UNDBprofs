'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function is designed to work in both production (App Hosting) and local development.
export function initializeFirebase() {
  // If no Firebase app has been initialized yet...
  if (!getApps().length) {
    // In a production App Hosting environment, the SDK is automatically configured.
    // In this case, `initializeApp()` can be called without arguments.
    try {
      const app = initializeApp();
      // If successful, return the SDKs for the automatically configured app.
      return getSdks(app);
    } catch (e) {
      // If automatic initialization fails (which is expected in local development),
      // fall back to using the local firebaseConfig object.
      // We only log a warning in production, as this fallback is the norm for local dev.
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          'Firebase automatic initialization failed. Falling back to local firebaseConfig.',
          e
        );
      }
      const app = initializeApp(firebaseConfig);
      return getSdks(app);
    }
  }

  // If an app is already initialized, get it and return its SDKs.
  // This prevents re-initialization on every hot-reload in development.
  const app = getApp();
  return getSdks(app);
}

// Helper function to get the SDKs from a FirebaseApp instance.
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
