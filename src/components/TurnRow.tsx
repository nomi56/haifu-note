import { TileGlyph } from './TileGlyph';
import { CALL_SOURCE_LABEL_MAP, CALL_TYPE_LABEL, isTsumogiri } from '../tiles';
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
          <TileGlyph tile={turn.call.tiles[0]} className="tile-emoji" />
        </span>
      ) : (
        <span className="turn-row__draw">{turn.draw ? <TileGlyph tile={turn.draw} className="tile-emoji" /> : '?'}</span>
      )}
      <span className="turn-row__arrow">→</span>
      <span className={`turn-row__discard${turn.riichi ? ' turn-row__discard--riichi' : ''}`}>
        <TileGlyph tile={turn.discard} className="tile-emoji" />
      </span>
      <span className={`turn-row__label${tsumogiri ? ' turn-row__label--tsumogiri' : ''}`}>
        {tsumogiri ? 'ツモ切り' : '手出し'}
      </span>
      {turn.riichi && <span className="turn-row__riichi-badge">リーチ</span>}
    </div>
  );
}
