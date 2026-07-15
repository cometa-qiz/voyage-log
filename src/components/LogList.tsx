"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtDate } from "@/lib/progress";
import type { LogEntry } from "@/lib/types";

// 航海日誌一覧。docs/voyage-log.html の logbook（1141〜1151行目）・
// deleteLog()（1543〜1548行目）・.log-item のスタイル差異（373〜385行目、
// 手動記帳=マゼンタ系の左ボーダー／システム記帳=ティール系の左ボーダー＋本文が薄い色）を移植。
// 削除確認はconfirm()ではなく既存のConfirmDialogを再利用する。
export function LogList({
  logs,
  onDeleteLog,
}: {
  logs: LogEntry[];
  onDeleteLog: (logId: string) => Promise<void>;
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="log-list">
        <div className="empty">
          まだ記帳がありません。道中どこでも「✎ 記帳する」で残せます。
        </div>
      </div>
    );
  }

  // [...v.logs].reverse() 相当（新しい順）
  const reversedLogs = [...logs].reverse();

  return (
    <div className="log-list">
      {reversedLogs.map((log) => (
        <div key={log.id} className={`log-item ${log.sys ? "sys" : ""}`}>
          <span className="log-date">{fmtDate(log.ts)}</span>
          <span className="log-pos">
            {log.pos != null ? `${log.pos.toFixed(1)}%` : "—"}
          </span>
          <span className="log-note">{log.note}</span>
          <button
            type="button"
            title="消す"
            onClick={() => setDeleteTargetId(log.id)}
            className="log-del"
          >
            ×
          </button>
        </div>
      ))}

      {deleteTargetId && (
        <ConfirmDialog
          message="この記帳を消しますか？"
          confirmLabel="消す"
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={async () => {
            await onDeleteLog(deleteTargetId);
            setDeleteTargetId(null);
          }}
        />
      )}
    </div>
  );
}
