import { isRedFive, tileEmoji, tileLabel } from '../tiles';
import type { Tile } from '../types';

interface TileGlyphProps {
  tile: Tile;
  className?: string;
}

/** 牌の絵文字表示。赤5は文字色を赤くして強調する */
export function TileGlyph({ tile, className }: TileGlyphProps) {
  const classes = ['tile-glyph', isRedFive(tile) ? 'tile-glyph--red' : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes} title={tileLabel(tile)}>
      {tileEmoji(tile)}
    </span>
  );
}
