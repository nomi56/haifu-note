import type { Kyoku, KifuSession, TileSize } from './types';

const SESSION_KEY = 'haifu-note:session';
const IN_PROGRESS_KEY = 'haifu-note:inProgressKyoku';
const TILE_SIZE_KEY = 'haifu-note:tileSize';

const TILE_SIZES: TileSize[] = ['small', 'medium', 'large'];

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

export function loadTileSize(): TileSize {
  const raw = localStorage.getItem(TILE_SIZE_KEY);
  return TILE_SIZES.includes(raw as TileSize) ? (raw as TileSize) : 'large';
}

export function saveTileSize(size: TileSize): void {
  localStorage.setItem(TILE_SIZE_KEY, size);
}
