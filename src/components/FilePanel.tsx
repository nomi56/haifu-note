import { useRef, useState } from 'react';
import { downloadSession, loadSessionFromFile } from '../fileIO';
import type { KifuSession } from '../types';

interface FilePanelProps {
  session: KifuSession;
  onSessionReplace: (session: KifuSession) => void;
}

export function FilePanel({ session, onSessionReplace }: FilePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDownload() {
    downloadSession(session);
    setError(null);
    setNotice('ダウンロードしました');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setNotice(null);
    loadSessionFromFile(file)
      .then((loaded) => {
        onSessionReplace(loaded);
        setNotice('牌譜を読み込みました');
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }

  return (
    <section className="file-panel">
      <h3>牌譜のファイル保存・読込</h3>
      <p className="file-panel__hint">
        牌譜帳をJSONファイルとしてダウンロード／読込します。保存先は端末のダウンロードフォルダなどブラウザに任される他、
        Google Driveのデスクトップアプリ等で同期されたフォルダに保存すれば、そのままWebストレージ上にも残せます。
      </p>

      <div className="file-panel__actions">
        <button type="button" onClick={handleDownload}>
          現在のセッションをダウンロード
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          ファイルから読み込む
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && <p className="file-panel__error">{error}</p>}
      {notice && <p className="file-panel__notice">{notice}</p>}
    </section>
  );
}
