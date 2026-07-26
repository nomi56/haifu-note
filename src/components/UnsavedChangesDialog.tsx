interface UnsavedChangesDialogProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/** 局データを読み替える際、編集中の未保存内容をどうするか確認する3択ダイアログ */
export function UnsavedChangesDialog({ onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  return (
    <div className="tile-modal-backdrop confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-dialog__message">
          編集中の局に未保存の内容があります。保存してから読み替えますか？
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__save" onClick={onSave}>
            はい（保存する）
          </button>
          <button type="button" onClick={onDiscard}>
            いいえ（破棄する）
          </button>
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
