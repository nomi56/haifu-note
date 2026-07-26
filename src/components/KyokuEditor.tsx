import { useState } from 'react';
import { GameInfoEditor } from './GameInfoEditor';
import { HaipaiEditor } from './HaipaiEditor';
import { HaipaiRow } from './HaipaiRow';
import { RiverView } from './RiverView';
import { TileGlyph } from './TileGlyph';
import { TileSelectModal } from './TileSelectModal';
import { TurnEditor } from './TurnEditor';
import { DEFAULT_GAME_INFO, formatGameInfo } from '../gameInfo';
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
  onRemoveLastTurn: () => void;
  tileSize: TileSize;
  onChangeTileSize: (size: TileSize) => void;
}

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
  onRemoveLastTurn,
  tileSize,
  onChangeTileSize,
}: KyokuEditorProps) {
  const [haipaiEditorOpen, setHaipaiEditorOpen] = useState(false);
  const [doraPickerOpen, setDoraPickerOpen] = useState(false);
  const [gameInfoEditorOpen, setGameInfoEditorOpen] = useState(false);

  function openGameInfoEditor() {
    if (!kyoku.gameInfo) onChangeGameInfo(DEFAULT_GAME_INFO);
    setGameInfoEditorOpen(true);
  }

  return (
    <section className="kyoku-editor">
      {isEditingExisting && (
        <div className="kyoku-editor__editing-banner">
          <span>既存の局を編集中</span>
        </div>
      )}
      <div className="kyoku-editor__header">
        <input
          className="kyoku-editor__name"
          type="text"
          placeholder="局名"
          value={kyoku.name}
          onChange={(e) => onChangeName(e.target.value)}
        />
      </div>

      <button type="button" className="kyoku-editor__game-info" onClick={openGameInfoEditor}>
        {kyoku.gameInfo ? formatGameInfo(kyoku.gameInfo) : '場の情報未設定'}
      </button>
      {gameInfoEditorOpen && kyoku.gameInfo && (
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
      </div>
      <RiverView turns={kyoku.turns} />
      {kyoku.turns.length > 0 && (
        <button type="button" className="kyoku-editor__undo" onClick={onRemoveLastTurn}>
          最後の1手を取り消す
        </button>
      )}

      <TurnEditor onAdd={onAddTurn} />

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
