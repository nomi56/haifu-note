import { Hand } from '../hand';
import type { Tile } from '../types';

interface HaipaiRowProps {
  haipai: Tile[];
  /** 指定すると各牌がタップ可能になり、タップした牌の元配列インデックスを受け取る（配牌編集用） */
  onTapTile?: (index: number) => void;
}

/** 配牌を13枠固定で表示する。表示自体は手牌クラス(Hand)の配牌用表示に任せる */
export function HaipaiRow({ haipai, onTapTile }: HaipaiRowProps) {
  return Hand.fromHaipai(haipai).renderHaipai({ onTapTile });
}
