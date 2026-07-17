"use client";

import { useState } from "react";
import { LogList } from "@/components/LogList";
import type { Voyage } from "@/lib/types";

// 完了した航海の記帳内容を見返すための読み取り専用モーダル。
// 削除機能は持たない（constraints.mdの「アーカイブ後に許可されるのは
// 工程チェックと工程宝のみ」という方針を踏まえ、閲覧のみに限定する）。
// 「すべて」＝システム記録（工程完了・停泊等）＋手動記帳の混在表示、
// 「記帳のみ」＝sys:trueを除いた手動記帳のみの絞り込み表示。
export function LogViewModal({
  voyage,
  onClose,
}: {
  voyage: Voyage;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "notes">("all");
  const filteredLogs =
    filter === "notes" ? voyage.logs.filter((log) => !log.sys) : voyage.logs;

  return (
    <div className="modal-bg open">
      <div className="modal">
        <h2>{voyage.name} の航海日誌</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`tab${filter === "all" ? " active" : ""}`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setFilter("notes")}
            className={`tab${filter === "notes" ? " active" : ""}`}
          >
            記帳のみ
          </button>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <LogList logs={filteredLogs} readOnly />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
