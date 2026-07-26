import type { GameInfo, Wind } from './types';

export const WIND_OPTIONS: Wind[] = ['east', 'south', 'west', 'north'];

export const WIND_LABEL: Record<Wind, string> = {
  east: '東',
  south: '南',
  west: '西',
  north: '北',
};

export const DEFAULT_GAME_INFO: GameInfo = {
  gameNumber: 1,
  roundWind: 'east',
  roundNumber: 1,
  honba: 0,
  seat: 'east',
};

/** 場の情報を「1試合目 東1局0本場 東家」のようなコンパクトな1行にまとめる */
export function formatGameInfo(info: GameInfo): string {
  return `${info.gameNumber}試合目 ${WIND_LABEL[info.roundWind]}${info.roundNumber}局${info.honba}本場 ${WIND_LABEL[info.seat]}家`;
}
