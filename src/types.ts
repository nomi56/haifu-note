// MPSZ表記の牌: "1m"-"9m","1p"-"9p","1s"-"9s" (0m/0p/0s=赤5), "1z"-"7z"(字牌)
export type Tile = string;

export type Suit = 'm' | 'p' | 's' | 'z';

// 牌譜の記録行に表示する牌のサイズ
export type TileSize = 'small' | 'medium' | 'large';

export type CallType = 'chi' | 'pon' | 'kan';

// 鳴いた牌がどの相手から出たか
export type CallSource = 'kamicha' | 'toimen' | 'shimocha';

export interface Call {
  type: CallType;
  from: CallSource;
  tiles: Tile[];
}

export interface Turn {
  /** 自摸で引いた牌。鳴きの場合は未設定 */
  draw?: Tile;
  /** チー/ポン/カンで鳴いた場合の情報。自摸の場合は未設定 */
  call?: Call;
  discard: Tile;
  riichi: boolean;
}

export interface Kyoku {
  /** 局名。例: "東1局0本場" */
  name: string;
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
