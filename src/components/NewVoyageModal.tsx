"use client";

import { useState } from "react";
import type { CreateVoyageInput } from "@/hooks/useVoyages";

const HOUR_OPTIONS = Array.from({ length: 51 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const MODE_HINTS = {
  time: "時間目標：出航中、実時間の経過で船が進みます",
  free: "無制限：制限時間なし。工程をチェックするたびに船が進み、全て終えると自動的に入港します",
} as const;

// 新規航路モーダル。docs/voyage-log.html の #newModal（664〜700行目）と
// onModeChange/openModal/buildDurSelects/createVoyage（1474〜1531行目付近）を移植。
// バリデーションエラーはプロトタイプのalert()ではなく、フォーム内のインライン表示に変更した
// （モーダルを閉じずその場で修正できるほうが、ブロッキングダイアログより自然なため）。
// openModal('newModal')の「開くたびにフォームをリセットする」は、呼び出し側が
// open時のみこのコンポーネントをマウントする（閉時はアンマウントする）ことで実現する
// 前提のため、このコンポーネント自身はopen/closeの状態を持たない。
export function NewVoyageModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: CreateVoyageInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<"time" | "free">("time");
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [todosText, setTodosText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedGoal = goal.trim();
    const targetMinutes = mode === "free" ? null : hours * 60 + minutes;
    const todoTexts = todosText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!trimmedName) {
      setError("船名（作業名）を入力してください");
      return;
    }
    if (!trimmedGoal) {
      setError("目的地の名前を入力してください");
      return;
    }
    if (mode === "time" && (targetMinutes ?? 0) <= 0) {
      setError("目標時間を1分以上にしてください");
      return;
    }
    if (mode === "free" && todoTexts.length === 0) {
      setError(
        "無制限モードでは工程を1つ以上入力してください（工程の達成で船が進みます）",
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate({
        name: trimmedName,
        goal: trimmedGoal,
        mode,
        targetMinutes,
        todoTexts,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-bg open">
      <div className="modal">
        <h2>新しい航路を引く</h2>

        <div className="field">
          <label>作業・プロジェクト名（船名）</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：Yggd-memo フェーズ3"
          />
        </div>

        <div className="field">
          <label>目的地（ゴールの名前）</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例：β版リリース港"
          />
        </div>

        <div className="field">
          <label>航海のモード</label>
          <div className="mode-row">
            <label className="mode-opt">
              <input
                type="radio"
                name="vmode"
                value="time"
                checked={mode === "time"}
                onChange={() => setMode("time")}
              />
              ⏳ 時間目標
            </label>
            <label className="mode-opt">
              <input
                type="radio"
                name="vmode"
                value="free"
                checked={mode === "free"}
                onChange={() => setMode("free")}
              />
              ♾ 無制限
            </label>
          </div>
          <div className="hint">{MODE_HINTS[mode]}</div>
        </div>

        <div className="field">
          <label>目的地までの距離（目標作業時間）</label>
          <div className={`dur-row ${mode === "free" ? "disabled" : ""}`}>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>時間</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span>分</span>
          </div>
        </div>

        <div className="field">
          <label>工程・Todo（1行に1つ。あとから手帳でも追加できます）</label>
          <textarea
            value={todosText}
            onChange={(e) => setTodosText(e.target.value)}
            placeholder={"例：\n要件を書き出す\n画面モックを作る\n実装する"}
          />
          <div className="hint">
            すべての工程を終えると、船は全速力で目的地へ向かいます
          </div>
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
            {isSubmitting ? "作成中..." : "航路を引く"}
          </button>
        </div>
      </div>
    </div>
  );
}
