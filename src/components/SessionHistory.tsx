import { useState } from 'react';
import { RiverView } from './RiverView';
import { TileGlyph } from './TileGlyph';
import { tileSortKey } from '../tiles';
import type { Kyoku } from '../types';

interface SessionHistoryProps {
  kyokus: Kyoku[];
}

function HistoryItem({ kyoku }: { kyoku: Kyoku }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="history-item">
      <button type="button" className="history-item__header" onClick={() => setOpen((v) => !v)}>
        <span className="history-item__toggle">{open ? '▾' : '▸'}</span>
        <span className="history-item__name">{kyoku.name || '(無題の局)'}</span>
        <span className="history-item__dora">
          {kyoku.doraIndicators.map((t, i) => (
            <TileGlyph key={i} tile={t} />
          ))}
        </span>
        <span className="history-item__count">{kyoku.turns.length}手</span>
      </button>
      {open && (
        <div className="history-item__body">
          {kyoku.haipai.length > 0 && (
            <div className="history-item__haipai">
              <span className="history-item__haipai-label">配牌</span>
              {[...kyoku.haipai]
                .sort((a, b) => tileSortKey(a) - tileSortKey(b))
                .map((t, i) => (
                  <TileGlyph key={i} tile={t} className="tile-emoji" />
                ))}
            </div>
          )}
          <RiverView turns={kyoku.turns} />
          {kyoku.resultMemo && <p className="history-item__memo">{kyoku.resultMemo}</p>}
        </div>
      )}
    </div>
  );
}

export function SessionHistory({ kyokus }: SessionHistoryProps) {
  if (kyokus.length === 0) {
    return <p className="session-history__empty">確定済みの局はまだありません</p>;
  }
  return (
    <div className="session-history">
      {[...kyokus].reverse().map((k) => (
        <HistoryItem key={k.id} kyoku={k} />
      ))}
    </div>
  );
}
