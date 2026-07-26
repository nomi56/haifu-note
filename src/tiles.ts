import type { Suit, Tile, Turn } from './types';

interface TileInfo {
  tile: Tile;
  emoji: string;
  label: string;
  suit: Suit;
  isRed: boolean;
}

const MAN_EMOJI = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'];
const PIN_EMOJI = ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];
const SOU_EMOJI = ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'];
// 1z-7z: 東南西北白發中
const HONOR_EMOJI = ['🀀', '🀁', '🀂', '🀃', '🀆', '🀅', '🀄'];
const HONOR_LABEL = ['東', '南', '西', '北', '白', '發', '中'];

function buildSuitTiles(suit: 'm' | 'p' | 's', emoji: string[]): TileInfo[] {
  const tiles: TileInfo[] = [];
  for (let n = 1; n <= 9; n++) {
    tiles.push({ tile: `${n}${suit}`, emoji: emoji[n - 1], label: `${n}${suit}`, suit, isRed: false });
  }
  return tiles;
}

function buildRedFive(suit: 'm' | 'p' | 's', emoji: string[]): TileInfo {
  return { tile: `0${suit}`, emoji: emoji[4], label: `0${suit}(赤5)`, suit, isRed: true };
}

export const MAN_TILES = buildSuitTiles('m', MAN_EMOJI);
export const PIN_TILES = buildSuitTiles('p', PIN_EMOJI);
export const SOU_TILES = buildSuitTiles('s', SOU_EMOJI);
export const RED_FIVES = [buildRedFive('m', MAN_EMOJI), buildRedFive('p', PIN_EMOJI), buildRedFive('s', SOU_EMOJI)];
export const HONOR_TILES: TileInfo[] = HONOR_EMOJI.map((emoji, i) => ({
  tile: `${i + 1}z`,
  emoji,
  label: HONOR_LABEL[i],
  suit: 'z',
  isRed: false,
}));

/** 赤5を末尾に追加した、牌選択グリッド表示用の並び */
function withRedFive(suitTiles: TileInfo[], red: TileInfo): TileInfo[] {
  return [...suitTiles, red];
}

export const MAN_ROW = withRedFive(MAN_TILES, RED_FIVES[0]);
export const PIN_ROW = withRedFive(PIN_TILES, RED_FIVES[1]);
export const SOU_ROW = withRedFive(SOU_TILES, RED_FIVES[2]);

export const ALL_TILES: TileInfo[] = [...MAN_TILES, ...PIN_TILES, ...SOU_TILES, ...RED_FIVES, ...HONOR_TILES];

const TILE_MAP = new Map(ALL_TILES.map((t) => [t.tile, t]));

export function getTileInfo(tile: Tile): TileInfo | undefined {
  return TILE_MAP.get(tile);
}

// 牌の絵文字はプラットフォームによって色付きの絵文字グリフとして描画され、
// CSSの`color`が効かず配色がテーマ（特にダークモード）に合わないことがあるため、
// 異体字セレクタ（VS15）を付与して常に文字色を指定できるテキスト表示に固定する
const TEXT_PRESENTATION = '︎';

export function tileEmoji(tile: Tile): string {
  return (getTileInfo(tile)?.emoji ?? '?') + TEXT_PRESENTATION;
}

export function tileLabel(tile: Tile): string {
  return getTileInfo(tile)?.label ?? tile;
}

export function isRedFive(tile: Tile): boolean {
  return getTileInfo(tile)?.isRed ?? false;
}

export function tileSuit(tile: Tile): Suit | undefined {
  return getTileInfo(tile)?.suit;
}

const SUIT_ORDER: Record<Suit, number> = { m: 0, p: 1, s: 2, z: 3 };

/** 配牌などを手牌順（スート→数字、赤5は5の直後）に並べるための比較キー */
export function tileSortKey(tile: Tile): number {
  const info = getTileInfo(tile);
  if (!info) return Number.MAX_SAFE_INTEGER;
  const number = info.isRed ? 5.5 : Number(tile[0]);
  return SUIT_ORDER[info.suit] * 100 + number;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => tileSortKey(a) - tileSortKey(b));
}

const TILE_PATTERN = /^(?:[1-9][mps]|0[mps]|[1-7]z)$/;

export function isValidTile(tile: string): boolean {
  return TILE_PATTERN.test(tile);
}

export const CALL_TYPE_LABEL: Record<string, string> = {
  chi: 'チー',
  pon: 'ポン',
  kan: 'カン',
  ankan: '暗カン',
};

export const CALL_SOURCE_LABEL_MAP: Record<string, string> = {
  kamicha: '上家',
  toimen: '対面',
  shimocha: '下家',
};

/**
 * 打牌が自摸切りに見えるかどうかを判定する（保存はせず都度算出する）。
 * 空切りは他家から見ればツモ切りと区別がつかないため、trueのまま扱う
 * (ラベル表示のみ「空切り」に差し替える)
 */
export function isTsumogiri(turn: Turn): boolean {
  if (turn.call) return false;
  return turn.draw !== undefined && turn.draw === turn.discard;
}

/** 直前の手がカン/暗カンで、この手が自摸なら、リンシャンツモとみなす（保存はせず都度算出する） */
export function isRinshan(turns: Turn[], index: number): boolean {
  const turn = turns[index];
  const prev = turns[index - 1];
  if (!prev?.call) return false;
  return (prev.call.type === 'kan' || prev.call.type === 'ankan') && !turn.call;
}
