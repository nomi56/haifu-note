import { TilePicker } from './TilePicker';
import type { Tile } from '../types';

interface TileSelectModalProps {
  title: string;
  onSelect: (tile: Tile) => void;
  onClose: () => void;
}

/** 牌選択グリッドをオーバーレイ表示する汎用モーダル。牌をタップすると選択して即座に閉じる */
export function TileSelectModal({ title, onSelect, onClose }: TileSelectModalProps) {
  return (
    <div className="tile-modal-backdrop" onClick={onClose}>
      <div className="tile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tile-modal__header">
          <span>{title}</span>
          <button type="button" className="tile-modal__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <TilePicker
          value={null}
          onSelect={(tile) => {
            onSelect(tile);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
