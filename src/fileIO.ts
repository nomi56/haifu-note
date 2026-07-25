import type { KifuSession } from './types';

function sessionFileName(session: KifuSession): string {
  const title = session.title.trim();
  if (title) return `${title}.json`;
  return `kifu-${session.createdAt.slice(0, 10)}.json`;
}

/** セッションをJSONファイルとしてブラウザのダウンロード機能で保存する */
export function downloadSession(session: KifuSession): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sessionFileName(session);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ファイル選択ダイアログで選ばれたファイルからセッションを読み込む */
export async function loadSessionFromFile(file: File): Promise<KifuSession> {
  const text = await file.text();
  let data: KifuSession;
  try {
    data = JSON.parse(text) as KifuSession;
  } catch {
    throw new Error('JSONとして読み込めませんでした');
  }
  if (data.version !== 1) throw new Error('未対応の牌譜フォーマットです');
  return data;
}
