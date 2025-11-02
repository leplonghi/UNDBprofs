import { getApps, initializeApp, App, applicationDefault, cert } from 'firebase-admin/app';

export function initAdmin() {
  if (getApps().length > 0) {
    return;
  }

  const hasServiceAccount =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;

  if (hasServiceAccount) {
    // Running in an environment with service account credentials
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback for environments like App Hosting or Cloud Run
    initializeApp({
      credential: applicationDefault(),
    });
  }
}
