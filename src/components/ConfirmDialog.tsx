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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 dark:bg-zinc-900">
        <p className="text-sm text-black dark:text-zinc-50">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-5 py-2 text-sm text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
