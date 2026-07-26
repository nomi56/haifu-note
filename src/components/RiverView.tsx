import { TurnRow } from './TurnRow';
import { isRinshan } from '../tiles';
import type { Turn } from '../types';

interface RiverViewProps {
  turns: Turn[];
  emptyText?: string;
}

export function RiverView({ turns, emptyText = 'まだ牌譜がありません' }: RiverViewProps) {
  if (turns.length === 0) {
    return <p className="river-view__empty">{emptyText}</p>;
  }
  return (
    <div className="river-view">
      {turns.map((turn, i) => (
        <TurnRow key={i} turn={turn} index={i} rinshan={isRinshan(turns, i)} />
      ))}
    </div>
  );
}
