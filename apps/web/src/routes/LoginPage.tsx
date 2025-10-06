import { AuthGate } from '@/app/AuthGate';

export default function LoginPage() {
  return (
    <AuthGate>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">You are signed in ✅</h1>
        <p>Use the navigation to explore the app.</p>
      </div>
    </AuthGate>
  );
}
