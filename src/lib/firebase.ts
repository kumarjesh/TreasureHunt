import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && 
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'YOUR_PROJECT_ID'
  );
};

let appInstance = null;
let authInstance = null;
let firestoreInstance = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    console.log('[HACKSPRINT] Firebase connected successfully to project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[HACKSPRINT] Firebase init error, falling back to local reactive engine:', err);
  }
} else {
  console.log('[HACKSPRINT] Running in local reactive state mode (Set VITE_FIREBASE_* in .env to connect Cloud Firestore)');
}

export { appInstance as app, authInstance as auth, firestoreInstance as db };
