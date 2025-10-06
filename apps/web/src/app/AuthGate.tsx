import React, { useEffect, useState } from 'react';
import { isUsingMocks, createFirebase } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  if (isUsingMocks()) return <>{children}</>;

  const fb = createFirebase();
  if (!fb) return <>{children}</>;
  const { auth } = fb;

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, [auth]);

  if (!ready) return <div className="p-6 text-sm opacity-70">Loading…</div>;
  if (!user)
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={async () => {
            const { GoogleAuthProvider } = createFirebase()!;
            await signInWithPopup(auth, new GoogleAuthProvider());
          }}
        >
          Continue with Google
        </button>
      </div>
    );

  return <>{children}</>;
}

export function SignOutButton() {
  if (isUsingMocks()) return null;
  const fb = createFirebase();
  if (!fb) return null;
  const { auth } = fb;
  return (
    <button className="px-3 py-1 rounded border" onClick={() => signOut(auth)}>
      Sign out
    </button>
  );
}
