import { Fragment } from 'react';
import { TurnRow } from './TurnRow';
import type { HandStep } from '../hand';
import { isRinshan } from '../tiles';
import type { Turn } from '../types';

interface RiverViewProps {
  turns: Turn[];
  emptyText?: string;
  /** 選択中の手。操作バーはこの手の直後に表示する */
  selectedIndex?: number | null;
  /** 挿入先。この手の直前に「ここに挿入」の目印を表示する */
  insertIndex?: number | null;
  /** 設定されている場合のみ、各行をタップして選択できる */
  onSelect?: (index: number) => void;
  onEdit?: (index: number) => void;
  onInsertBefore?: (index: number) => void;
  onDelete?: (index: number) => void;
  onClearSelection?: () => void;
  /** 各手の直後の手牌。指定すると各行の下に手牌を表示する */
  handSteps?: HandStep[] | null;
}

export function RiverView({
  turns,
  emptyText = 'まだ牌譜がありません',
  selectedIndex = null,
  insertIndex = null,
  onSelect,
  onEdit,
  onInsertBefore,
  onDelete,
  onClearSelection,
  handSteps = null,
}: RiverViewProps) {
  if (turns.length === 0) {
    return <p className="river-view__empty">{emptyText}</p>;
  }
  return (
    <div className="river-view">
      {turns.map((turn, i) => (
        <Fragment key={i}>
          {insertIndex === i && <div className="river-view__insert-marker">ここに挿入</div>}
          <TurnRow
            turn={turn}
            index={i}
            rinshan={isRinshan(turns, i)}
            selected={selectedIndex === i}
            handStep={handSteps?.[i]}
            onSelect={onSelect ? () => onSelect(i) : undefined}
          />
          {selectedIndex === i && insertIndex === null && (onEdit || onInsertBefore || onDelete) && (
            <div className="turn-row-actions">
              {onEdit && (
                <button type="button" onClick={() => onEdit(i)}>
                  ✎ 修正
                </button>
              )}
              {onInsertBefore && (
                <button type="button" onClick={() => onInsertBefore(i)}>
                  ＋ この前に挿入
                </button>
              )}
              {onDelete && (
                <button type="button" className="turn-row-actions__delete" onClick={() => onDelete(i)}>
                  🗑 削除
                </button>
              )}
              {onClearSelection && (
                <button
                  type="button"
                  className="turn-row-actions__close"
                  onClick={onClearSelection}
                  aria-label="選択を解除"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
