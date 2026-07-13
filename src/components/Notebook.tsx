"use client";

import { useState } from "react";
import { fmtDur } from "@/lib/progress";
import type { Todo, Voyage } from "@/lib/types";

// 工程手帳。docs/voyage-log.html の #nbBtn/#nbBg/#notebook（645〜662行目）、
// toggleNotebook()（1239〜1250行目）・renderNotebook()（1255〜1298行目）を移植。
// nbVoyageId（手帳で特定の航路を指定して開く仕組み。Phase 7で使用）は今回実装せず、
// 常に呼び出し側から渡されたvoyage（＝アクティブな航路）の工程を表示する。
// チェックの切替・工程の追加・削除は次タスクで実装するため、ここでは見た目のみ用意する。
export function Notebook({ voyage }: { voyage: Voyage | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!voyage) return null;

  const remain = voyage.todos.filter((todo) => !todo.done).length;
  const done = voyage.todos.filter((todo) => todo.done).length;
  const total = voyage.todos.length;

  // renderNotebook()内 doneSorted・lapOf()（1274〜1281行目）を移植。
  // 完了時刻（elapsedAtDone）の昇順に並べ、直前の完了工程との差分を区間タイムとする。
  const doneSorted = voyage.todos
    .filter((todo) => todo.done && todo.elapsedAtDone != null)
    .sort((a, b) => (a.elapsedAtDone ?? 0) - (b.elapsedAtDone ?? 0));
  const lapOf = (todo: Todo): number | null => {
    const i = doneSorted.indexOf(todo);
    if (i < 0) return null;
    const prev = i > 0 ? (doneSorted[i - 1].elapsedAtDone ?? 0) : 0;
    return (todo.elapsedAtDone ?? 0) - prev;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="工程手帳を開く"
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl shadow-lg"
      >
        📖
        {remain > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-pink-600 px-1 font-mono text-xs font-bold text-white dark:border-zinc-900">
            {remain}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 flex w-[min(360px,92vw)] flex-col bg-white transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-black/[.08] px-4 py-4 text-base font-semibold tracking-widest text-black dark:border-white/[.145] dark:text-zinc-50">
          工 程 手 帳
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-auto text-xl text-zinc-500 dark:text-zinc-400"
          >
            ×
          </button>
        </div>

        <div className="px-4 pt-2.5 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-black dark:text-zinc-50">
            {voyage.name}
          </span>{" "}
          の工程
        </div>

        {total > 0 && (
          <div className="mt-2 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
            ✓ {done} / {total}
            {done === total && done > 0 && "　— 全工程完了！"}
          </div>
        )}

        <div className="mx-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          💡 工程を3つ達成するごとに宝を1つ発見！
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-24">
          {total === 0 ? (
            <div className="rounded-md border border-dashed border-black/[.08] p-6 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
              工程を追加すると、チェックした時点までの航行時間が記録されます。
              <br />
              <br />
              すべて終えると船は全速力で目的地へ！
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {voyage.todos.map((todo) => {
                const lap = lapOf(todo);
                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-2.5 rounded-lg border border-black/[.08] p-3 text-sm dark:border-white/[.145]"
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        todo.done
                          ? "border-pink-600 bg-pink-600 text-white"
                          : "border-black/[.2] text-transparent dark:border-white/[.3]"
                      }`}
                    >
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`break-words ${
                          todo.done
                            ? "text-zinc-500 line-through dark:text-zinc-400"
                            : "text-black dark:text-zinc-50"
                        }`}
                      >
                        {todo.text}
                      </div>
                      {todo.done && todo.elapsedAtDone != null && (
                        <div className="mt-1 font-mono text-xs text-amber-600 dark:text-amber-400">
                          ⏱ {fmtDur(todo.elapsedAtDone)} 時点で完了
                          {lap != null && doneSorted.length > 1 && (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              （区間 {fmtDur(lap)}）
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      title="消す"
                      className="shrink-0 text-zinc-400 dark:text-zinc-500"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute right-0 bottom-0 left-0 flex gap-2 border-t border-black/[.08] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-white/[.145] dark:bg-zinc-900">
          <input
            placeholder="工程・Todoを追加"
            className="flex-1 rounded-md border border-black/[.08] px-3 py-2 text-base dark:border-white/[.145] dark:bg-zinc-800"
          />
          <button
            type="button"
            className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-black"
          >
            ＋
          </button>
        </div>
      </div>
    </>
  );
}
