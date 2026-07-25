import { useState } from 'react';
import { TileGlyph } from './TileGlyph';
import { TileSelectModal } from './TileSelectModal';
import type { Tile } from '../types';

interface TileSelectFieldProps {
  value: Tile | null;
  onChange: (tile: Tile) => void;
  title: string;
}

/** 「未選択 / 選択した牌」＋「牌を選ぶ」ボタン。タップすると牌選択モーダルを開く汎用UI */
export function TileSelectField({ value, onChange, title }: TileSelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tile-select-field">
      {value ? (
        <TileGlyph tile={value} className="tile-select-field__preview" />
      ) : (
        <span className="tile-select-field__empty">未選択</span>
      )}
      <button type="button" onClick={() => setOpen(true)}>
        牌を選ぶ
      </button>
      {open && <TileSelectModal title={title} onSelect={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}
