import { useEffect, useState } from 'react';
import { TileMeld } from './TileMeld';
import { TileSelectField } from './TileSelectField';
import { AGARI_SOURCE_LABEL_MAP, CALL_SOURCE_LABEL_MAP, chiCandidates, fillMeldTiles, sortTiles } from '../tiles';
import type { Hand } from '../hand';
import type { AgariSource, Call, CallSource, Tile, Turn } from '../types';

interface TurnEditorProps {
  onSubmit: (turn: Turn) => void;
  /** 既存の手を修正する場合、その手の内容を初期値として読み込む */
  initialTurn?: Turn;
  /** 修正/挿入中であることを示す見出し。通常の追加時は未設定 */
  heading?: string;
  submitLabel?: string;
  /** 修正/挿入を取りやめる。設定されている場合のみキャンセルボタンを出す */
  onCancel?: () => void;
  /** この手を打つ直前の手牌。指定すると、入力中の手が手牌と合わない場合に警告を出す */
  handBefore?: Hand | null;
}

type Mode = 'tsumo' | 'chi' | 'pon' | 'kan' | 'ankan' | 'agari';

const MODE_LABEL: Record<Mode, string> = {
  tsumo: '自摸',
  chi: 'チー',
  pon: 'ポン',
  kan: 'カン',
  ankan: '暗カン',
  agari: '和了',
};

const MODES: Mode[] = ['tsumo', 'chi', 'pon', 'kan', 'ankan', 'agari'];

const AGARI_SOURCE_OPTIONS: AgariSource[] = ['tsumo', 'kamicha', 'toimen', 'shimocha'];

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

// カン/暗カンの直後はリンシャンツモに続くため、この局面では打牌は発生しない。
// 和了は局の最後の手であり、この後に打牌は発生しない
const NEEDS_DISCARD: Record<Mode, boolean> = {
  tsumo: true,
  chi: true,
  pon: true,
  kan: false,
  ankan: false,
  agari: false,
};

// チー/ポンで喰い替えると門前が崩れるため、鳴いた直後の打牌ではリーチ宣言できない
const ALLOWS_RIICHI: Record<Mode, boolean> = {
  tsumo: true,
  chi: false,
  pon: false,
  kan: false,
  ankan: false,
  agari: false,
};

interface EditorState {
  mode: Mode;
  drawTile: Tile | null;
  callSource: CallSource | 'kakan';
  callTile: Tile | null;
  discardTile: Tile | null;
  riichi: boolean;
  karagiri: boolean;
  chiMeld: Tile[] | null;
  agariTile: Tile | null;
  agariSource: AgariSource;
}

const EMPTY_STATE: EditorState = {
  mode: 'tsumo',
  drawTile: null,
  callSource: 'kamicha',
  callTile: null,
  discardTile: null,
  riichi: false,
  karagiri: false,
  chiMeld: null,
  agariTile: null,
  agariSource: 'tsumo',
};

/** 記録済みの手を入力欄の状態に戻す(handleAdd/buildCallの逆変換)。修正時の初期値に使う */
function stateFromTurn(turn: Turn): EditorState {
  const base: EditorState = {
    ...EMPTY_STATE,
    drawTile: turn.draw ?? null,
    discardTile: turn.discard ?? null,
    riichi: turn.riichi,
    karagiri: turn.karagiri,
  };
  if (turn.agari) {
    return { ...base, mode: 'agari', agariTile: turn.agari.tile, agariSource: turn.agari.source };
  }
  const call = turn.call;
  if (!call) return { ...base, mode: 'tsumo' };
  const callTile = call.tiles[0];
  switch (call.type) {
    case 'chi': {
      // 保存時は[鳴いた牌, 残り2枚]の順なので、候補(昇順)のうち同じ構成のものを選び直す
      const key = sortTiles(call.tiles).join(',');
      const chiMeld = chiCandidates(callTile).find((c) => sortTiles(c).join(',') === key) ?? null;
      return { ...base, mode: 'chi', callTile, chiMeld };
    }
    case 'ankan':
      return { ...base, mode: 'ankan', callTile };
    case 'kakan':
      return { ...base, mode: 'kan', callSource: 'kakan', callTile };
    default:
      return { ...base, mode: call.type, callSource: call.from ?? 'kamicha', callTile };
  }
}

