import { TileGlyph } from './TileGlyph';
import type { Kyoku } from '../types';

interface SessionHistoryProps {
  kyokus: Kyoku[];
  editingId: string;
  onSelect: (kyoku: Kyoku) => void;
}

function HistoryItem({ kyoku, active, onSelect }: { kyoku: Kyoku; active: boolean; onSelect: (kyoku: Kyoku) => void }) {
  return (
    <div className={`history-item${active ? ' history-item--active' : ''}`}>
      <button type="button" className="history-item__header" onClick={() => onSelect(kyoku)}>
        <span className="history-item__name">{kyoku.name || '(無題の局)'}</span>
        <span className="history-item__dora">
          {kyoku.doraIndicators.map((t, i) => (
            <TileGlyph key={i} tile={t} />
          ))}
        </span>
        <span className="history-item__count">{kyoku.turns.length}手</span>
      </button>
    </div>
  );
}

export function SessionHistory({ kyokus, editingId, onSelect }: SessionHistoryProps) {
  if (kyokus.length === 0) {
    return <p className="session-history__empty">確定済みの局はまだありません</p>;
  }
  return (
    <div className="session-history">
      {[...kyokus].reverse().map((k) => (
        <HistoryItem key={k.id} kyoku={k} active={k.id === editingId} onSelect={onSelect} />
      ))}
    </div>
  );
}
