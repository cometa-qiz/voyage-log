"use client";

// 汎用の確認ダイアログ。docs/voyage-log.html はconfirm()（ブラウザ標準ダイアログ）を使うが、
// これまでのモーダル実装（NewVoyageModal等）と見た目・操作感を揃えるため、
// フォーム内モーダルと同じ構造のReactコンポーネントとして実装する。
export function ConfirmDialog({
  message,
  confirmLabel = "破棄する",
  cancelLabel = "やめる",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-bg open">
      <div className="modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