export function TurnEditor({
  onSubmit,
  initialTurn,
  heading,
  submitLabel = '1手追加',
  onCancel,
  handBefore = null,
}: TurnEditorProps) {
  const [initial] = useState(() => (initialTurn ? stateFromTurn(initialTurn) : EMPTY_STATE));
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [drawTile, setDrawTile] = useState<Tile | null>(initial.drawTile);
  const [callSource, setCallSource] = useState<CallSource | 'kakan'>(initial.callSource);
  const [callTile, setCallTile] = useState<Tile | null>(initial.callTile);
  const [discardTile, setDiscardTile] = useState<Tile | null>(initial.discardTile);
  const [riichi, setRiichi] = useState(initial.riichi);
  const [karagiri, setKaragiri] = useState(initial.karagiri);
  // チーの形(123/234/345等)。昇順3枚の並びで保持し、鳴いた牌はcallTileと同じ値で含まれる
  const [chiMeld, setChiMeld] = useState<Tile[] | null>(initial.chiMeld);
  const [agariTile, setAgariTile] = useState<Tile | null>(initial.agariTile);
  const [agariSource, setAgariSource] = useState<AgariSource>(initial.agariSource);

  const needsDiscard = NEEDS_DISCARD[mode];
  const allowsRiichi = ALLOWS_RIICHI[mode];
  // 暗カンはツモった牌とカンする牌が一致するとは限らない(手牌に揃っていた組を
  // 後から暗カンする場合など)ため、両方を別々に入力する
  const requiresDraw = mode === 'tsumo' || mode === 'ankan';
  const requiresCallTile = mode !== 'tsumo' && mode !== 'agari';
  const requiresChiMeld = mode === 'chi';
  const requiresAgariTile = mode === 'agari';
  const canAdd =
    (!requiresDraw || drawTile !== null) &&
    (!requiresCallTile || callTile !== null) &&
    (!requiresChiMeld || chiMeld !== null) &&
    (!requiresAgariTile || agariTile !== null) &&
    (!needsDiscard || discardTile !== null);

  function reset() {
    setDrawTile(null);
    setCallTile(null);
    setDiscardTile(null);
    setRiichi(false);
    setKaragiri(false);
    setChiMeld(null);
    setAgariTile(null);
    setAgariSource('tsumo');
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
    if (mode === 'tsumo' || mode === 'agari' || !callTile) return undefined;
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

  function buildTurn(): Turn {
    return {
      draw: requiresDraw ? (drawTile ?? undefined) : undefined,
      call: buildCall(),
      discard: needsDiscard ? (discardTile ?? undefined) : undefined,
      riichi: allowsRiichi && riichi,
      karagiri: karagiriEnabled && karagiri,
      agari: requiresAgariTile && agariTile ? { tile: agariTile, source: agariSource } : undefined,
    };
  }

  // 入力中の手を直前の手牌に仮に適用し、手牌と合わない(持っていない牌を切る等)場合は警告する。追加自体は止めない
  const draftIssues = canAdd && handBefore ? handBefore.clone().applyTurn(buildTurn()) : [];

  function handleAdd() {
    if (!canAdd) return;
    onSubmit(buildTurn());
    // 修正/挿入の確定後は親が入力欄を作り直すため、ここでのリセットは通常の追加時のみ
    if (initialTurn || onCancel) return;
    reset();
    // 次の手は多くの場合ツモから始まるため、入力後は自動でツモ入力に戻す
    setMode('tsumo');
  }

  const isTargeted = heading !== undefined;
  const warning = draftIssues.length > 0 && (
    <p className="turn-editor__warning">⚠ {draftIssues.map((i) => i.message).join(' / ')}</p>
  );
  const submitButtons = (
    <div className="turn-editor__submit">
      {onCancel && (
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      )}
      <button
        type="button"
        className={`turn-editor__add${isTargeted ? ' turn-editor__add--primary' : ''}`}
        disabled={!canAdd}
        onClick={handleAdd}
      >
        {submitLabel}
      </button>
    </div>
  );

  const sourceOptions = CALL_SOURCE_OPTIONS[mode];

  return (
    <div className={`turn-editor${isTargeted ? ' turn-editor--targeted' : ''}`}>
      {heading && <div className="turn-editor__heading">{heading}</div>}
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

      {mode === 'agari' && (
        <>
          <div className="turn-editor__section">
            <h4>和了牌</h4>
            <TileSelectField value={agariTile} onChange={setAgariTile} title="和了牌を選ぶ" />
          </div>
          <div className="turn-editor__section">
            <h4>和了方</h4>
            <div className="turn-editor__call-controls">
              {AGARI_SOURCE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={agariSource === s ? 'active' : ''}
                  onClick={() => setAgariSource(s)}
                >
                  {AGARI_SOURCE_LABEL_MAP[s]}
                </button>
              ))}
            </div>
          </div>
        </>
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

          {warning}
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
            {!isTargeted && submitButtons}
          </div>
          {isTargeted && submitButtons}
        </>
      ) : (
        <>
          {warning}
          <div className="turn-editor__footer turn-editor__footer--no-riichi">
            <p className="turn-editor__hint">
              {mode === 'agari' ? 'この局はこの手で終了します' : '続けてリンシャンツモを記録してください'}
            </p>
            {!isTargeted && submitButtons}
          </div>
        </>
      )}
      {!needsDiscard && isTargeted && submitButtons}
    </div>
  );
}
