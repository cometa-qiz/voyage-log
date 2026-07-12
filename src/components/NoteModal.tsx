"use client";

import { useState } from "react";
import { progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// 記帳モーダル。docs/voyage-log.html の #noteModal（703〜716行目）、
// openModal('noteModal')（1490〜1496行目付近）、addNote()（1533〜1541行目付近）を移植。
// ラベルの進捗%はモーダルを開いた時点の値（プロトタイプがopenModal時に一度だけ
// notePosへ設定し、その後は更新しないのと同じ挙動をuseStateの遅延初期化で再現）。
// 送信時のpos（記帳エントリの進捗%）は呼び出し側（page.tsx）が送信時点の
// 最新progressOf(voyage)で計算する（開いた時点の値を使い回さない）。
export function NoteModal({
  voyage,
  onClose,
  onSubmit,
}: {
  voyage: Voyage;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
}) {
  const [openedAtProgress] = useState(() => progressOf(voyage));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setError("メモを入力してください");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trimmedNote);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          日誌に記帳
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            メモ（現在地{" "}
            <span className="font-mono text-amber-600 dark:text-amber-400">
              {openedAtProgress.toFixed(1)}% 地点
            </span>{" "}
            に記録されます）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今の状況・気づき・次にやること など"
            rows={4}
            className="rounded border border-black/[.08] px-3 py-2 text-base dark:border-white/[.145] dark:bg-zinc-800"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50"
          >
            {isSubmitting ? "記帳中..." : "記帳する"}
          </button>
        </div>
      </div>
    </div>
  );
}
