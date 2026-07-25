import type { Kyoku, KifuSession } from './types';

const SESSION_KEY = 'haifu-note:session';
const IN_PROGRESS_KEY = 'haifu-note:inProgressKyoku';

export function loadSession(): KifuSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as KifuSession;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: KifuSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadInProgressKyoku(): Kyoku | null {
  const raw = localStorage.getItem(IN_PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Kyoku;
  } catch {
    return null;
  }
}

export function saveInProgressKyoku(kyoku: Kyoku): void {
  localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(kyoku));
}

export function clearInProgressKyoku(): void {
  localStorage.removeItem(IN_PROGRESS_KEY);
}
