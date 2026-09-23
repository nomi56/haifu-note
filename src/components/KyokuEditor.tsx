import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { GameInfoEditor } from './GameInfoEditor';
import { HaipaiEditor } from './HaipaiEditor';
import { HaipaiRow } from './HaipaiRow';
import { RiverView } from './RiverView';
import { TileGlyph } from './TileGlyph';
import { TileSelectModal } from './TileSelectModal';
import { TurnEditor } from './TurnEditor';
import { TurnRow } from './TurnRow';
import { formatGameInfo } from '../gameInfo';
import { Hand, traceHands } from '../hand';
import { isRinshan } from '../tiles';
import type { GameInfo, Kyoku, Tile, TileSize, Turn } from '../types';

interface KyokuEditorProps {
  kyoku: Kyoku;
  isEditingExisting: boolean;
  onChangeName: (name: string) => void;
  onChangeMemo: (memo: string) => void;
  onChangeGameInfo: (gameInfo: GameInfo) => void;
  onAddHaipaiTile: (tile: Tile) => void;
  onRemoveHaipaiTile: (index: number) => void;
  onAddDoraIndicator: (tile: Tile) => void;
  onRemoveDoraIndicator: (index: number) => void;
  onAddTurn: (turn: Turn) => void;
  onUpdateTurn: (index: number, turn: Turn) => void;
  onInsertTurn: (index: number, turn: Turn) => void;
  onRemoveTurn: (index: number) => void;
  tileSize: TileSize;
  onChangeTileSize: (size: TileSize) => void;
  showHand: boolean;
  onChangeShowHand: (show: boolean) => void;
}

// 入力欄の対象。未設定なら末尾への通常の追加。editはindex番目を置き換え、insertはindex番目の前に挿入する
type TurnTarget = { kind: 'edit' | 'insert'; index: number };

const TILE_SIZE_OPTIONS: { value: TileSize; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
];

