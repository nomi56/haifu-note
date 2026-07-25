import { useEffect, useState } from 'react';
import { FilePanel } from './components/FilePanel';
import { KyokuEditor } from './components/KyokuEditor';
import { SessionHistory } from './components/SessionHistory';
import * as storage from './storage';
import type { Kyoku, KifuSession, Tile, Turn } from './types';
import './App.css';

function createEmptyKyoku(): Kyoku {
  return {
    id: crypto.randomUUID(),
    name: '',
    doraIndicators: [],
    turns: [],
    resultMemo: '',
    confirmedAt: '',
  };
}

function createEmptySession(): KifuSession {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: crypto.randomUUID(),
    title: '',
    createdAt: now,
    updatedAt: now,
    kyokus: [],
  };
}

type View = 'record' | 'file';

function App() {
  const [session, setSession] = useState<KifuSession>(() => storage.loadSession() ?? createEmptySession());
  const [inProgress, setInProgress] = useState<Kyoku>(() => storage.loadInProgressKyoku() ?? createEmptyKyoku());
  const [view, setView] = useState<View>('record');

  // localStorageへの書き込みは軽量なので即時保存する(デバウンスすると
  // 保存前にタブが閉じられ/リロードされた場合にデータを失う)
  useEffect(() => {
    storage.saveSession(session);
  }, [session]);

  useEffect(() => {
    storage.saveInProgressKyoku(inProgress);
  }, [inProgress]);

  function addTurn(turn: Turn) {
    setInProgress((prev) => ({ ...prev, turns: [...prev.turns, turn] }));
  }

  function removeLastTurn() {
    setInProgress((prev) => ({ ...prev, turns: prev.turns.slice(0, -1) }));
  }

  function addDoraIndicator(tile: Tile) {
    setInProgress((prev) => ({ ...prev, doraIndicators: [...prev.doraIndicators, tile] }));
  }

  function removeDoraIndicator(index: number) {
    setInProgress((prev) => ({ ...prev, doraIndicators: prev.doraIndicators.filter((_, i) => i !== index) }));
  }

  function confirmKyoku() {
    if (inProgress.turns.length === 0) return;
    const confirmed: Kyoku = { ...inProgress, confirmedAt: new Date().toISOString() };
    setSession((prev) => ({ ...prev, kyokus: [...prev.kyokus, confirmed], updatedAt: new Date().toISOString() }));
    setInProgress(createEmptyKyoku());
  }

  function replaceSession(newSession: KifuSession, confirmMessage: string) {
    if (session.kyokus.length > 0 || inProgress.turns.length > 0) {
      if (!window.confirm(confirmMessage)) return;
    }
    setSession(newSession);
    setInProgress(createEmptyKyoku());
  }

  function handleNewSession() {
    replaceSession(createEmptySession(), '現在のセッションを破棄して新しい牌譜帳を開始しますか？');
  }

  function handleSessionReplace(loaded: KifuSession) {
    replaceSession(loaded, '現在のセッションを破棄してファイルから読み込みますか？');
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🀄 麻雀牌譜記録</h1>
        <nav className="app__nav">
          <button type="button" className={view === 'record' ? 'active' : ''} onClick={() => setView('record')}>
            記録
          </button>
          <button type="button" className={view === 'file' ? 'active' : ''} onClick={() => setView('file')}>
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

          <KyokuEditor
            kyoku={inProgress}
            onChangeName={(name) => setInProgress((prev) => ({ ...prev, name }))}
            onChangeMemo={(resultMemo) => setInProgress((prev) => ({ ...prev, resultMemo }))}
            onAddDoraIndicator={addDoraIndicator}
            onRemoveDoraIndicator={removeDoraIndicator}
            onAddTurn={addTurn}
            onRemoveLastTurn={removeLastTurn}
            onConfirm={confirmKyoku}
          />

          <h2>局の履歴</h2>
          <SessionHistory kyokus={session.kyokus} />
        </main>
      ) : (
        <main className="app__main">
          <FilePanel session={session} onSessionReplace={handleSessionReplace} />
        </main>
      )}
    </div>
  );
}

export default App;
