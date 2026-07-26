import { TileGlyph } from './TileGlyph';
import { TileMeld } from './TileMeld';
import { CALL_SOURCE_LABEL_MAP, CALL_TYPE_LABEL, callDisplayTiles, isTsumogiri } from '../tiles';
import type { Turn } from '../types';

interface TurnRowProps {
  turn: Turn;
  index: number;
  rinshan: boolean;
}

export function TurnRow({ turn, index, rinshan }: TurnRowProps) {
  const tsumogiri = isTsumogiri(turn);

  return (
    <div className="turn-row">
      <span className="turn-row__index">{index + 1}</span>
      {turn.call ? (
        <span
          className="turn-row__call"
          title={`${CALL_TYPE_LABEL[turn.call.type]}${turn.call.from ? ` ${CALL_SOURCE_LABEL_MAP[turn.call.from]}から` : ''}`}
        >
          {CALL_TYPE_LABEL[turn.call.type]}
          {turn.call.from && <span className="turn-row__call-source">{CALL_SOURCE_LABEL_MAP[turn.call.from]}</span>}
          <TileMeld tiles={callDisplayTiles(turn.call)} />
        </span>
      ) : (
        <span className="turn-row__draw">
          {rinshan && <span className="turn-row__rinshan-badge">リンシャン</span>}
          {turn.draw ? <TileGlyph tile={turn.draw} className="tile-emoji" /> : '?'}
        </span>
      )}
      {turn.discard ? (
        <>
          <span className="turn-row__arrow">→</span>
          <span className={`turn-row__discard${turn.riichi ? ' turn-row__discard--riichi' : ''}`}>
            <TileGlyph tile={turn.discard} className="tile-emoji" />
          </span>
          <span className={`turn-row__label${tsumogiri ? ' turn-row__label--tsumogiri' : ''}`}>
            {turn.karagiri ? '空切り' : tsumogiri ? 'ツモ切り' : '手出し'}
          </span>
          {turn.riichi && <span className="turn-row__riichi-badge">リーチ</span>}
        </>
      ) : (
        <span className="turn-row__label">リンシャンツモへ続く</span>
      )}
    </div>
  );
}
