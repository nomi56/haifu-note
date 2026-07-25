import { isRedFive, tileEmoji, tileLabel, tileSuit } from '../tiles';
import type { Tile } from '../types';

interface TileGlyphProps {
  tile: Tile;
  className?: string;
}

/** 牌の絵文字表示。スート別に文字色を分け、赤5はさらに赤くして強調する */
export function TileGlyph({ tile, className }: TileGlyphProps) {
  const classes = [
    'tile-glyph',
    `tile-glyph--${tileSuit(tile) ?? 'z'}`,
    isRedFive(tile) ? 'tile-glyph--red' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} title={tileLabel(tile)}>
      {tileEmoji(tile)}
    </span>
  );
}
