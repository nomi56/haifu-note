import { TileGlyph } from './TileGlyph';
import type { Tile } from '../types';

interface TileMeldProps {
  tiles: { tile: Tile; rotated: boolean }[];
  className?: string;
}

/** 面子を実際の形（鳴いた牌は回転）で並べて表示する */
export function TileMeld({ tiles, className }: TileMeldProps) {
  const classes = ['tile-meld', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {tiles.map(({ tile, rotated }, i) => (
        <TileGlyph key={i} tile={tile} className={`tile-emoji${rotated ? ' tile-emoji--rotated' : ''}`} />
      ))}
    </span>
  );
}
