import { TilePicker } from './TilePicker';
import type { Tile } from '../types';

interface TileSelectModalProps {
  title: string;
  onSelect: (tile: Tile) => void;
  onClose: () => void;
  /** trueの場合、牌をタップしても閉じずに連続選択できる(配牌など複数枚選ぶ場合用) */
  keepOpenOnSelect?: boolean;
}

/** 牌選択グリッドをオーバーレイ表示する汎用モーダル。牌をタップすると選択して即座に閉じる */
export function TileSelectModal({ title, onSelect, onClose, keepOpenOnSelect = false }: TileSelectModalProps) {
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
            if (!keepOpenOnSelect) onClose();
          }}
        />
      </div>
    </div>
  );
}
