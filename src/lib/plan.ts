// Regras de plano compartilhadas com o back-end (est-api/functions/src/plan.ts).
// Se mudar algo aqui, mude lá também: o servidor é quem decide de verdade.

export type Plan = 'free' | 'pro';
export type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

export const FREE_MINUTES_PER_DAY = 30;
export const FREE_DAYS_PER_WEEK = 4;
export const PREMIUM_PRICE = 'R$ 29,90';

// Documento users/{uid} no Firestore
export interface UserProfile {
  email: string;
  plan: Plan;
  goal: string | null;
  studyDays: DayKey[];
  studyDate: string; // YYYY-MM-DD no fuso de Brasília
  minutesToday: number;
}

// O dia de estudo vira à meia-noite de Brasília (UTC-3, sem horário de verão desde 2019),
// não à meia-noite UTC como no protótipo (que zerava o contador às 21h).
function brasiliaNow(now = new Date()): Date {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

export function todayKey(now = new Date()): string {
  return brasiliaNow(now).toISOString().slice(0, 10);
}

export function todayDay(now = new Date()): DayKey {
  const keys: DayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return keys[brasiliaNow(now).getUTCDay()];
}

export function minutesUsedToday(profile: UserProfile): number {
  return profile.studyDate === todayKey() ? profile.minutesToday : 0;
}

export type BlockReason = 'daily-limit' | 'not-study-day' | null;

export function blockReason(profile: UserProfile): BlockReason {
  if (profile.plan === 'pro') return null;
  if (!profile.studyDays.includes(todayDay())) return 'not-study-day';
  if (minutesUsedToday(profile) >= FREE_MINUTES_PER_DAY) return 'daily-limit';
  return null;
}
