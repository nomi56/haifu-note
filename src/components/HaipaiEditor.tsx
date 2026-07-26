import { HaipaiRow } from './HaipaiRow';
import { TilePicker } from './TilePicker';
import type { Tile } from '../types';

interface HaipaiEditorProps {
  haipai: Tile[];
  onAdd: (tile: Tile) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
}

/** 配牌編集専用のモーダル。プレビュー行の牌をタップすると削除、下の牌選択グリッドは表示したまま連続で追加できる */
export function HaipaiEditor({ haipai, onAdd, onRemove, onClose }: HaipaiEditorProps) {
  const full = haipai.length >= 13;

  return (
    <div className="tile-modal-backdrop" onClick={onClose}>
      <div className="tile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tile-modal__header">
          <span>配牌を編集（{haipai.length}/13枚）</span>
          <button type="button" className="tile-modal__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <HaipaiRow haipai={haipai} onTapTile={onRemove} />
        <p className="haipai-editor__hint">タップした牌を削除、下から牌をタップして追加</p>
        <TilePicker value={null} onSelect={(tile) => !full && onAdd(tile)} />
      </div>
    </div>
  );
}
