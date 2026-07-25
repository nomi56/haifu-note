import { useState } from 'react';
import {
  connect,
  disconnect,
  getSavedClientId,
  isConnected,
  listSessionFiles,
  loadSessionFromDrive,
  saveClientId,
  saveSessionToDrive,
  type DriveFileSummary,
} from '../drive';
import type { KifuSession } from '../types';

interface DrivePanelProps {
  session: KifuSession;
  onSessionUpdate: (session: KifuSession) => void;
}

export function DrivePanel({ session, onSessionUpdate }: DrivePanelProps) {
  const [clientId, setClientId] = useState(getSavedClientId());
  const [connected, setConnected] = useState(isConnected());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFileSummary[] | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function handleConnect() {
    void run(async () => {
      saveClientId(clientId);
      await connect(clientId);
      setConnected(true);
      setNotice('Googleに接続しました');
    });
  }

  function handleDisconnect() {
    disconnect();
    setConnected(false);
    setFiles(null);
  }

  function handleSave() {
    void run(async () => {
      const updated = await saveSessionToDrive(session);
      onSessionUpdate(updated);
      setNotice('Google Driveに保存しました');
    });
  }

  function handleRefreshFiles() {
    void run(async () => {
      setFiles(await listSessionFiles());
    });
  }

  function handleOpen(fileId: string) {
    void run(async () => {
      const loaded = await loadSessionFromDrive(fileId);
      onSessionUpdate(loaded);
      setNotice('牌譜を読み込みました');
    });
  }

  return (
    <section className="drive-panel">
      <h3>Google Drive連携</h3>

      <label className="drive-panel__field">
        OAuth Client ID
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="xxxxxxxx.apps.googleusercontent.com"
        />
      </label>

      <div className="drive-panel__actions">
        {connected ? (
          <button type="button" onClick={handleDisconnect} disabled={busy}>
            切断
          </button>
        ) : (
          <button type="button" onClick={handleConnect} disabled={busy || !clientId}>
            Googleに接続
          </button>
        )}
        <button type="button" onClick={handleSave} disabled={busy || !connected}>
          現在のセッションを保存
        </button>
        <button type="button" onClick={handleRefreshFiles} disabled={busy || !connected}>
          Drive上のファイル一覧を取得
        </button>
      </div>

      {error && <p className="drive-panel__error">{error}</p>}
      {notice && <p className="drive-panel__notice">{notice}</p>}

      {files && (
        <ul className="drive-panel__files">
          {files.length === 0 && <li>保存済みファイルはありません</li>}
          {files.map((f) => (
            <li key={f.id}>
              <span>{f.name}</span>
              <span className="drive-panel__file-time">{new Date(f.modifiedTime).toLocaleString('ja-JP')}</span>
              <button type="button" onClick={() => handleOpen(f.id)} disabled={busy}>
                開く
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="drive-panel__hint">
        現在のセッション: {session.driveFileId ? `Drive保存済み (id: ${session.driveFileId.slice(0, 8)}…)` : '未保存'}
      </p>
    </section>
  );
}
