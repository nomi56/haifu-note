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

/**
 * advanceToNextKyokuの逆操作。前の局に戻す。局数が1を下回ったら場風を戻して4局にし、本場は0にリセットする。
 * 親が前の人(旧・自分から見て上家)に戻るため、自分の座席は東→南→西→北→東と一つ繰り下がる
 */
export function retreatToPreviousKyoku(info: GameInfo): GameInfo {
  const windRetreats = info.roundNumber <= 1;
  return {
    ...info,
    roundWind: windRetreats ? prevWind(info.roundWind) : info.roundWind,
    roundNumber: windRetreats ? 4 : info.roundNumber - 1,
    honba: 0,
    seat: nextWind(info.seat),
  };
}
