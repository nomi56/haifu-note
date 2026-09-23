import type { CSSProperties, ReactNode } from 'react';
import { TileGlyph } from './components/TileGlyph';
import { TileMeld } from './components/TileMeld';
import { callDisplayTiles, isRedFive, normalFive, sortTiles, tileLabel, tileSortKey } from './tiles';
import type { Call, Tile, Turn } from './types';

export interface HandIssue {
  message: string;
  /** 同じ不整合かどうかの判定用。一度生じると以降の手でも続く不整合を、生じた手でだけ報告するために使う */
  key: string;
}

/** 手牌が変わった内容。直前の状態(1手目は配牌)との多重集合の差 */
export interface HandDiff {
  added: Tile[];
  removed: Tile[];
}

export interface HandStep extends HandDiff {
  /** この手を打った直後の手牌 */
  hand: Hand;
  /** この手で新たに生じた、手順と手牌の不整合 */
  issues: HandIssue[];
}

const HAIPAI_SIZE = 13;
// 履歴の手牌の幅の見積もり(牌1枚の幅(約0.8em)を1としたときの幅)。CSSの値から求めたもの
// 手牌・和了牌・面子の間の隙間(gap: 0.25em)
const HISTORY_MELD_GAP_SLOTS = 0.3;
// 副露の前に追加で空ける間(margin-left: 0.5em)
const HISTORY_MELDS_LEAD_SLOTS = 0.6;
// 横向きの牌の左右の余白(margin: 0 0.04em 0 0.15em)
const ROTATED_TILE_EXTRA_SLOTS = 0.25;

/** 赤5と通常の5を入れ替えた牌(それ以外はnull)。副露に使う牌の代用に使う */
function fiveCounterpart(tile: Tile): Tile | null {
  if (isRedFive(tile)) return normalFive(tile);
  if (tile[0] === '5' && tile[1] !== 'z') return `0${tile[1]}`;
  return null;
}

function issue(message: string, key = message): HandIssue {
  return { message, key };
}

function missing(tile: Tile): HandIssue {
  return issue(`手牌に ${tileLabel(tile)} がない`);
}

/**
 * 手牌(門前の牌＋副露)の状態を保持し、牌の出し入れをすべてここのアクセサ経由で行う。
 * 記録した手順が手牌と合わない場合(持っていない牌を切った等)は、操作の戻り値やvalidateで不整合として返す。
 * 表示も担当するが、配牌と履歴の手牌では詰め方やサイズが異なるためrenderHaipai/renderHistoryで処理を分ける
 */
export class Hand {
  // 門前の牌。追加した順に保持する(配牌表示で元の並び順のindexを返すため)
  private concealed: Tile[];
  private melds: Call[];
  // 和了した手なら和了牌。表示で手牌と分けて右に置くため、どの牌で和了したかを保持する
  private agariTile: Tile | null = null;

  private constructor(concealed: Tile[], melds: Call[]) {
    this.concealed = concealed;
    this.melds = melds;
  }

  /** 配牌から手牌を作る。13枚未満でも作れるが、手順との照合はcanTrackを満たす場合のみ意味を持つ */
  static fromHaipai(haipai: Tile[]): Hand {
    return new Hand([...haipai], []);
  }

  /** 配牌が13枚そろっていて、手順から手牌を追跡できるか */
  static canTrack(haipai: Tile[]): boolean {
    return haipai.length === HAIPAI_SIZE;
  }

  clone(): Hand {
    const hand = new Hand([...this.concealed], this.melds.map((m) => ({ ...m, tiles: [...m.tiles] })));
    hand.agariTile = this.agariTile;
    return hand;
  }

  /** 門前の牌(手牌順) */
  get tiles(): readonly Tile[] {
    return sortTiles(this.concealed);
  }

  get meldList(): readonly Call[] {
    return this.melds;
  }

  /** 和了した手なら和了牌、そうでなければnull */
  get winningTile(): Tile | null {
    return this.agariTile;
  }

  count(tile: Tile): number {
    return this.concealed.filter((t) => t === tile).length;
  }

  has(tile: Tile): boolean {
    return this.concealed.includes(tile);
  }

  /** 1枚加える(ツモ・和了牌) */
  draw(tile: Tile): void {
    this.concealed.push(tile);
  }

  /** 1枚取り除く(打牌)。持っていなければ何もせず不整合を返す */
  discard(tile: Tile): HandIssue | null {
    return this.take(tile) ? null : missing(tile);
  }

