import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  message: ReactNode;
  confirmLabel: string;
  /** 削除など取り消せない操作の場合、確定ボタンを警告色にする */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 「はい/キャンセル」の2択で確認するダイアログ。見た目はUnsavedChangesDialogと揃える */
export function ConfirmDialog({ message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="tile-modal-backdrop confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className={danger ? 'confirm-dialog__danger' : 'confirm-dialog__save'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
