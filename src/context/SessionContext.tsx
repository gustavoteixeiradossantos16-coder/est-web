import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { ensureProfile, watchProfile } from '@/lib/api';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/plan';

interface Session {
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Guardado junto com o uid para nunca mostrar o perfil de uma conta anterior após trocar de usuário
  const [loaded, setLoaded] = useState<{ uid: string; profile: UserProfile | null } | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setAuthReady(true);
      }),
    [],
  );

  // O perfil é escutado em tempo real: minutos e plano mudam pelo servidor
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    ensureProfile(user.uid, user.email ?? '')
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        unsubscribe = watchProfile(user.uid, (next) => setLoaded({ uid: user.uid, profile: next }));
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  const profileReady = user !== null && loaded?.uid === user.uid;
  const profile = profileReady ? loaded.profile : null;
  const loading = !authReady || (user !== null && !profileReady);
  const logout = () => signOut(auth);

  return <SessionContext.Provider value={{ loading, user, profile, logout }}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return session;
}
