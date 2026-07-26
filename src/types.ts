// MPSZ表記の牌: "1m"-"9m","1p"-"9p","1s"-"9s" (0m/0p/0s=赤5), "1z"-"7z"(字牌)
export type Tile = string;

export type Suit = 'm' | 'p' | 's' | 'z';

// 牌譜の記録行に表示する牌のサイズ
export type TileSize = 'small' | 'medium' | 'large';

export type CallType = 'chi' | 'pon' | 'kan' | 'ankan';

// 鳴いた牌がどの相手から出たか
export type CallSource = 'kamicha' | 'toimen' | 'shimocha';

export interface Call {
  type: CallType;
  /** 暗カンは自分の手牌から行うため未設定 */
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
}

export interface Kyoku {
  /** 局を一意に識別するID。将来の参照(他データとの紐付けなど)用に保持する */
  id: string;
  /** 局名。例: "東1局0本場" */
  name: string;
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
