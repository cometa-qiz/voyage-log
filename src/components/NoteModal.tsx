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
    <div className="modal-bg open">
      <div className="modal">
        <h2>日誌に記帳</h2>

        <div className="field">
          <label>
            メモ（現在地{" "}
            <span
              style={{ color: "var(--gold)", fontFamily: "Consolas,monospace" }}
            >
              {openedAtProgress.toFixed(1)}% 地点
            </span>{" "}
            に記録されます）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今の状況・気づき・次にやること など"
          />
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            やめる
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-ok"
          >
            {isSubmitting ? "記帳中..." : "記帳する"}
          </button>
        </div>
      </div>
    </div>
  );
}
