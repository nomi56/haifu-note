import { WIND_LABEL, WIND_OPTIONS, advanceToNextKyoku, retreatToPreviousKyoku } from '../gameInfo';
import type { GameInfo, Wind } from '../types';

interface GameInfoEditorProps {
  value: GameInfo;
  onChange: (value: GameInfo) => void;
  onClose: () => void;
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  suffix: string;
  onChange: (value: number) => void;
}

function Stepper({ label, value, min, suffix, onChange }: StepperProps) {
  return (
    <div className="game-info-editor__field">
      <span className="game-info-editor__label">{label}</span>
      <div className="game-info-editor__stepper">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="game-info-editor__stepper-value">
          {value}
          {suffix}
        </span>
        <button type="button" onClick={() => onChange(value + 1)}>
          ＋
        </button>
      </div>
    </div>
  );
}

interface WindPickerProps {
  label: string;
  value: Wind;
  suffix: string;
  onChange: (value: Wind) => void;
}

function WindPicker({ label, value, suffix, onChange }: WindPickerProps) {
  return (
    <div className="game-info-editor__field">
      <span className="game-info-editor__label">{label}</span>
      <div className="turn-editor__call-controls">
        {WIND_OPTIONS.map((w) => (
          <button key={w} type="button" className={value === w ? 'active' : ''} onClick={() => onChange(w)}>
            {WIND_LABEL[w]}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 場の情報(何試合目/場風/局数/本場/自分の座席)編集用モーダル。変更は即座に反映される */
export function GameInfoEditor({ value, onChange, onClose }: GameInfoEditorProps) {
  return (
    <div className="tile-modal-backdrop" onClick={onClose}>
      <div className="tile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tile-modal__header">
          <span>場の情報を編集</span>
          <button type="button" className="tile-modal__close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="game-info-editor__quick-actions">
          <button type="button" onClick={() => onChange(retreatToPreviousKyoku(value))}>
            前の局に戻す
          </button>
          <button type="button" onClick={() => onChange(advanceToNextKyoku(value))}>
            次の局に更新
          </button>
        </div>

        <Stepper
          label="試合数"
          value={value.gameNumber}
          min={1}
          suffix="試合目"
          onChange={(gameNumber) => onChange({ ...value, gameNumber })}
        />
        <WindPicker label="場" value={value.roundWind} suffix="" onChange={(roundWind) => onChange({ ...value, roundWind })} />
        <Stepper
          label="局"
          value={value.roundNumber}
          min={1}
          suffix="局"
          onChange={(roundNumber) => onChange({ ...value, roundNumber })}
        />
        <Stepper
          label="本場"
          value={value.honba}
          min={0}
          suffix="本場"
          onChange={(honba) => onChange({ ...value, honba })}
        />
        <WindPicker label="自分の座席" value={value.seat} suffix="家" onChange={(seat) => onChange({ ...value, seat })} />
      </div>
    </div>
  );
}
