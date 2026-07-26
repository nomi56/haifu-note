import { useState } from 'react';
import { TileSelectField } from './TileSelectField';
import { CALL_SOURCE_LABEL_MAP } from '../tiles';
import type { Call, CallSource, Tile, Turn } from '../types';

interface TurnEditorProps {
  onAdd: (turn: Turn) => void;
}

type Mode = 'tsumo' | 'chi' | 'pon' | 'kan' | 'ankan';

const MODE_LABEL: Record<Mode, string> = {
  tsumo: '自摸',
  chi: 'チー',
  pon: 'ポン',
  kan: 'カン',
  ankan: '暗カン',
};

const MODES: Mode[] = ['tsumo', 'chi', 'pon', 'kan', 'ankan'];

// どの相手から鳴けるか。暗カンは自分の手牌からなので選択肢なし
const CALL_SOURCE_OPTIONS: Partial<Record<Mode, CallSource[]>> = {
  chi: ['kamicha'],
  pon: ['kamicha', 'toimen', 'shimocha'],
  kan: ['kamicha', 'toimen', 'shimocha'],
};

const CALL_TILE_LABEL: Partial<Record<Mode, string>> = {
  chi: 'チーした牌',
  pon: 'ポンした牌',
  kan: 'カンした牌',
  ankan: '暗カンする牌',
};

export function TurnEditor({ onAdd }: TurnEditorProps) {
  const [mode, setMode] = useState<Mode>('tsumo');
  const [drawTile, setDrawTile] = useState<Tile | null>(null);
  const [callSource, setCallSource] = useState<CallSource>('kamicha');
  const [callTile, setCallTile] = useState<Tile | null>(null);
  const [discardTile, setDiscardTile] = useState<Tile | null>(null);
  const [riichi, setRiichi] = useState(false);

  const canAdd = (mode === 'tsumo' ? drawTile !== null : callTile !== null) && discardTile !== null;

  function reset() {
    setDrawTile(null);
    setCallTile(null);
    setDiscardTile(null);
    setRiichi(false);
  }

  function changeMode(next: Mode) {
    setMode(next);
    const sources = CALL_SOURCE_OPTIONS[next];
    if (sources) setCallSource(sources[0]);
    reset();
  }

  function buildCall(): Call | undefined {
    if (mode === 'tsumo' || !callTile) return undefined;
    if (mode === 'chi') return { type: 'chi', from: 'kamicha', tiles: [callTile] };
    if (mode === 'ankan') return { type: 'ankan', tiles: [callTile] };
    return { type: mode, from: callSource, tiles: [callTile] };
  }

  function handleAdd() {
    if (!canAdd || !discardTile) return;
    const turn: Turn = {
      draw: mode === 'tsumo' ? (drawTile ?? undefined) : undefined,
      call: buildCall(),
      discard: discardTile,
      riichi,
    };
    onAdd(turn);
    reset();
  }

  const sourceOptions = CALL_SOURCE_OPTIONS[mode];

  return (
    <div className="turn-editor">
      <div className="turn-editor__mode">
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? 'active' : ''} onClick={() => changeMode(m)}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {mode === 'tsumo' ? (
        <div className="turn-editor__section">
          <h4>ツモった牌</h4>
          <TileSelectField value={drawTile} onChange={setDrawTile} title="ツモった牌を選ぶ" />
        </div>
      ) : (
        <div className="turn-editor__section">
          <h4>{CALL_TILE_LABEL[mode]}</h4>
          {sourceOptions && sourceOptions.length > 1 && (
            <div className="turn-editor__call-controls">
              <select value={callSource} onChange={(e) => setCallSource(e.target.value as CallSource)}>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {CALL_SOURCE_LABEL_MAP[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TileSelectField value={callTile} onChange={setCallTile} title={`${CALL_TILE_LABEL[mode]}を選ぶ`} />
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
