import { useEffect, useState, type CSSProperties } from 'react';
import { FilePanel } from './components/FilePanel';
import { KyokuEditor } from './components/KyokuEditor';
import { SessionHistory } from './components/SessionHistory';
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog';
import * as storage from './storage';
import type { Kyoku, KifuSession, Tile, TileSize, Turn } from './types';
import './App.css';

// 局データの読み替え(既存局の読込/新規局への切り替え/保存・読込画面への移動)先。
// 編集中の内容があればダイアログで確認してから適用する
type PendingSwitch = { type: 'kyoku'; kyoku: Kyoku } | { type: 'new' } | { type: 'file' };

const TILE_SIZE_PX: Record<TileSize, string> = { small: '22px', medium: '30px', large: '38px' };

function createEmptyKyoku(): Kyoku {
  return {
    id: crypto.randomUUID(),
    name: '',
    haipai: [],
    doraIndicators: [],
    turns: [],
    resultMemo: '',
    confirmedAt: '',
  };
}

// 本フィールド追加前に保存されたデータ(localStorage/JSONファイル)にはid/haipaiが無いため補う
function normalizeKyoku(kyoku: Kyoku): Kyoku {
  return { ...kyoku, id: kyoku.id ?? crypto.randomUUID(), haipai: kyoku.haipai ?? [] };
}

function createEmptySession(): KifuSession {
  const now = new Date().toISOString();
  return {
    version: 1,
    title: '',
    createdAt: now,
    updatedAt: now,
    kyokus: [],
  };
}

type View = 'record' | 'file';

function snapshotOf(session: KifuSession, inProgress: Kyoku): string {
  return JSON.stringify([session, inProgress]);
}

