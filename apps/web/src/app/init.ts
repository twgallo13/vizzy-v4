import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

import { track } from '@/lib/telemetry';
import { initializeRBAC } from '@/lib/rbac-tbac';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize function
export function init(): void {
  // Initialize RBAC system
  initializeRBAC();
}
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Initialize Analytics (only in production)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error);
  }
}

// Initialize RBAC system
initializeRBAC();

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    track('auth_state_changed', {
      userId: user.uid,
      email: user.email,
      isNewUser: user.metadata.creationTime === user.metadata.lastSignInTime,
    }, 'ok');
    
    // Log successful authentication
    console.log('User authenticated:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
  } else {
    track('auth_state_changed', {
      userId: null,
    }, 'ok');
    
    // Log user sign out
    console.log('User signed out');
  }
});

// Global error handler for Firebase
auth.onAuthStateChanged(() => {
  // Auth state change handled above
}, (error) => {
  track('auth_error', {
    error: error.message,
    code: error.code,
  }, 'error');
  
  console.error('Auth state change error:', error);
});

// Export analytics for use in components
export { analytics };
