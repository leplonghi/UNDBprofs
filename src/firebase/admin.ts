import { cert, getApps, initializeApp, App } from 'firebase-admin/app';

// Ensure you have these environment variables set in your Vercel/hosting environment.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  // The private key must be correctly formatted. Replace '\\n' with actual newlines.
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

export function initAdmin() {
  // Return existing app if already initialized.
  if (getApps().length) {
    return;
  }

  // Initialize the Firebase Admin SDK.
  initializeApp({
    credential: cert(serviceAccount),
  });
}
