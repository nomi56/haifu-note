// MPSZ表記の牌: "1m"-"9m","1p"-"9p","1s"-"9s" (0m/0p/0s=赤5), "1z"-"7z"(字牌)
export type Tile = string;

export type Suit = 'm' | 'p' | 's' | 'z';

// 牌譜の記録行に表示する牌のサイズ
export type TileSize = 'small' | 'medium' | 'large';

// kan: 大明槓(他家の捨て牌からの明カン), kakan: 加槓(既存のポンに自分のツモ牌を加える)
export type CallType = 'chi' | 'pon' | 'kan' | 'ankan' | 'kakan';

// 鳴いた牌がどの相手から出たか
export type CallSource = 'kamicha' | 'toimen' | 'shimocha';

// 和了の取り方。ツモは自摸、それ以外はロンした相手
export type AgariSource = 'tsumo' | CallSource;

export interface Agari {
  /** 和了牌(ツモならツモった牌、ロンなら和了した相手の捨て牌) */
  tile: Tile;
  source: AgariSource;
}

export interface Call {
  type: CallType;
  /** 暗カン/加カンは相手からの牌ではないため未設定 */
  from?: CallSource;
  /**
   * 面子を構成する牌すべて(チー/ポンは3枚、カンは4枚)。
   * 暗カン以外はtiles[0]が鳴いた牌(相手から取った牌)を表す
   */
  tiles: Tile[];
}

export interface Turn {
  /** 自摸で引いた牌。鳴きの場合は未設定 */
  draw?: Tile;
  /** チー/ポン/カンで鳴いた場合の情報。自摸の場合は未設定 */
  call?: Call;
  /** カン/暗カンの直後はリンシャンツモに続くため、この局面では打牌は発生しない */
  discard?: Tile;
  riichi: boolean;
  /**
   * 空切り: ツモった牌と同じ種類の牌を、ツモ切りに見せかけて手牌側から切ったこと。
   * draw === discard の場合のみ意味を持つ
   */
  karagiri: boolean;
  /** 和了の場合の情報。和了牌と取り方(ツモ/ロン)を持ち、この手には打牌が続かない */
  agari?: Agari;
}

// 場風・自風の風
export type Wind = 'east' | 'south' | 'west' | 'north';

export interface GameInfo {
  /** 何試合目(半荘/東風戦などの回数) */
  gameNumber: number;
  /** 場風。東1局なら'east' */
  roundWind: Wind;
  /** 局数。東1局なら1 */
  roundNumber: number;
  /** 本場 */
  honba: number;
  /** 記録者自身の座席 */
  seat: Wind;
}

export interface Kyoku {
  /** 局を一意に識別するID。将来の参照(他データとの紐付けなど)用に保持する */
  id: string;
  /** 局名。例: "東1局0本場" */
  name: string;
  /** 場の情報(何試合目/場風/局数/本場/自分の座席)。未入力の場合は未設定 */
  gameInfo?: GameInfo;
  /** 配牌（最初の摸打を記録する前の手牌） */
  haipai: Tile[];
  /** ドラ表示牌（カンドラ含め複数可） */
  doraIndicators: Tile[];
  turns: Turn[];
  resultMemo: string;
  confirmedAt: string;
}

export interface KifuSession {
  version: 1;
  title: string;
  createdAt: string;
  updatedAt: string;
  kyokus: Kyoku[];
}
