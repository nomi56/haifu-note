import { useState } from 'react';
import { RiverView } from './RiverView';
import { TileGlyph } from './TileGlyph';
import { TilePicker } from './TilePicker';
import { TurnEditor } from './TurnEditor';
import type { Kyoku, Tile, Turn } from '../types';

interface KyokuEditorProps {
  kyoku: Kyoku;
  onChangeName: (name: string) => void;
  onChangeMemo: (memo: string) => void;
  onAddDoraIndicator: (tile: Tile) => void;
  onRemoveDoraIndicator: (index: number) => void;
  onAddTurn: (turn: Turn) => void;
  onRemoveLastTurn: () => void;
  onConfirm: () => void;
}

export function KyokuEditor({
  kyoku,
  onChangeName,
  onChangeMemo,
  onAddDoraIndicator,
  onRemoveDoraIndicator,
  onAddTurn,
  onRemoveLastTurn,
  onConfirm,
}: KyokuEditorProps) {
  const [doraPickerOpen, setDoraPickerOpen] = useState(false);

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

      <div className="kyoku-editor__dora">
        <span className="kyoku-editor__dora-label">ドラ表示牌</span>
        {kyoku.doraIndicators.map((tile, i) => (
          <button key={`${tile}-${i}`} type="button" className="dora-chip" onClick={() => onRemoveDoraIndicator(i)}>
            <TileGlyph tile={tile} /> ×
          </button>
        ))}
        <button type="button" className="dora-add" onClick={() => setDoraPickerOpen((v) => !v)}>
          ＋
        </button>
      </div>
      {doraPickerOpen && (
        <TilePicker
          value={null}
          onSelect={(tile) => {
            onAddDoraIndicator(tile);
            setDoraPickerOpen(false);
          }}
        />
      )}

      <h3>牌譜</h3>
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