  /**
   * 副露に使う牌を1枚取り除く。面子の牌は赤5を通常の5で埋めて記録されるため
   * (fillMeldTiles)、指定の牌が無ければ赤⇔通常の5で代用する
   */
  private takeForMeld(tile: Tile): HandIssue | null {
    if (this.take(tile)) return null;
    const counterpart = fiveCounterpart(tile);
    if (counterpart && this.take(counterpart)) return null;
    return missing(tile);
  }

  private take(tile: Tile): boolean {
    const i = this.concealed.indexOf(tile);
    if (i === -1) return false;
    this.concealed.splice(i, 1);
    return true;
  }

  /** チー/ポン/カン/暗カン/加カン。手牌から使った牌を取り除き、副露に加える */
  call(call: Call): HandIssue[] {
    const issues: HandIssue[] = [];
    const takeAll = (tiles: Tile[]) => {
      for (const t of tiles) {
        const found = this.takeForMeld(t);
        if (found) issues.push(found);
      }
    };
    switch (call.type) {
      case 'ankan':
        takeAll(call.tiles);
        this.melds.push(call);
        break;
      case 'kakan': {
        const tile = call.tiles[0];
        const ponIndex = this.melds.findIndex(
          (m) => m.type === 'pon' && normalFive(m.tiles[0]) === normalFive(tile),
        );
        if (ponIndex === -1) {
          issues.push(issue(`加カンする ${tileLabel(tile)} のポンがない`));
          break;
        }
        takeAll([tile]);
        const pon = this.melds[ponIndex];
        this.melds[ponIndex] = { type: 'kakan', from: pon.from, tiles: [...pon.tiles, tile] };
        break;
      }
      default:
        // tiles[0]は相手から鳴いた牌なので、手牌から出すのは残りの牌
        takeAll(call.tiles.slice(1));
        this.melds.push(call);
    }
    return issues;
  }

  /** 記録した1手を手牌に適用する。ツモ → 鳴き/カン → 打牌/和了 の順 */
  applyTurn(turn: Turn): HandIssue[] {
    const issues: HandIssue[] = [];
    if (turn.draw) this.draw(turn.draw);
    // 加カンは直前のツモが記録されないため、加カンした牌をそのツモ牌とみなす
    if (turn.call?.type === 'kakan' && !turn.draw) this.draw(turn.call.tiles[0]);
    if (turn.call) issues.push(...this.call(turn.call));
    if (turn.agari) {
      // 和了の手は通常ツモ牌を持たないが、同じ牌がツモとしても記録されていれば二重に加えない
      if (turn.draw !== turn.agari.tile) this.draw(turn.agari.tile);
      this.agariTile = turn.agari.tile;
    }
    if (turn.discard) {
      const found = this.discard(turn.discard);
      if (found) issues.push(found);
    }
    return issues;
  }

