export type UnsavedChangesDialogKind = 'kyoku' | 'new' | 'file';

interface UnsavedChangesDialogProps {
  kind: UnsavedChangesDialogKind;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

// 遷移先によって、編集中の内容がどうなるか(切り替わって消える/そのまま残る)が異なるため
// メッセージと「いいえ」の文言を分ける
const MESSAGE: Record<UnsavedChangesDialogKind, string> = {
  kyoku: '編集中の局に未保存の内容があります。保存してから他の局に切り替えますか？',
  new: '編集中の局に未保存の内容があります。保存してから新しい局を追加しますか？',
  file: '編集中の局に未保存の内容があります。保存してから保存・読込画面へ移動しますか？',
};

// 局の切り替え/新規追加では編集中の内容が別の局に置き換わり失われるが、
// 保存・読込画面への移動では編集中の内容はそのまま記録画面に残るため「破棄する」とは言えない
const DISCARD_LABEL: Record<UnsavedChangesDialogKind, string> = {
  kyoku: 'いいえ（破棄して切り替える）',
  new: 'いいえ（破棄して追加する）',
  file: 'いいえ（保存せず移動する）',
};

/** 局データを読み替える際、編集中の未保存内容をどうするか確認する3択ダイアログ */
export function UnsavedChangesDialog({ kind, onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  return (
    <div className="tile-modal-backdrop confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-dialog__message">{MESSAGE[kind]}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__save" onClick={onSave}>
            はい（保存する）
          </button>
          <button type="button" onClick={onDiscard}>
            {DISCARD_LABEL[kind]}
          </button>
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
