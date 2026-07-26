import { useEffect, useState } from 'react';
import { TileMeld } from './TileMeld';
import { TileSelectField } from './TileSelectField';
import { CALL_SOURCE_LABEL_MAP, chiCandidates, fillMeldTiles } from '../tiles';
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

// どの相手から鳴けるか。暗カンは自分の手牌からなので選択肢なし。
// カンは、他家の捨て牌からの通常のカン(上家/対面/下家)に加え、
// 既存のポンにツモ牌を加える「加カン」も選べる
const CALL_SOURCE_OPTIONS: Partial<Record<Mode, (CallSource | 'kakan')[]>> = {
  chi: ['kamicha'],
  pon: ['kamicha', 'toimen', 'shimocha'],
  kan: ['kamicha', 'toimen', 'shimocha', 'kakan'],
};

const KAKAN_LABEL = '加カン';

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
  const [callSource, setCallSource] = useState<CallSource | 'kakan'>('kamicha');
  const [callTile, setCallTile] = useState<Tile | null>(null);
  const [discardTile, setDiscardTile] = useState<Tile | null>(null);
  const [riichi, setRiichi] = useState(false);
  const [karagiri, setKaragiri] = useState(false);
  // チーの形(123/234/345等)。昇順3枚の並びで保持し、鳴いた牌はcallTileと同じ値で含まれる
  const [chiMeld, setChiMeld] = useState<Tile[] | null>(null);

  const needsDiscard = NEEDS_DISCARD[mode];
  const allowsRiichi = ALLOWS_RIICHI[mode];
  // 暗カンはツモった牌とカンする牌が一致するとは限らない(手牌に揃っていた組を
  // 後から暗カンする場合など)ため、両方を別々に入力する
  const requiresDraw = mode === 'tsumo' || mode === 'ankan';
  const requiresCallTile = mode !== 'tsumo';
  const requiresChiMeld = mode === 'chi';
  const canAdd =
    (!requiresDraw || drawTile !== null) &&
    (!requiresCallTile || callTile !== null) &&
    (!requiresChiMeld || chiMeld !== null) &&
    (!needsDiscard || discardTile !== null);

  function reset() {
    setDrawTile(null);
    setCallTile(null);
    setDiscardTile(null);
    setRiichi(false);
    setKaragiri(false);
    setChiMeld(null);
  }

  function changeMode(next: Mode) {
    setMode(next);
    const sources = CALL_SOURCE_OPTIONS[next];
    if (sources) setCallSource(sources[0]);
    reset();
  }

  function changeChiCallTile(tile: Tile) {
    setCallTile(tile);
    setChiMeld(null);
  }

  function buildCall(): Call | undefined {
    if (mode === 'tsumo' || !callTile) return undefined;
    if (mode === 'chi') {
      if (!chiMeld) return undefined;
      const others = chiMeld.filter((t) => t !== callTile);
      return { type: 'chi', from: 'kamicha', tiles: [callTile, ...others] };
    }
    if (mode === 'ankan') return { type: 'ankan', tiles: fillMeldTiles(callTile, 4) };
    if (mode === 'kan' && callSource === 'kakan') return { type: 'kakan', tiles: fillMeldTiles(callTile, 4) };
    const count = mode === 'kan' ? 4 : 3;
    return { type: mode, from: callSource as CallSource, tiles: fillMeldTiles(callTile, count) };
  }

  // ツモった牌と同じ種類を切る場合のみ、ツモ切りに見せかけた空切りを指定できる
  const karagiriEnabled = mode === 'tsumo' && drawTile !== null && discardTile !== null && drawTile === discardTile;

  // 条件を満たさなくなった場合はチェックを外しておく(グレーアウト中に選択状態だけ残らないように)
  useEffect(() => {
    if (!karagiriEnabled) setKaragiri(false);
  }, [karagiriEnabled]);

  function handleAdd() {
    if (!canAdd) return;
    const turn: Turn = {
      draw: requiresDraw ? (drawTile ?? undefined) : undefined,
      call: buildCall(),
      discard: needsDiscard ? (discardTile ?? undefined) : undefined,
      riichi: allowsRiichi && riichi,
      karagiri: karagiriEnabled && karagiri,
    };
    onAdd(turn);
    reset();
    // 次の手は多くの場合ツモから始まるため、入力後は自動でツモ入力に戻す
    setMode('tsumo');
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
          <h4>{mode === 'kan' && callSource === 'kakan' ? '加カンする牌' : CALL_TILE_LABEL[mode]}</h4>
          {sourceOptions && sourceOptions.length > 1 && (
            <div className="turn-editor__call-controls">
              {sourceOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={callSource === s ? 'active' : ''}
                  onClick={() => setCallSource(s)}
                >
                  {s === 'kakan' ? KAKAN_LABEL : CALL_SOURCE_LABEL_MAP[s]}
                </button>
              ))}
            </div>
          )}
          <TileSelectField
            value={callTile}
            onChange={mode === 'chi' ? changeChiCallTile : setCallTile}
            title={`${mode === 'kan' && callSource === 'kakan' ? '加カンする牌' : CALL_TILE_LABEL[mode]}を選ぶ`}
          />
        </div>
      )}

      {mode === 'chi' && callTile && (
        <div className="turn-editor__section">
          <h4>チーの形</h4>
          {chiCandidates(callTile).length === 0 ? (
            <p className="turn-editor__hint">この牌はチーできません</p>
          ) : (
            <div className="turn-editor__chi-candidates">
              {chiCandidates(callTile).map((candidate) => {
                const others = candidate.filter((t) => t !== callTile);
                const display = [{ tile: callTile, rotated: true }, ...others.map((t) => ({ tile: t, rotated: false }))];
                const selected = chiMeld?.join(',') === candidate.join(',');
                return (
                  <button
                    key={candidate.join(',')}
                    type="button"
                    className={`turn-editor__chi-candidate${selected ? ' active' : ''}`}
                    onClick={() => setChiMeld(candidate)}
                  >
                    <TileMeld tiles={display} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {needsDiscard ? (
        <>
          <div className="turn-editor__section">
            <h4>打牌</h4>
            <TileSelectField value={discardTile} onChange={setDiscardTile} title="切った牌を選ぶ" />
          </div>

          <div className="turn-editor__footer">
            <div className="turn-editor__footer-options">
              {allowsRiichi && (
                <label className="turn-editor__riichi">
                  <input type="checkbox" checked={riichi} onChange={(e) => setRiichi(e.target.checked)} />
                  リーチ宣言
                </label>
              )}
              <label className={`turn-editor__karagiri${karagiriEnabled ? '' : ' turn-editor__karagiri--disabled'}`}>
                <input
                  type="checkbox"
                  checked={karagiri}
                  disabled={!karagiriEnabled}
                  onChange={(e) => setKaragiri(e.target.checked)}
                />
                空切り
              </label>
            </div>
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
