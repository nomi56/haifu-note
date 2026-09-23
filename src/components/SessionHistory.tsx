import { useState } from 'react';
import { TileGlyph } from './TileGlyph';
import { advanceToNextKyoku, formatGameInfo, renchan, ryukyokuOyanagare } from '../gameInfo';
import type { GameInfo, Kyoku } from '../types';

interface SessionHistoryProps {
  kyokus: Kyoku[];
  editingId: string;
  onSelect: (kyoku: Kyoku) => void;
  /** 新しい局の場の情報を計算する基準(現在表示中の局の場の情報) */
  baseGameInfo: GameInfo;
  onAddNew: (gameInfo: GameInfo) => void;
}

function HistoryItem({ kyoku, active, onSelect }: { kyoku: Kyoku; active: boolean; onSelect: (kyoku: Kyoku) => void }) {
  return (
    <div className={`history-item${active ? ' history-item--active' : ''}`}>
      <button type="button" className="history-item__header" onClick={() => onSelect(kyoku)}>
        <div className="history-item__row">
          <span className="history-item__game-info">{formatGameInfo(kyoku.gameInfo)}</span>
          <span className="history-item__dora">
            {kyoku.doraIndicators.map((t, i) => (
              <TileGlyph key={i} tile={t} />
            ))}
          </span>
          <span className="history-item__count">{kyoku.turns.length}手</span>
        </div>
        {kyoku.name && <span className="history-item__name">{kyoku.name}</span>}
      </button>
    </div>
  );
}

export function SessionHistory({ kyokus, editingId, onSelect, baseGameInfo, onAddNew }: SessionHistoryProps) {
  const [choosing, setChoosing] = useState(false);
  // 親が流れる(次の局)か、親が続投する(連荘)か、流局で親が流れる(本場は積む)かで
  // 場の情報の進め方が異なるため、追加時に選ばせる
  const options = [
    { label: '次の局へ', gameInfo: advanceToNextKyoku(baseGameInfo) },
    { label: '連荘', gameInfo: renchan(baseGameInfo) },
    { label: '流局（親流れ）', gameInfo: ryukyokuOyanagare(baseGameInfo) },
  ];

  function handleChoose(gameInfo: GameInfo) {
    setChoosing(false);
    onAddNew(gameInfo);
  }

  return (
    <div className="session-history">
      {kyokus.length === 0 ? (
        <p className="session-history__empty">確定済みの局はまだありません</p>
      ) : (
        kyokus.map((k) => <HistoryItem key={k.id} kyoku={k} active={k.id === editingId} onSelect={onSelect} />)
      )}
      {choosing ? (
        <div className="session-history__add-choices">
          {options.map((o) => (
            <button key={o.label} type="button" onClick={() => handleChoose(o.gameInfo)}>
              <span className="session-history__add-choice-label">{o.label}</span>
              <span className="session-history__add-choice-info">{formatGameInfo(o.gameInfo)}</span>
            </button>
          ))}
          <button type="button" className="session-history__add-cancel" onClick={() => setChoosing(false)}>
            キャンセル
          </button>
        </div>
      ) : (
        <button type="button" className="session-history__add" onClick={() => setChoosing(true)}>
          ＋ 新しい局を追加
        </button>
      )}
    </div>
  );
}
