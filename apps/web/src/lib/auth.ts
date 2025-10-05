import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/app/init';
import { track, trackError, trackUserAction } from '@/lib/telemetry';
import { canAccessRoute, getCurrentUser } from '@/lib/rbac-tbac';
import { getDevRole } from '@/app/roleBootstrap';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  roles: Record<string, boolean>;
  permissions: Record<string, boolean>;
  teams: string[];
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Auth state management
let authState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

const authListeners: Array<(state: AuthState) => void> = [];

export function subscribeToAuthState(callback: (state: AuthState) => void): () => void {
  authListeners.push(callback);
  
  // Call immediately with current state
  callback(authState);
  
  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

function updateAuthState(updates: Partial<AuthState>): void {
  authState = { ...authState, ...updates };
  authListeners.forEach(callback => callback(authState));
}

async function createUserProfile(firebaseUser: FirebaseUser, additionalData?: Record<string, unknown>): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = firebaseUser;
    
    const createdAt = new Date();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        updatedAt: createdAt,
        roles: {
          viewer: true,
        },
        permissions: {},
        teams: [],
        ...additionalData,
      });
      
      track('user_profile_created', {
        userId: firebaseUser.uid,
        email,
        displayName,
      });
    } catch (error) {
      trackError(error as Error, 'create_user_profile');
      throw error;
    }
  }
}

export async function signInWithEmail(credentials: SignInCredentials): Promise<AuthUser> {
  try {
    const { user } = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    
    trackUserAction('sign_in', 'email');
    
    return await loadUserProfile(user);
  } catch (error) {
    trackError(error as Error, 'sign_in_email');
    throw error;
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const { user } = await signInWithPopup(auth, provider);
    
    await createUserProfile(user);
    
    trackUserAction('sign_in', 'google');
    
    return await loadUserProfile(user);
  } catch (error) {
    trackError(error as Error, 'sign_in_google');
    throw error;
  }
}

export async function signUp(credentials: SignUpCredentials): Promise<AuthUser> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    
    await updateProfile(user, {
      displayName: credentials.displayName,
    });
    
    await createUserProfile(user, {
      displayName: credentials.displayName,
    });
    
    trackUserAction('sign_up', 'email');
    
    return await loadUserProfile(user);
  } catch (error) {
    trackError(error as Error, 'sign_up');
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    await signOut(auth);
    updateAuthState({ user: null, error: null });
    
    trackUserAction('sign_out');
  } catch (error) {
    trackError(error as Error, 'sign_out');
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    trackUserAction('password_reset_requested');
  } catch (error) {
    trackError(error as Error, 'password_reset');
    throw error;
  }
}

export async function updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No authenticated user');
  }
  
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    
    trackUserAction('password_updated');
  } catch (error) {
    trackError(error as Error, 'update_password');
    throw error;
  }
}

async function loadUserProfile(firebaseUser: FirebaseUser): Promise<AuthUser> {
  try {
    // Dev mode override
    if (import.meta.env.VITE_ENV === 'dev') {
      const role = getDevRole() || 'admin';
      const authUser: AuthUser = {
        uid: 'demo-user',
        email: `${role}@demo.local`,
        displayName: `Demo (${role})`,
        photoURL: null,
        emailVerified: true,
        roles: { [role]: true },
        permissions: {},
        teams: ['team-west'],
      };
      
      updateAuthState({ user: authUser, loading: false, error: null });
      return authUser;
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        roles: userData.roles || {},
        permissions: userData.permissions || {},
        teams: userData.teams || [],
      };
      
      updateAuthState({ user: authUser, loading: false, error: null });
      
      return authUser;
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    trackError(error as Error, 'load_user_profile');
    updateAuthState({ user: null, loading: false, error: 'Failed to load user profile' });
    throw error;
  }
}

export function canAccessRoute(routePath: string): boolean {
  const user = getCurrentUser();
  return canAccessRoute(user, routePath);
}

export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.roles[role] === true;
}

export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  return user?.permissions[permission] === true;
}

// Initialize auth state listener
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      await loadUserProfile(firebaseUser);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      updateAuthState({ user: null, loading: false, error: 'Failed to load user profile' });
    }
  } else {
    // In dev mode, still provide a demo user
    if (import.meta.env.VITE_ENV === 'dev') {
      const role = getDevRole() || 'admin';
      const authUser: AuthUser = {
        uid: 'demo-user',
        email: `${role}@demo.local`,
        displayName: `Demo (${role})`,
        photoURL: null,
        emailVerified: true,
        roles: { [role]: true },
        permissions: {},
        teams: ['team-west'],
      };
      updateAuthState({ user: authUser, loading: false, error: null });
    } else {
      updateAuthState({ user: null, loading: false, error: null });
    }
  }
});

// Hook for using auth state in components
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setAuthState);
    return unsubscribe;
  }, []);

  return authState;
}

export { authState };
