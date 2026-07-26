import { TileGlyph } from './TileGlyph';
import { formatGameInfo } from '../gameInfo';
import type { Kyoku } from '../types';

interface SessionHistoryProps {
  kyokus: Kyoku[];
  editingId: string;
  onSelect: (kyoku: Kyoku) => void;
  onAddNew: () => void;
}

function HistoryItem({ kyoku, active, onSelect }: { kyoku: Kyoku; active: boolean; onSelect: (kyoku: Kyoku) => void }) {
  return (
    <div className={`history-item${active ? ' history-item--active' : ''}`}>
      <button type="button" className="history-item__header" onClick={() => onSelect(kyoku)}>
        <div className="history-item__row">
          <span className="history-item__name">{kyoku.name || '(無題の局)'}</span>
          <span className="history-item__dora">
            {kyoku.doraIndicators.map((t, i) => (
              <TileGlyph key={i} tile={t} />
            ))}
          </span>
          <span className="history-item__count">{kyoku.turns.length}手</span>
        </div>
        <span className="history-item__game-info">{formatGameInfo(kyoku.gameInfo)}</span>
      </button>
    </div>
  );
}

export function SessionHistory({ kyokus, editingId, onSelect, onAddNew }: SessionHistoryProps) {
  return (
    <div className="session-history">
      {kyokus.length === 0 ? (
        <p className="session-history__empty">確定済みの局はまだありません</p>
      ) : (
        kyokus.map((k) => <HistoryItem key={k.id} kyoku={k} active={k.id === editingId} onSelect={onSelect} />)
      )}
      <button type="button" className="session-history__add" onClick={onAddNew}>
        ＋ 新しい局を追加
      </button>
    </div>
  );
}
