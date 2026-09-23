import { useEffect } from 'react';
import { advanceToNextKyoku, formatGameInfo, renchan, ryukyokuOyanagare } from '../gameInfo';
import type { GameInfo } from '../types';

interface NewKyokuDialogProps {
  /** 新しい局の場の情報を計算する基準(現在表示中の局の場の情報) */
  baseGameInfo: GameInfo;
  onChoose: (gameInfo: GameInfo) => void;
  onCancel: () => void;
}

/**
 * 新しい局を追加する際、場の情報の進め方を選ぶダイアログ。
 * 親が流れる(次の局)か、親が続投する(連荘)か、流局で親が流れる(本場は積む)かで進め方が異なる
 */
export function NewKyokuDialog({ baseGameInfo, onChoose, onCancel }: NewKyokuDialogProps) {
  const options = [
    { label: '次の局へ', gameInfo: advanceToNextKyoku(baseGameInfo) },
    { label: '連荘', gameInfo: renchan(baseGameInfo) },
    { label: '流局（親流れ）', gameInfo: ryukyokuOyanagare(baseGameInfo) },
  ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="tile-modal-backdrop confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-dialog__message">新しい局を追加</p>
        <p className="new-kyoku-dialog__base">現在: {formatGameInfo(baseGameInfo)}</p>
        <div className="confirm-dialog__actions">
          {options.map((o) => (
            <button key={o.label} type="button" className="new-kyoku-dialog__choice" onClick={() => onChoose(o.gameInfo)}>
              <span className="new-kyoku-dialog__choice-label">{o.label}</span>
              <span className="new-kyoku-dialog__choice-info">{formatGameInfo(o.gameInfo)}</span>
            </button>
          ))}
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
