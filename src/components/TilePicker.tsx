import { TileGlyph } from './TileGlyph';
import { HONOR_TILES, MAN_ROW, PIN_ROW, SOU_ROW } from '../tiles';
import type { Tile } from '../types';

interface TilePickerProps {
  value: Tile | null;
  onSelect: (tile: Tile) => void;
}

function TileButton({ tile, selected, onSelect }: { tile: Tile; selected: boolean; onSelect: (tile: Tile) => void }) {
  return (
    <button
      type="button"
      className={`tile-btn${selected ? ' tile-btn--selected' : ''}`}
      onClick={() => onSelect(tile)}
    >
      <TileGlyph tile={tile} />
    </button>
  );
}

export function TilePicker({ value, onSelect }: TilePickerProps) {
  return (
    <div className="tile-picker">
      <div className="tile-picker__row">
        {MAN_ROW.map((t) => (
          <TileButton key={t.tile} tile={t.tile} selected={value === t.tile} onSelect={onSelect} />
        ))}
      </div>
      <div className="tile-picker__row">
        {PIN_ROW.map((t) => (
          <TileButton key={t.tile} tile={t.tile} selected={value === t.tile} onSelect={onSelect} />
        ))}
      </div>
      <div className="tile-picker__row">
        {SOU_ROW.map((t) => (
          <TileButton key={t.tile} tile={t.tile} selected={value === t.tile} onSelect={onSelect} />
        ))}
      </div>
      <div className="tile-picker__row">
        {HONOR_TILES.map((t) => (
          <TileButton key={t.tile} tile={t.tile} selected={value === t.tile} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
