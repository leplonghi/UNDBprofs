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
// It ensures Firebase is initialized only once (singleton pattern).
export function initializeFirebase(): FirebaseServices {
  // If services are already initialized, return them immediately.
  if (firebaseServices) {
    return firebaseServices;
  }
  
  let app: FirebaseApp;
  
  // Check if any Firebase app has been initialized.
  if (getApps().length === 0) {
    // In a production App Hosting environment, the SDK is automatically configured
    // by environment variables, and `initializeApp()` can be called without arguments.
    // In local development, this will fail, and we'll use the local config.
    try {
      // First, try to initialize without a config. This is for App Hosting.
      app = initializeApp();
    } catch (e) {
      // If automatic initialization fails, fall back to the local config from `firebase/config.ts`.
      // This is expected in local development.
      app = initializeApp(firebaseConfig);
    }
  } else {
    // If an app is already initialized (e.g., due to hot-reloading), get the existing app.
    app = getApp();
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Store the initialized services in the singleton variable.
  firebaseServices = { firebaseApp: app, auth, firestore };
  
  return firebaseServices;
}

// Re-export other necessary modules from the firebase directory.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';