function App() {
  const [initial] = useState(() => {
    const loadedSession = storage.loadSession() ?? createEmptySession();
    return {
      session: { ...loadedSession, kyokus: loadedSession.kyokus.map(normalizeKyoku) },
      inProgress: normalizeKyoku(storage.loadInProgressKyoku() ?? createEmptyKyoku()),
    };
  });
  const [session, setSession] = useState<KifuSession>(initial.session);
  const [inProgress, setInProgress] = useState<Kyoku>(initial.inProgress);
  const [view, setView] = useState<View>('record');
  const [tileSize, setTileSize] = useState<TileSize>(() => storage.loadTileSize());
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);
  // ダウンロード/読込/新規作成した時点のスナップショット。現在の内容とズレていれば
  // 「ファイルに書き出していない変更がある」とみなし、離脱時に警告を出す
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotOf(initial.session, initial.inProgress));
  const hasUnsavedChanges = snapshotOf(session, inProgress) !== savedSnapshot;
  // 局を読み込んだ/新規作成した時点のスナップショット。ここからinProgressが変わっていなければ
  // (読み込んだだけで未編集なら)局の切り替え時に確認ダイアログを出す必要はない
  const [loadedKyokuSnapshot, setLoadedKyokuSnapshot] = useState(() => JSON.stringify(initial.inProgress));
  const hasKyokuEdits = JSON.stringify(inProgress) !== loadedKyokuSnapshot;

  // localStorageへの書き込みは軽量なので即時保存する(デバウンスすると
  // 保存前にタブが閉じられ/リロードされた場合にデータを失う)
  useEffect(() => {
    storage.saveSession(session);
  }, [session]);

  useEffect(() => {
    storage.saveInProgressKyoku(inProgress);
  }, [inProgress]);

  useEffect(() => {
    storage.saveTileSize(tileSize);
  }, [tileSize]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function addTurn(turn: Turn) {
    setInProgress((prev) => ({ ...prev, turns: [...prev.turns, turn] }));
  }

  function removeLastTurn() {
    setInProgress((prev) => ({ ...prev, turns: prev.turns.slice(0, -1) }));
  }

  function addHaipaiTile(tile: Tile) {
    setInProgress((prev) => (prev.haipai.length >= 13 ? prev : { ...prev, haipai: [...prev.haipai, tile] }));
  }

  function removeHaipaiTile(index: number) {
    setInProgress((prev) => ({ ...prev, haipai: prev.haipai.filter((_, i) => i !== index) }));
  }

  function addDoraIndicator(tile: Tile) {
    setInProgress((prev) => ({ ...prev, doraIndicators: [...prev.doraIndicators, tile] }));
  }

  function removeDoraIndicator(index: number) {
    setInProgress((prev) => ({ ...prev, doraIndicators: prev.doraIndicators.filter((_, i) => i !== index) }));
  }

  // 現在編集中の局をsession.kyokusへ反映する(既存IDなら上書き、無ければ追加)
  function saveInProgressToSession() {
    if (inProgress.turns.length === 0) return;
    setSession((prev) => {
      const existingIndex = prev.kyokus.findIndex((k) => k.id === inProgress.id);
      if (existingIndex === -1) {
        const confirmed: Kyoku = { ...inProgress, confirmedAt: new Date().toISOString() };
        return { ...prev, kyokus: [...prev.kyokus, confirmed], updatedAt: new Date().toISOString() };
      }
      // 既存の局を編集した場合は確定日時・履歴内の位置を保ったまま内容だけ上書きする
      const updated: Kyoku = { ...inProgress, confirmedAt: prev.kyokus[existingIndex].confirmedAt };
      const kyokus = [...prev.kyokus];
      kyokus[existingIndex] = updated;
      return { ...prev, kyokus, updatedAt: new Date().toISOString() };
    });
  }

  function applySwitch(action: PendingSwitch) {
    if (action.type === 'file') {
      setView('file');
      return;
    }
    const next = action.type === 'kyoku' ? { ...action.kyoku } : createEmptyKyoku();
    setInProgress(next);
    setLoadedKyokuSnapshot(JSON.stringify(next));
  }

  // 編集中の局データを読み替える(既存局の読込/新規局への切り替え)。
  // 読み込み時点から実際に編集されている場合のみ、破棄せず先にダイアログで確認する
  function requestSwitch(action: PendingSwitch) {
    if (hasKyokuEdits) {
      setPendingSwitch(action);
      return;
    }
    applySwitch(action);
  }

  function loadKyokuForEdit(kyoku: Kyoku) {
    if (kyoku.id === inProgress.id) return;
    requestSwitch({ type: 'kyoku', kyoku });
  }

  function startNewKyoku() {
    requestSwitch({ type: 'new' });
  }

  function handleSwitchSave() {
    if (!pendingSwitch) return;
    saveInProgressToSession();
    applySwitch(pendingSwitch);
    setPendingSwitch(null);
  }

  function handleSwitchDiscard() {
    if (!pendingSwitch) return;
    applySwitch(pendingSwitch);
    setPendingSwitch(null);
  }

  function handleSwitchCancel() {
    setPendingSwitch(null);
  }

  function replaceSession(newSession: KifuSession, confirmMessage: string) {
    if (session.kyokus.length > 0 || inProgress.turns.length > 0) {
      if (!window.confirm(confirmMessage)) return;
    }
    const normalizedSession = { ...newSession, kyokus: newSession.kyokus.map(normalizeKyoku) };
    const freshKyoku = createEmptyKyoku();
    setSession(normalizedSession);
    setInProgress(freshKyoku);
    setSavedSnapshot(snapshotOf(normalizedSession, freshKyoku));
    setLoadedKyokuSnapshot(JSON.stringify(freshKyoku));
  }

  function handleNewSession() {
    replaceSession(createEmptySession(), '現在のセッションを破棄して新しい牌譜帳を開始しますか？');
  }

  function handleSessionReplace(loaded: KifuSession) {
    replaceSession(loaded, '現在のセッションを破棄してファイルから読み込みますか？');
  }

  function handleDownloaded() {
    setSavedSnapshot(snapshotOf(session, inProgress));
  }

  // 保存・読込画面へ移動する前に、編集中の局を履歴へ反映しておきたい(ダウンロードに含めるため)。
  // 局切り替えと同様、未保存の編集があればダイアログで確認する。
  // 新規局への切り替えは行わず、編集中の内容はそのまま記録画面に残る
  function handleGoToFileView() {
    requestSwitch({ type: 'file' });
  }

  return (
    <div className="app" style={{ '--tile-size': TILE_SIZE_PX[tileSize] } as CSSProperties}>
      <header className="app__header">
        <h1>🀄 麻雀牌譜記録</h1>
        <nav className="app__nav">
          <button type="button" className={view === 'record' ? 'active' : ''} onClick={() => setView('record')}>
            記録
          </button>
          <button type="button" className={view === 'file' ? 'active' : ''} onClick={handleGoToFileView}>
            保存・読込
          </button>
        </nav>
      </header>

      {view === 'record' ? (
        <main className="app__main">
          <div className="app__session-title">
            <input
              type="text"
              placeholder="セッション名（例: 2026/07/25 ○○荘）"
              value={session.title}
              onChange={(e) => setSession((prev) => ({ ...prev, title: e.target.value }))}
            />
            <button type="button" onClick={handleNewSession}>
              新しい牌譜帳
            </button>
          </div>

          <h2>局の履歴</h2>
          <SessionHistory
            kyokus={session.kyokus}
            editingId={inProgress.id}
            onSelect={loadKyokuForEdit}
            onAddNew={startNewKyoku}
          />

          <h2>牌譜</h2>
          <KyokuEditor
            kyoku={inProgress}
            isEditingExisting={session.kyokus.some((k) => k.id === inProgress.id)}
            onChangeName={(name) => setInProgress((prev) => ({ ...prev, name }))}
            onChangeMemo={(resultMemo) => setInProgress((prev) => ({ ...prev, resultMemo }))}
            onAddHaipaiTile={addHaipaiTile}
            onRemoveHaipaiTile={removeHaipaiTile}
            onAddDoraIndicator={addDoraIndicator}
            onRemoveDoraIndicator={removeDoraIndicator}
            onAddTurn={addTurn}
            onRemoveLastTurn={removeLastTurn}
            tileSize={tileSize}
            onChangeTileSize={setTileSize}
          />
        </main>
      ) : (
        <main className="app__main">
          <FilePanel session={session} onSessionReplace={handleSessionReplace} onDownloaded={handleDownloaded} />
        </main>
      )}

      {pendingSwitch && (
        <UnsavedChangesDialog
          kind={pendingSwitch.type}
          onSave={handleSwitchSave}
          onDiscard={handleSwitchDiscard}
          onCancel={handleSwitchCancel}
        />
      )}
    </div>
  );
}

export default App;
