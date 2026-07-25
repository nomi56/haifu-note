import type { KifuSession } from './types';

// Google Identity Services (GIS) + Drive REST v3 を素のfetchで叩く。
// gapi.client等の重いSDKは使わない。

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void;
          }): { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

const CLIENT_ID_KEY = 'haifu-note:googleClientId';
const FOLDER_ID_KEY = 'haifu-note:driveFolderId';
const FOLDER_NAME = '麻雀牌譜記録';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const FILES_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

let accessToken: string | null = null;
let tokenExpiresAt = 0;

export function getSavedClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? '';
}

export function saveClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

export function isConnected(): boolean {
  return accessToken !== null && Date.now() < tokenExpiresAt;
}

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', () => resolve(), { once: true }));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Servicesの読み込みに失敗しました'));
    document.head.appendChild(script);
  });
}

/** ユーザー操作(クリック)のハンドラ内から直接呼び出すこと(ポップアップブロック対策) */
export async function connect(clientId: string): Promise<void> {
  if (!clientId) throw new Error('Google OAuth Client IDが設定されていません');
  await loadGisScript();
  if (!window.google) throw new Error('Google Identity Servicesを利用できません');

  await new Promise<void>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? '認証に失敗しました'));
          return;
        }
        accessToken = resp.access_token;
        tokenExpiresAt = Date.now() + (resp.expires_in ?? 3600) * 1000 - 60_000;
        resolve();
      },
    });
    client.requestAccessToken();
  });
}

export function disconnect(): void {
  if (accessToken && window.google) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiresAt = 0;
}

function requireToken(): string {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    throw new Error('Googleに接続されていません。再接続してください。');
  }
  return accessToken;
}

async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = requireToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    accessToken = null;
    tokenExpiresAt = 0;
    throw new Error('Google接続の有効期限が切れました。再接続してください。');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Drive APIエラー (${res.status}): ${text}`);
  }
  return res;
}

async function findAppFolder(): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const res = await driveFetch(`${FILES_API}?q=${q}&spaces=drive&fields=files(id,name)`);
  const data = (await res.json()) as { files: { id: string }[] };
  return data.files[0]?.id ?? null;
}

async function createAppFolder(): Promise<string> {
  const res = await driveFetch(FILES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function ensureAppFolder(): Promise<string> {
  const cached = localStorage.getItem(FOLDER_ID_KEY);
  if (cached) {
    try {
      const res = await driveFetch(`${FILES_API}/${cached}?fields=id,trashed`);
      const data = (await res.json()) as { id: string; trashed?: boolean };
      if (!data.trashed) return cached;
    } catch {
      // フォールバックして検索し直す
    }
  }
  const found = (await findAppFolder()) ?? (await createAppFolder());
  localStorage.setItem(FOLDER_ID_KEY, found);
  return found;
}

export interface DriveFileSummary {
  id: string;
  name: string;
  modifiedTime: string;
}

export async function listSessionFiles(): Promise<DriveFileSummary[]> {
  const folderId = await ensureAppFolder();
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await driveFetch(
    `${FILES_API}?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&spaces=drive`,
  );
  const data = (await res.json()) as { files: DriveFileSummary[] };
  return data.files;
}

function sessionFileName(session: KifuSession): string {
  const title = session.title.trim();
  if (title) return `${title}.json`;
  return `kifu-${session.createdAt.slice(0, 10)}.json`;
}

async function createSessionFile(session: KifuSession, folderId: string): Promise<string> {
  const boundary = 'haifu-note-boundary';
  const metadata = { name: sessionFileName(session), parents: [folderId], mimeType: 'application/json' };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n${JSON.stringify(session)}\r\n` +
    `--${boundary}--`;
  const res = await driveFetch(`${UPLOAD_API}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function updateSessionFile(fileId: string, session: KifuSession): Promise<void> {
  await driveFetch(`${UPLOAD_API}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
}

/** セッションをDriveへ保存(未保存ならファイル作成、保存済みなら上書き)し、driveFileIdを反映したセッションを返す */
export async function saveSessionToDrive(session: KifuSession): Promise<KifuSession> {
  const folderId = await ensureAppFolder();
  if (session.driveFileId) {
    try {
      await updateSessionFile(session.driveFileId, session);
      return session;
    } catch {
      // ファイルが削除された等の場合は新規作成にフォールバック
    }
  }
  const fileId = await createSessionFile(session, folderId);
  return { ...session, driveFileId: fileId };
}

export async function loadSessionFromDrive(fileId: string): Promise<KifuSession> {
  const res = await driveFetch(`${FILES_API}/${fileId}?alt=media`);
  const data = (await res.json()) as KifuSession;
  if (data.version !== 1) throw new Error('未対応の牌譜フォーマットです');
  return { ...data, driveFileId: fileId };
}
