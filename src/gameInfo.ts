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

function nextWind(w: Wind): Wind {
  const i = WIND_OPTIONS.indexOf(w);
  return WIND_OPTIONS[(i + 1) % WIND_OPTIONS.length];
}

function prevWind(w: Wind): Wind {
  const i = WIND_OPTIONS.indexOf(w);
  return WIND_OPTIONS[(i + WIND_OPTIONS.length - 1) % WIND_OPTIONS.length];
}

/**
 * 連荘なし(親が流れる)で次の局に進める。局数が4を超えたら場風を進めて1局に戻し、本場は0にリセットする。
 * 親が次の人(旧・自分から見て下家)に移るため、自分の座席は東→北→西→南→東と一つ繰り上がる
 */
export function advanceToNextKyoku(info: GameInfo): GameInfo {
  const windAdvances = info.roundNumber >= 4;
  return {
    ...info,
    roundWind: windAdvances ? nextWind(info.roundWind) : info.roundWind,
    roundNumber: windAdvances ? 1 : info.roundNumber + 1,
    honba: 0,
    seat: prevWind(info.seat),
  };
}

/** 連荘(親が継続)。場風・局数・座席は変わらず、本場だけ加算する */
export function applyRenchan(info: GameInfo): GameInfo {
  return { ...info, honba: info.honba + 1 };
}