  /** 枚数の整合性。門前＋副露(カンも3枚扱い)が13枚(和了後は14枚)、同じ牌は4枚まで、赤5は1枚まで */
  validate(): HandIssue[] {
    const issues: HandIssue[] = [];
    const expected = this.agariTile !== null ? HAIPAI_SIZE + 1 : HAIPAI_SIZE;
    const size = this.concealed.length + this.melds.length * 3;
    // 和了で正しい枚数が変わっても同じずれとして扱えるよう、ずれの大きさで判定する
    if (size !== expected) {
      issues.push(issue(`手牌が${size}枚になっている(正しくは${expected}枚)`, `size:${size - expected}`));
    }
    const all = [...this.concealed, ...this.melds.flatMap((m) => m.tiles)];
    const counts = new Map<Tile, number>();
    for (const t of all) {
      const key = normalFive(t);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (isRedFive(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [t, n] of counts) {
      if (isRedFive(t) ? n > 1 : n > 4) issues.push(issue(`${tileLabel(t)} が${n}枚ある`));
    }
    return issues;
  }

  // ---- 表示 ----

  /** 牌を並べる共通処理。added(多重集合)に含まれる牌は、含まれる枚数ぶんだけ強調する */
  private renderTiles(tiles: readonly Tile[], added: Tile[], tileClass: string): ReactNode[] {
    const remaining = [...added];
    return tiles.map((tile, i) => {
      const addedIndex = remaining.indexOf(tile);
      if (addedIndex !== -1) remaining.splice(addedIndex, 1);
      return (
        <span key={i} className={`${tileClass}${addedIndex !== -1 ? ` ${tileClass}--added` : ''}`}>
          <TileGlyph tile={tile} />
        </span>
      );
    });
  }

  /** 配牌の表示。13枠固定で未入力の枠は？。onTapTileを渡すと、タップした牌の元の並びでのindexを返す */
  renderHaipai({ onTapTile }: { onTapTile?: (index: number) => void } = {}): ReactNode {
    const sorted = this.concealed
      .map((tile, index) => ({ tile, index }))
      .sort((a, b) => tileSortKey(a.tile) - tileSortKey(b.tile));
    const emptyCount = Math.max(0, HAIPAI_SIZE - this.concealed.length);
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

  /** 牌譜の各行に添える手牌の表示。詰めた小さい牌で、増えた牌の強調・副露・不整合の理由を並べる */
  renderHistory({ added, issues }: Pick<HandStep, 'added' | 'issues'>): ReactNode {
    // 和了した手では、和了牌を手牌から1枚だけ除き、手牌の右に離して置く
    const agariTile = this.agariTile;
    const tiles = [...this.tiles];
    const handAdded = [...added];
    if (agariTile !== null) {
      const t = tiles.indexOf(agariTile);
      if (t !== -1) tiles.splice(t, 1);
      const i = handAdded.indexOf(agariTile);
      if (i !== -1) handAdded.splice(i, 1);
    }
    // 行の幅いっぱいに収まる大きさにするため、並べる幅が牌何枚ぶんかをCSSに渡す。
    // 横向きの牌は左右の余白の分だけ広く数える。和了牌は門前の枚数に含まれるので、手牌との間の分だけ足す
    const meldSlots = this.melds.reduce(
      (sum, m) =>
        sum + m.tiles.length + callDisplayTiles(m).filter((t) => t.rotated).length * ROTATED_TILE_EXTRA_SLOTS,
      0,
    );
    const slots =
      this.concealed.length +
      meldSlots +
      (this.melds.length > 0 ? HISTORY_MELDS_LEAD_SLOTS : 0) +
      (this.melds.length + (agariTile !== null ? 1 : 0)) * HISTORY_MELD_GAP_SLOTS;
    return (
      <div className="hand-view hand-view--history" style={{ '--hand-slots': slots } as CSSProperties}>
        <span className="hand-view__concealed">{this.renderTiles(tiles, handAdded, 'hand-view__tile')}</span>
        {agariTile !== null && (
          <span className="hand-view__agari" title="和了牌">
            {this.renderTiles([agariTile], [agariTile], 'hand-view__tile')}
          </span>
        )}
        {this.melds.map((m, i) => (
          <TileMeld key={i} tiles={callDisplayTiles(m)} className="hand-view__meld" />
        ))}
        {issues.length > 0 && (
          <span className="hand-view__issues">{issues.map((issue) => issue.message).join(' / ')}</span>
        )}
      </div>
    );
  }
}

/** 2つの牌の並びの多重集合の差 */
export function diffTiles(before: readonly Tile[], after: readonly Tile[]): HandDiff {
  const removed = [...before];
  const added: Tile[] = [];
  for (const t of after) {
    const i = removed.indexOf(t);
    if (i === -1) added.push(t);
    else removed.splice(i, 1);
  }
  return { added, removed };
}

/**
 * 配牌と手順から、各手の直後の手牌・直前(1手目は配牌)との差・その手で生じた不整合を求める。
 * 配牌が13枚そろっていなければnull
 */
export function traceHands(haipai: Tile[], turns: Turn[]): HandStep[] | null {
  if (!Hand.canTrack(haipai)) return null;
  const steps: HandStep[] = [];
  let prev = Hand.fromHaipai(haipai);
  let prevValidation = new Set(prev.validate().map((i) => i.key));
  for (const turn of turns) {
    const hand = prev.clone();
    const issues = hand.applyTurn(turn);
    // 枚数の不整合は一度生じると以降も続くため、新たに生じた手でだけ報告する
    const validation = hand.validate();
    if (issues.length === 0) issues.push(...validation.filter((i) => !prevValidation.has(i.key)));
    steps.push({ hand, issues, ...diffTiles(prev.tiles, hand.tiles) });
    prev = hand;
    prevValidation = new Set(validation.map((i) => i.key));
  }
  return steps;
}
