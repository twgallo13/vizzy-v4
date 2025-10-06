import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const env = (import.meta as any).env || {};
const useMocks = String(env.VITE_USE_MOCKS || '1').toLowerCase();
const isMock = useMocks === '1' || useMocks === 'true';

export const isUsingMocks = () => isMock;

export function createFirebase() {
  if (isMock) return null;

  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  } as const;

  const existing = getApps()[0] as FirebaseApp | undefined;
  const app: FirebaseApp = existing ?? initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  const useEmu = String(env.VITE_USE_EMULATORS || '0') === '1';
  if (useEmu) {
    const ah = env.VITE_AUTH_EMULATOR_HOST || '127.0.0.1';
    const ap = Number(env.VITE_AUTH_EMULATOR_PORT || 9099);
    const fh = env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
    const fp = Number(env.VITE_FIRESTORE_EMULATOR_PORT || 8080);
    try { connectAuthEmulator(auth, `http://${ah}:${ap}`); } catch {}
    try { connectFirestoreEmulator(db, fh, fp); } catch {}
  }

  return { app, auth, db, functions, GoogleAuthProvider } as const;
}
