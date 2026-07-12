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
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        まだ記帳がありません。道中どこでも「✎ 記帳する」で残せます。
      </p>
    );
  }

  // [...v.logs].reverse() 相当（新しい順）
  const reversedLogs = [...logs].reverse();

  return (
    <div className="flex flex-col gap-1.5">
      {reversedLogs.map((log) => (
        <div
          key={log.id}
          className={`flex items-baseline gap-3 rounded-md border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.08] ${
            log.sys
              ? "border-l-4 border-l-teal-600"
              : "border-l-4 border-l-pink-600"
          }`}
        >
          <span className="shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {fmtDate(log.ts)}
          </span>
          <span className="min-w-11 shrink-0 font-mono text-xs text-amber-600 dark:text-amber-400">
            {log.pos != null ? `${log.pos.toFixed(1)}%` : "—"}
          </span>
          <span
            className={`flex-1 break-words ${
              log.sys
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-black dark:text-zinc-50"
            }`}
          >
            {log.note}
          </span>
          <button
            type="button"
            title="消す"
            onClick={() => setDeleteTargetId(log.id)}
            className="shrink-0 text-zinc-400 hover:text-red-600 dark:text-zinc-500"
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
