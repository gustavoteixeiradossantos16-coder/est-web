import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import type { Perfil } from '@/lib/types';

interface Session {
  /** true enquanto o Firebase ainda não disse se há alguém logado */
  carregando: boolean;
  user: User | null;
  perfil: Perfil | null;
  erroPerfil: string | null;
  setPerfil: (p: Perfil) => void;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authPronto, setAuthPronto] = useState(false);
  // Guardado junto com o uid para nunca mostrar o perfil de outra conta após trocar de usuário
  const [carregado, setCarregado] = useState<{ uid: string; perfil: Perfil | null; erro: string | null } | null>(null);

  const recarregarPerfil = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    try {
      const perfil = await api.me();
      setCarregado({ uid: u.uid, perfil, erro: null });
    } catch (e) {
      setCarregado({ uid: u.uid, perfil: null, erro: e instanceof Error ? e.message : 'Erro ao carregar a conta.' });
    }
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthPronto(true);
        if (u) recarregarPerfil(); // o perfil vem da API (ela cria no primeiro acesso)
      }),
    [recarregarPerfil],
  );

  const doUsuario = user && carregado?.uid === user.uid ? carregado : null;
  const value: Session = {
    carregando: !authPronto,
    user,
    perfil: doUsuario?.perfil ?? null,
    erroPerfil: doUsuario?.erro ?? null,
    setPerfil: (perfil) => user && setCarregado({ uid: user.uid, perfil, erro: null }),
    recarregarPerfil,
    sair: () => signOut(auth),
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return s;
}
