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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-white p-6 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          新しい航路を引く
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            作業・プロジェクト名（船名）
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：Yggd-memo フェーズ3"
            className="rounded border border-black/[.08] px-3 py-2 text-base dark:border-white/[.145] dark:bg-zinc-800"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            目的地（ゴールの名前）
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例：β版リリース港"
            className="rounded border border-black/[.08] px-3 py-2 text-base dark:border-white/[.145] dark:bg-zinc-800"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            航海のモード
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="vmode"
                value="time"
                checked={mode === "time"}
                onChange={() => setMode("time")}
              />
              ⏳ 時間目標
            </label>
            <label className="flex items-center gap-1.5 text-sm">
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
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {MODE_HINTS[mode]}
          </div>
        </div>

        {mode === "time" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              目的地までの距離（目標作業時間）
            </label>
            <div className="flex items-center gap-2">
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="rounded border border-black/[.08] px-2 py-1.5 text-base dark:border-white/[.145] dark:bg-zinc-800"
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-sm">時間</span>
              <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="rounded border border-black/[.08] px-2 py-1.5 text-base dark:border-white/[.145] dark:bg-zinc-800"
              >
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-sm">分</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            工程・Todo（1行に1つ。あとから手帳でも追加できます）
          </label>
          <textarea
            value={todosText}
            onChange={(e) => setTodosText(e.target.value)}
            placeholder={"例：\n要件を書き出す\n画面モックを作る\n実装する"}
            rows={4}
            className="rounded border border-black/[.08] px-3 py-2 text-base dark:border-white/[.145] dark:bg-zinc-800"
          />
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            すべての工程を終えると、船は全速力で目的地へ向かいます
          </div>
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
            {isSubmitting ? "作成中..." : "航路を引く"}
          </button>
        </div>
      </div>
    </div>
  );
}
