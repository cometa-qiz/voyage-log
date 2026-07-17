"use client";

import { LogList } from "@/components/LogList";
import type { Voyage } from "@/lib/types";

// 完了した航海の記帳内容を見返すための読み取り専用モーダル。
// 削除機能は持たない（constraints.mdの「アーカイブ後に許可されるのは
// 工程チェックと工程宝のみ」という方針を踏まえ、閲覧のみに限定する）。
export function LogViewModal({
  voyage,
  onClose,
}: {
  voyage: Voyage;
  onClose: () => void;
}) {
  return (
    <div className="modal-bg open">
      <div className="modal">
        <h2>{voyage.name} の航海日誌</h2>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <LogList logs={voyage.logs} readOnly />
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
