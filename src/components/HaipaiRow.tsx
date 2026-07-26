import { TileGlyph } from './TileGlyph';
import { tileSortKey } from '../tiles';
import type { Tile } from '../types';

interface HaipaiRowProps {
  haipai: Tile[];
  /** 指定すると各牌がタップ可能になり、タップした牌の元配列インデックスを受け取る（配牌編集用） */
  onTapTile?: (index: number) => void;
}

/** 配牌を13枠固定で表示する。未入力の枠は？で仮表示する */
export function HaipaiRow({ haipai, onTapTile }: HaipaiRowProps) {
  const sorted = haipai
    .map((tile, index) => ({ tile, index }))
    .sort((a, b) => tileSortKey(a.tile) - tileSortKey(b.tile));
  const emptyCount = Math.max(0, 13 - haipai.length);

  return (
    <div className="haipai-tiles">
      {sorted.map(({ tile, index }) =>
        onTapTile ? (
          <button key={index} type="button" className="haipai-tile" onClick={() => onTapTile(index)}>
            <TileGlyph tile={tile} />
          </button>
        ) : (
          <span key={index} className="haipai-tile">
            <TileGlyph tile={tile} />
          </span>
        ),
      )}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <span key={`empty-${i}`} className="haipai-tile">
          <span className="haipai-tile__empty-mark">？</span>
        </span>
      ))}
    </div>
  );
}
