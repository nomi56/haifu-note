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
};

// カン/暗カンの直後はリンシャンツモに続くため、この局面では打牌は発生しない
const NEEDS_DISCARD: Record<Mode, boolean> = {
  tsumo: true,
  chi: true,
  pon: true,
  kan: false,
  ankan: false,
};

// チー/ポンで喰い替えると門前が崩れるため、鳴いた直後の打牌ではリーチ宣言できない
const ALLOWS_RIICHI: Record<Mode, boolean> = {
  tsumo: true,
  chi: false,
  pon: false,
  kan: false,
  ankan: false,
};

export function TurnEditor({ onAdd }: TurnEditorProps) {
  const [mode, setMode] = useState<Mode>('tsumo');
  const [drawTile, setDrawTile] = useState<Tile | null>(null);
  const [callSource, setCallSource] = useState<CallSource>('kamicha');
  const [callTile, setCallTile] = useState<Tile | null>(null);
  const [discardTile, setDiscardTile] = useState<Tile | null>(null);
  const [riichi, setRiichi] = useState(false);

  const needsDiscard = NEEDS_DISCARD[mode];
  const allowsRiichi = ALLOWS_RIICHI[mode];
  // 暗カンはツモった牌とカンする牌が一致するとは限らない(手牌に揃っていた組を
  // 後から暗カンする場合など)ため、両方を別々に入力する
  const requiresDraw = mode === 'tsumo' || mode === 'ankan';
  const requiresCallTile = mode !== 'tsumo';
  const canAdd =
    (!requiresDraw || drawTile !== null) &&
    (!requiresCallTile || callTile !== null) &&
    (!needsDiscard || discardTile !== null);

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
    if (!canAdd) return;
    const turn: Turn = {
      draw: requiresDraw ? (drawTile ?? undefined) : undefined,
      call: buildCall(),
      discard: needsDiscard ? (discardTile ?? undefined) : undefined,
      riichi: allowsRiichi && riichi,
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

      {mode === 'tsumo' && (
        <div className="turn-editor__section">
          <h4>ツモった牌</h4>
          <TileSelectField value={drawTile} onChange={setDrawTile} title="ツモった牌を選ぶ" />
        </div>
      )}

      {mode === 'ankan' && (
        <>
          <div className="turn-editor__section">
            <h4>ツモった牌</h4>
            <TileSelectField value={drawTile} onChange={setDrawTile} title="ツモった牌を選ぶ" />
          </div>
          <div className="turn-editor__section">
            <h4>暗カンする牌</h4>
            <TileSelectField value={callTile} onChange={setCallTile} title="暗カンする牌を選ぶ" />
          </div>
        </>
      )}

      {(mode === 'chi' || mode === 'pon' || mode === 'kan') && (
        <div className="turn-editor__section">
          <h4>{CALL_TILE_LABEL[mode]}</h4>
          {sourceOptions && sourceOptions.length > 1 && (
            <div className="turn-editor__call-controls">
              {sourceOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={callSource === s ? 'active' : ''}
                  onClick={() => setCallSource(s)}
                >
                  {CALL_SOURCE_LABEL_MAP[s]}
                </button>
              ))}
            </div>
          )}
          <TileSelectField value={callTile} onChange={setCallTile} title={`${CALL_TILE_LABEL[mode]}を選ぶ`} />
        </div>
      )}

      {needsDiscard ? (
        <>
          <div className="turn-editor__section">
            <h4>打牌</h4>
            <TileSelectField value={discardTile} onChange={setDiscardTile} title="切った牌を選ぶ" />
          </div>

          <div className={`turn-editor__footer${allowsRiichi ? '' : ' turn-editor__footer--end'}`}>
            {allowsRiichi && (
              <label className="turn-editor__riichi">
                <input type="checkbox" checked={riichi} onChange={(e) => setRiichi(e.target.checked)} />
                リーチ宣言
              </label>
            )}
            <button type="button" className="turn-editor__add" disabled={!canAdd} onClick={handleAdd}>
              1手追加
            </button>
          </div>
        </>
      ) : (
        <div className="turn-editor__footer turn-editor__footer--no-riichi">
          <p className="turn-editor__hint">続けてリンシャンツモを記録してください</p>
          <button type="button" className="turn-editor__add" disabled={!canAdd} onClick={handleAdd}>
            1手追加
          </button>
        </div>
      )}
    </div>
  );
}
