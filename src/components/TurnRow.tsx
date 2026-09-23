import { TileGlyph } from './TileGlyph';
import { TileMeld } from './TileMeld';
import { AGARI_SOURCE_LABEL_MAP, CALL_SOURCE_LABEL_MAP, CALL_TYPE_LABEL, callDisplayTiles, isTsumogiri } from '../tiles';
import type { HandStep } from '../hand';
import type { Turn } from '../types';

interface TurnRowProps {
  turn: Turn;
  index: number;
  rinshan: boolean;
  selected?: boolean;
  /** 設定されている場合のみ行をタップ可能にする(表示専用の用途では未設定) */
  onSelect?: () => void;
  /** この手の直後の手牌。指定すると行の下に手牌を表示し、不整合があればバッジを出す */
  handStep?: HandStep;
}

export function TurnRow({ turn, index, rinshan, selected = false, onSelect, handStep }: TurnRowProps) {
  const tsumogiri = isTsumogiri(turn);
  const className = `turn-row${onSelect ? ' turn-row--selectable' : ''}${selected ? ' turn-row--selected' : ''}`;

  return (
    <div
      className={className}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
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
      ) : turn.agari ? (
        <span className="turn-row__draw">
          {rinshan && <span className="turn-row__rinshan-badge">リンシャン</span>}
          <span className="turn-row__agari-badge">和了</span>
          <TileGlyph tile={turn.agari.tile} className="tile-emoji" />
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
      ) : turn.agari ? (
        <span className="turn-row__label">{AGARI_SOURCE_LABEL_MAP[turn.agari.source]}</span>
      ) : (
        <span className="turn-row__label">リンシャンツモへ続く</span>
      )}
      {handStep && handStep.issues.length > 0 && <span className="turn-row__issue-badge">不整合</span>}
      {handStep && <div className="turn-row__hand">{handStep.hand.renderHistory(handStep)}</div>}
    </div>
  );
}
