'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

export default function Home() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1>Please log in</h1>
        <button onClick={handleLogin} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white">
          Log in with GitHub
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>Welcome, {session.user?.email}</h1>
      <button onClick={handleLogout} className="mt-4 rounded bg-red-600 px-4 py-2 text-white">
        Log out
      </button>
    </main>
  );
}