export function KyokuEditor({
  kyoku,
  isEditingExisting,
  onChangeName,
  onChangeMemo,
  onChangeGameInfo,
  onAddHaipaiTile,
  onRemoveHaipaiTile,
  onAddDoraIndicator,
  onRemoveDoraIndicator,
  onAddTurn,
  onUpdateTurn,
  onInsertTurn,
  onRemoveTurn,
  tileSize,
  onChangeTileSize,
  showHand,
  onChangeShowHand,
}: KyokuEditorProps) {
  const [haipaiEditorOpen, setHaipaiEditorOpen] = useState(false);
  const [doraPickerOpen, setDoraPickerOpen] = useState(false);
  const [gameInfoEditorOpen, setGameInfoEditorOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<TurnTarget | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const turnEditorRef = useRef<HTMLDivElement>(null);
  // 各手の直後の手牌。配牌が13枚そろっていない場合はnull(追跡できない)
  const handSteps = useMemo(
    () => (showHand ? traceHands(kyoku.haipai, kyoku.turns) : null),
    [showHand, kyoku.haipai, kyoku.turns],
  );
  // 入力欄で入力中の手を打つ直前の手牌。通常の追加なら最後の手の後、修正/挿入なら対象の手の直前
  const handBeforeInput = useMemo(() => {
    if (!handSteps) return null;
    const index = target ? target.index : kyoku.turns.length;
    return index === 0 ? Hand.fromHaipai(kyoku.haipai) : handSteps[index - 1].hand;
  }, [handSteps, target, kyoku.haipai, kyoku.turns.length]);

  // 修正/挿入を始めたら、下にある入力欄が見えるようにスクロールする
  useEffect(() => {
    if (target) turnEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [target]);

  function clearTurnSelection() {
    setSelectedIndex(null);
    setTarget(null);
  }

  function toggleTurnSelection(index: number) {
    setTarget(null);
    setSelectedIndex((prev) => (prev === index ? null : index));
  }

  function handleSubmitTurn(turn: Turn) {
    if (!target) {
      onAddTurn(turn);
      return;
    }
    if (target.kind === 'edit') onUpdateTurn(target.index, turn);
    else onInsertTurn(target.index, turn);
    clearTurnSelection();
  }

  function handleConfirmDelete() {
    if (deleteIndex === null) return;
    onRemoveTurn(deleteIndex);
    setDeleteIndex(null);
    clearTurnSelection();
  }

  return (
    <section className="kyoku-editor">
      {isEditingExisting && (
        <div className="kyoku-editor__editing-banner">
          <span>既存の局を編集中</span>
        </div>
      )}
      <div className="kyoku-editor__header">
        <button type="button" className="kyoku-editor__game-info" onClick={() => setGameInfoEditorOpen(true)}>
          {formatGameInfo(kyoku.gameInfo)}
        </button>
        <input
          className="kyoku-editor__name"
          type="text"
          placeholder="局名"
          value={kyoku.name}
          onChange={(e) => onChangeName(e.target.value)}
        />
      </div>
      {gameInfoEditorOpen && (
        <GameInfoEditor
          value={kyoku.gameInfo}
          onChange={onChangeGameInfo}
          onClose={() => setGameInfoEditorOpen(false)}
        />
      )}

      <div className="kyoku-editor__dora">
        <span className="kyoku-editor__dora-label">ドラ表示牌</span>
        {kyoku.doraIndicators.map((tile, i) => (
          <button key={`${tile}-${i}`} type="button" className="tile-chip" onClick={() => onRemoveDoraIndicator(i)}>
            <TileGlyph tile={tile} />
            <span className="tile-chip__remove" aria-hidden="true">
              ×
            </span>
          </button>
        ))}
        <button type="button" className="tile-chip-add" onClick={() => setDoraPickerOpen((v) => !v)}>
          ＋
        </button>
      </div>
      {doraPickerOpen && (
        <TileSelectModal title="ドラ表示牌を選ぶ" onSelect={onAddDoraIndicator} onClose={() => setDoraPickerOpen(false)} />
      )}

      <div className="kyoku-editor__haipai-header">
        <span className="kyoku-editor__haipai-label">配牌</span>
        <button type="button" className="haipai-edit-open" onClick={() => setHaipaiEditorOpen(true)}>
          編集
        </button>
      </div>
      <HaipaiRow haipai={kyoku.haipai} />
      {haipaiEditorOpen && (
        <HaipaiEditor
          haipai={kyoku.haipai}
          onAdd={onAddHaipaiTile}
          onRemove={onRemoveHaipaiTile}
          onClose={() => setHaipaiEditorOpen(false)}
        />
      )}

      <div className="kyoku-editor__river-header">
        <h3>この局の記録</h3>
        <div className="kyoku-editor__view-options">
          <div className="tile-size-picker">
            <span className="tile-size-picker__label">牌の表示サイズ</span>
            {TILE_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={tileSize === opt.value ? 'active' : ''}
                onClick={() => onChangeTileSize(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label className="kyoku-editor__show-hand">
            <input type="checkbox" checked={showHand} onChange={(e) => onChangeShowHand(e.target.checked)} />
            手牌表示
          </label>
        </div>
      </div>
      {showHand && !Hand.canTrack(kyoku.haipai) && (
        <p className="kyoku-editor__hand-hint">配牌（13枚）を入力すると手牌を表示します</p>
      )}
      <RiverView
        turns={kyoku.turns}
        selectedIndex={selectedIndex}
        insertIndex={target?.kind === 'insert' ? target.index : null}
        onSelect={toggleTurnSelection}
        onEdit={(i) => setTarget({ kind: 'edit', index: i })}
        onInsertBefore={(i) => {
          setSelectedIndex(null);
          setTarget({ kind: 'insert', index: i });
        }}
        onDelete={setDeleteIndex}
        onClearSelection={clearTurnSelection}
        handSteps={handSteps}
      />

      <div ref={turnEditorRef}>
        <TurnEditor
          // 対象が変わるたびに作り直し、入力欄をその手の内容(または空)で初期化する
          key={target ? `${target.kind}-${target.index}` : 'new'}
          onSubmit={handleSubmitTurn}
          initialTurn={target?.kind === 'edit' ? kyoku.turns[target.index] : undefined}
          heading={
            target ? (target.kind === 'edit' ? `✎ ${target.index + 1}手目を修正中` : `＋ ${target.index + 1}手目の前に挿入`) : undefined
          }
          submitLabel={target ? (target.kind === 'edit' ? '修正を確定' : '挿入する') : undefined}
          onCancel={target ? clearTurnSelection : undefined}
          handBefore={handBeforeInput}
        />
      </div>

      {deleteIndex !== null && kyoku.turns[deleteIndex] && (
        <ConfirmDialog
          message={
            <>
              <p>{deleteIndex + 1}手目を削除しますか？</p>
              <div className="confirm-dialog__preview">
                <TurnRow turn={kyoku.turns[deleteIndex]} index={deleteIndex} rinshan={isRinshan(kyoku.turns, deleteIndex)} />
              </div>
              {deleteIndex < kyoku.turns.length - 1 && <p>以降の手は1つずつ繰り上がります。</p>}
            </>
          }
          confirmLabel="削除する"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteIndex(null)}
        />
      )}

      <div className="kyoku-editor__memo">
        <label htmlFor="result-memo">結果メモ（任意）</label>
        <textarea
          id="result-memo"
          value={kyoku.resultMemo}
          onChange={(e) => onChangeMemo(e.target.value)}
          rows={2}
        />
      </div>
    </section>
  );
}
