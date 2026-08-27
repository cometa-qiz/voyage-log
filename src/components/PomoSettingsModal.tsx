"use client";

import { useState } from "react";

// ポモドーロの作業/休憩時間（分）を設定するモーダル。
// docs/requirements.md 9章「ユーザーが設定で変更可能」に対応。
export function PomoSettingsModal({
  workMinutes,
  breakMinutes,
  onSave,
  onClose,
}: {
  workMinutes: number;
  breakMinutes: number;
  onSave: (workMinutes: number, breakMinutes: number) => void;
  onClose: () => void;
}) {
  const [work, setWork] = useState(String(workMinutes));
  const [brk, setBrk] = useState(String(breakMinutes));

  const handleSave = () => {
    const workNum = Math.max(1, Math.round(Number(work)) || workMinutes);
    const brkNum = Math.max(1, Math.round(Number(brk)) || breakMinutes);
    onSave(workNum, brkNum);
    onClose();
  };

  return (
    <div className="modal-bg open">
      <div className="modal">
        <h2>ポモドーロ設定</h2>
        <div className="field">
          <label>作業時間（分）</label>
          <input
            type="number"
            min={1}
            value={work}
            onChange={(e) => setWork(e.target.value)}
          />
        </div>
        <div className="field">
          <label>休憩時間（分）</label>
          <input
            type="number"
            min={1}
            value={brk}
            onChange={(e) => setBrk(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            やめる
          </button>
          <button type="button" onClick={handleSave} className="btn-ok">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
