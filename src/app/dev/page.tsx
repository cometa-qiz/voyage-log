"use client";

/**
 * 開発用の一時的な確認ページ（Phase 2「✅ 完了確認」用）。
 * - useVoyages の作成・onSnapshot購読・論理削除の動作確認
 * - progressOf() の3分岐（時間目標／無制限／アーカイブ済み）の動作確認
 * サインイン必須（AuthGuard対象内）。Phase 5で正式な航路管理UIが実装され次第、
 * このページ自体を削除する前提の使い捨てページである。
 */

import { useState } from "react";
import { useVoyages } from "@/hooks/useVoyages";
import { progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";
import { Chart } from "@/components/Chart/Chart";

function sampleVoyage(overrides: Partial<Voyage>): Voyage {
  return {
    id: "sample",
    name: "sample",
    goal: "sample",
    mode: "time",
    targetMinutes: null,
    createdAt: Date.now(),
    routeIndex: 0,
    sailing: false,
    sailStart: null,
    accumMs: 0,
    sessions: [],
    logs: [],
    todos: [],
    passed: [],
    todoRewards: 0,
    sessBreakMs: 0,
    pomo: null,
    archived: false,
    archivedAt: null,
    isActive: true,
    schemaVersion: 5,
    ...overrides,
  };
}

const CHART_PREVIEW_TARGET_MINUTES = 60;
const PROGRESS_PRESETS = [0, 25, 50, 75, 100];

const progressSamples = [
  {
    label: "時間目標モード（目標60分・経過30分）",
    voyage: sampleVoyage({
      mode: "time",
      targetMinutes: 60,
      accumMs: 30 * 60000,
    }),
    expected: 50,
  },
  {
    label: "無制限モード（工程4件中2件完了）",
    voyage: sampleVoyage({
      mode: "free",
      todos: [
        { id: "1", text: "工程1", done: true, doneAt: 1, elapsedAtDone: 1 },
        { id: "2", text: "工程2", done: true, doneAt: 1, elapsedAtDone: 1 },
        { id: "3", text: "工程3", done: false, doneAt: null, elapsedAtDone: null },
        { id: "4", text: "工程4", done: false, doneAt: null, elapsedAtDone: null },
      ],
    }),
    expected: 50,
  },
  {
    label: "アーカイブ済み（他条件は未達成でも常に100）",
    voyage: sampleVoyage({
      archived: true,
      mode: "time",
      targetMinutes: 10,
      accumMs: 0,
    }),
    expected: 100,
  },
];

export default function DevPage() {
  const { voyages, loading, createVoyage, discardVoyage } = useVoyages();
  const [isCreating, setIsCreating] = useState(false);
  const [chartRouteIndex, setChartRouteIndex] = useState(0);
  const [chartProgressPercent, setChartProgressPercent] = useState(50);

  const chartPreviewVoyage = sampleVoyage({
    name: "Chart確認用航路",
    goal: "確認ゴール島",
    mode: "time",
    targetMinutes: CHART_PREVIEW_TARGET_MINUTES,
    accumMs: (CHART_PREVIEW_TARGET_MINUTES * 60000 * chartProgressPercent) / 100,
    routeIndex: chartRouteIndex,
  });

  const handleCreateTestVoyage = async () => {
    setIsCreating(true);
    try {
      await createVoyage({
        name: `テスト航路 ${new Date().toLocaleTimeString("ja-JP")}`,
        goal: "テストゴール島",
        mode: "time",
        targetMinutes: 60,
        todoTexts: ["工程1", "工程2"],
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          開発用確認ページ（/dev）
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Phase 2の動作確認用の一時ページです。Phase
          5で正式な航路管理UIが実装され次第削除します。
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-black dark:text-zinc-50">
          Chart 動作確認（Phase 3 ✅完了確認）
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">航路パターン:</span>
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              onClick={() => setChartRouteIndex(index)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                chartRouteIndex === index
                  ? "border-foreground bg-foreground text-background"
                  : "border-black/[.08] dark:border-white/[.145]"
              }`}
            >
              routeIndex {index}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">進捗:</span>
          {PROGRESS_PRESETS.map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => setChartProgressPercent(percent)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                chartProgressPercent === percent
                  ? "border-foreground bg-foreground text-background"
                  : "border-black/[.08] dark:border-white/[.145]"
              }`}
            >
              {percent}%
            </button>
          ))}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          選択中: routeIndex {chartRouteIndex} ／ 進捗 {chartProgressPercent}%
        </p>

        <Chart voyage={chartPreviewVoyage} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-black dark:text-zinc-50">
          useVoyages 動作確認
        </h2>
        <button
          type="button"
          onClick={handleCreateTestVoyage}
          disabled={isCreating}
          className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50"
        >
          {isCreating ? "作成中..." : "テスト航路を作成"}
        </button>

        {loading ? (
          <p className="text-sm text-zinc-500">読み込み中...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {voyages.length === 0 && (
              <li className="text-sm text-zinc-500 dark:text-zinc-400">
                航路はまだありません（isActive:trueのものが0件）
              </li>
            )}
            {voyages.map((voyage) => (
              <li
                key={voyage.id}
                className="flex items-center justify-between gap-4 rounded border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
              >
                <div>
                  <div>id: {voyage.id}</div>
                  <div>name: {voyage.name}</div>
                  <div>isActive: {String(voyage.isActive)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => discardVoyage(voyage.id)}
                  className="rounded-full border border-black/[.08] px-4 py-1.5 dark:border-white/[.145]"
                >
                  破棄
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-black dark:text-zinc-50">
          progressOf() 動作確認
        </h2>
        <table className="text-sm">
          <thead>
            <tr className="text-left">
              <th className="pr-4">ケース</th>
              <th className="pr-4">期待値</th>
              <th className="pr-4">実際の値</th>
              <th>結果</th>
            </tr>
          </thead>
          <tbody>
            {progressSamples.map(({ label, voyage, expected }) => {
              const actual = progressOf(voyage);
              const pass = actual === expected;
              return (
                <tr key={label}>
                  <td className="pr-4">{label}</td>
                  <td className="pr-4">{expected}</td>
                  <td className="pr-4">{actual}</td>
                  <td>{pass ? "✅ OK" : "❌ NG"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
