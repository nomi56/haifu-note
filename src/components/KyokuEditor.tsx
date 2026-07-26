import { useState } from 'react';
import { RiverView } from './RiverView';
import { TileGlyph } from './TileGlyph';
import { TileSelectModal } from './TileSelectModal';
import { TurnEditor } from './TurnEditor';
import { tileSortKey } from '../tiles';
import type { Kyoku, Tile, TileSize, Turn } from '../types';

interface KyokuEditorProps {
  kyoku: Kyoku;
  onChangeName: (name: string) => void;
  onChangeMemo: (memo: string) => void;
  onAddHaipaiTile: (tile: Tile) => void;
  onRemoveHaipaiTile: (index: number) => void;
  onAddDoraIndicator: (tile: Tile) => void;
  onRemoveDoraIndicator: (index: number) => void;
  onAddTurn: (turn: Turn) => void;
  onRemoveLastTurn: () => void;
  onConfirm: () => void;
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
  onChangeName,
  onChangeMemo,
  onAddHaipaiTile,
  onRemoveHaipaiTile,
  onAddDoraIndicator,
  onRemoveDoraIndicator,
  onAddTurn,
  onRemoveLastTurn,
  onConfirm,
  tileSize,
  onChangeTileSize,
}: KyokuEditorProps) {
  const [haipaiPickerOpen, setHaipaiPickerOpen] = useState(false);
  const [haipaiEditMode, setHaipaiEditMode] = useState(false);
  const [doraPickerOpen, setDoraPickerOpen] = useState(false);
  const haipaiFull = kyoku.haipai.length >= 13;
  const sortedHaipai = kyoku.haipai
    .map((tile, index) => ({ tile, index }))
    .sort((a, b) => tileSortKey(a.tile) - tileSortKey(b.tile));

  return (
    <section className="kyoku-editor">
      <div className="kyoku-editor__header">
        <input
          className="kyoku-editor__name"
          type="text"
          placeholder="局名（例: 東1局0本場）"
          value={kyoku.name}
          onChange={(e) => onChangeName(e.target.value)}
        />
      </div>

      <div className="kyoku-editor__haipai-header">
        <span className="kyoku-editor__haipai-label">配牌（{kyoku.haipai.length}/13枚）</span>
        {haipaiEditMode ? (
          <button type="button" className="haipai-edit-done" onClick={() => setHaipaiEditMode(false)}>
            完了
          </button>
        ) : (
          <button
            type="button"
            className="tile-chip-add"
            disabled={haipaiFull}
            onClick={() => setHaipaiPickerOpen(true)}
          >
            ＋
          </button>
        )}
      </div>
      {kyoku.haipai.length > 0 && (
        <div
          className="haipai-tiles"
          onClick={() => {
            if (!haipaiEditMode) setHaipaiEditMode(true);
          }}
        >
          {sortedHaipai.map(({ tile, index }) => (
            <button
              key={index}
              type="button"
              className="haipai-tile"
              onClick={(e) => {
                if (!haipaiEditMode) return;
                e.stopPropagation();
                onRemoveHaipaiTile(index);
              }}
            >
              <TileGlyph tile={tile} />
              {haipaiEditMode && (
                <span className="tile-chip__remove" aria-hidden="true">
                  ×
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {haipaiPickerOpen && (
        <TileSelectModal
          title="配牌を選ぶ（続けてタップで複数選択、最大13枚）"
          onSelect={onAddHaipaiTile}
          onClose={() => setHaipaiPickerOpen(false)}
          keepOpenOnSelect
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

      <div className="kyoku-editor__river-header">
        <h3>牌譜</h3>
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

      <button type="button" className="kyoku-editor__confirm" disabled={kyoku.turns.length === 0} onClick={onConfirm}>
        この局を確定して履歴に追加
      </button>
    </section>
  );
}
