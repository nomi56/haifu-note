import { useState } from 'react';
import { TileSelectField } from './TileSelectField';
import { CALL_SOURCE_LABEL_MAP, CALL_TYPE_LABEL } from '../tiles';
import type { Call, CallSource, CallType, Tile, Turn } from '../types';

interface TurnEditorProps {
  onAdd: (turn: Turn) => void;
}

type Mode = 'draw' | 'call';

export function TurnEditor({ onAdd }: TurnEditorProps) {
  const [mode, setMode] = useState<Mode>('draw');
  const [drawTile, setDrawTile] = useState<Tile | null>(null);
  const [callType, setCallType] = useState<CallType>('chi');
  const [callSource, setCallSource] = useState<CallSource>('kamicha');
  const [callTile, setCallTile] = useState<Tile | null>(null);
  const [discardTile, setDiscardTile] = useState<Tile | null>(null);
  const [riichi, setRiichi] = useState(false);

  const canAdd = mode === 'draw' ? drawTile !== null && discardTile !== null : callTile !== null && discardTile !== null;

  function reset() {
    setDrawTile(null);
    setCallTile(null);
    setDiscardTile(null);
    setRiichi(false);
  }

  function handleAdd() {
    if (!canAdd || !discardTile) return;
    const call: Call | undefined =
      mode === 'call' && callTile ? { type: callType, from: callSource, tiles: [callTile] } : undefined;
    const turn: Turn = {
      id: crypto.randomUUID(),
      draw: mode === 'draw' ? (drawTile ?? undefined) : undefined,
      call,
      discard: discardTile,
      riichi,
    };
    onAdd(turn);
    reset();
  }

  return (
    <div className="turn-editor">
      <div className="turn-editor__mode">
        <button type="button" className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')}>
          自摸
        </button>
        <button type="button" className={mode === 'call' ? 'active' : ''} onClick={() => setMode('call')}>
          鳴き
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="turn-editor__section">
          <h4>ツモった牌</h4>
          <TileSelectField value={drawTile} onChange={setDrawTile} title="ツモった牌を選ぶ" />
        </div>
      ) : (
        <div className="turn-editor__section">
          <h4>鳴いた牌</h4>
          <div className="turn-editor__call-controls">
            <select value={callType} onChange={(e) => setCallType(e.target.value as CallType)}>
              {(Object.keys(CALL_TYPE_LABEL) as CallType[]).map((t) => (
                <option key={t} value={t}>
                  {CALL_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <select value={callSource} onChange={(e) => setCallSource(e.target.value as CallSource)}>
              {(Object.keys(CALL_SOURCE_LABEL_MAP) as CallSource[]).map((s) => (
                <option key={s} value={s}>
                  {CALL_SOURCE_LABEL_MAP[s]}
                </option>
              ))}
            </select>
          </div>
          <TileSelectField value={callTile} onChange={setCallTile} title="鳴いた牌を選ぶ" />
        </div>
      )}

      <div className="turn-editor__section">
        <h4>打牌</h4>
        <TileSelectField value={discardTile} onChange={setDiscardTile} title="切った牌を選ぶ" />
      </div>

      <div className="turn-editor__footer">
        <label className="turn-editor__riichi">
          <input type="checkbox" checked={riichi} onChange={(e) => setRiichi(e.target.checked)} />
          リーチ宣言
        </label>
        <button type="button" className="turn-editor__add" disabled={!canAdd} onClick={handleAdd}>
          1手追加
        </button>
      </div>
    </div>
  );
}
