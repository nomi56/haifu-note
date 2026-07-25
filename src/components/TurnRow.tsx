import { CALL_SOURCE_LABEL_MAP, CALL_TYPE_LABEL, isTsumogiri, tileEmoji, tileLabel } from '../tiles';
import type { Turn } from '../types';

interface TurnRowProps {
  turn: Turn;
  index: number;
}

export function TurnRow({ turn, index }: TurnRowProps) {
  const tsumogiri = isTsumogiri(turn);

  return (
    <div className="turn-row">
      <span className="turn-row__index">{index + 1}</span>
      {turn.call ? (
        <span className="turn-row__call" title={`${CALL_TYPE_LABEL[turn.call.type]} ${CALL_SOURCE_LABEL_MAP[turn.call.from]}から`}>
          {CALL_TYPE_LABEL[turn.call.type]}
          <span className="turn-row__call-source">{CALL_SOURCE_LABEL_MAP[turn.call.from]}</span>
          <span className="tile-emoji">{tileEmoji(turn.call.tiles[0])}</span>
        </span>
      ) : (
        <span className="turn-row__draw" title={tileLabel(turn.draw ?? '')}>
          <span className="tile-emoji">{turn.draw ? tileEmoji(turn.draw) : '?'}</span>
        </span>
      )}
      <span className="turn-row__arrow">→</span>
      <span
        className={`turn-row__discard${turn.riichi ? ' turn-row__discard--riichi' : ''}`}
        title={tileLabel(turn.discard)}
      >
        <span className="tile-emoji">{tileEmoji(turn.discard)}</span>
      </span>
      <span className={`turn-row__label${tsumogiri ? ' turn-row__label--tsumogiri' : ''}`}>
        {tsumogiri ? 'ツモ切り' : '手出し'}
      </span>
      {turn.riichi && <span className="turn-row__riichi-badge">リーチ</span>}
    </div>
  );
}
