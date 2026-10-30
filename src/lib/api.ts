import { doc, getDoc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from './firebase';
import { todayKey, type DayKey, type UserProfile } from './plan';

const userRef = (uid: string) => doc(db, 'users', uid);

// Cria o perfil inicial. As regras do Firestore só aceitam plan 'free' e 0 minutos aqui.
export async function ensureProfile(uid: string, email: string): Promise<void> {
  const snap = await getDoc(userRef(uid));
  if (snap.exists()) return;
  const profile: UserProfile = {
    email,
    plan: 'free',
    goal: null,
    studyDays: [],
    studyDate: todayKey(),
    minutesToday: 0,
  };
  await setDoc(userRef(uid), profile);
}

export function watchProfile(uid: string, onChange: (profile: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    (snap) => onChange(snap.exists() ? (snap.data() as UserProfile) : null),
    () => onChange(null),
  );
}

// Único trecho do perfil que o cliente pode alterar (plano e minutos só o servidor muda)
export async function saveStudyPlan(uid: string, goal: string, studyDays: DayKey[]): Promise<void> {
  await updateDoc(userRef(uid), { goal, studyDays });
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TrackMinuteResult {
  minutesToday: number;
  blocked: boolean;
}

// Funções do est-api. A chave do Gemini fica só no servidor.
export const askTutor = async (history: ChatMessage[]): Promise<string> => {
  const call = httpsCallable<{ history: ChatMessage[] }, { text: string }>(functions, 'askTutor');
  const { data } = await call({ history });
  return data.text;
};

export const trackStudyMinute = async (): Promise<TrackMinuteResult> => {
  const call = httpsCallable<void, TrackMinuteResult>(functions, 'trackStudyMinute');
  const { data } = await call();
  return data;
};
