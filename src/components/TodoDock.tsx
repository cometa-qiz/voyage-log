"use client";

import { useDockOpen } from "@/hooks/useLocalSettings";
import type { Voyage } from "@/lib/types";

// Todoドック（画面左端・クリックで出し入れ）。docs/voyage-log.html の
// .todo-dock/.td-panel/.td-tab（637〜642行目・171〜206行目）、
// toggleDock()・renderTodoDock()（1171〜1193行目）を移植。
// 開閉状態はuseDockOpen()（Phase 2実装済み・localStorage永続化）でそのまま管理する。
export function TodoDock({ voyage }: { voyage: Voyage | null }) {
  const [isOpen, setIsOpen] = useDockOpen();

  if (!voyage) return null;

  const remain = voyage.todos.filter((todo) => !todo.done);
  const shown = remain.slice(0, 7);
  const extraCount = remain.length - shown.length;

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      title="クリックで出し入れ"
      className={`fixed top-1/2 left-0 z-30 flex -translate-y-1/2 cursor-pointer touch-manipulation transition-transform duration-300 select-none ${
        isOpen ? "translate-x-0" : "translate-x-[calc(30px-100%)]"
      }`}
    >
      <div className="w-[min(230px,60vw)] border border-r-0 border-black/[.15] bg-white/95 p-3.5 shadow-lg backdrop-blur-sm dark:border-white/[.2] dark:bg-zinc-900/95">
        <div className="mb-2 border-b border-dashed border-black/[.15] pb-1.5 text-xs tracking-widest text-amber-600 dark:border-white/[.2] dark:text-amber-400">
          残 り の 工 程
        </div>

        {remain.length === 0 ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {voyage.todos.length > 0
              ? "全工程完了！🚩"
              : "工程はまだありません"}
          </div>
        ) : (
          <>
            {shown.map((todo) => (
              <div
                key={todo.id}
                className="truncate text-[12.5px] text-amber-600 dark:text-amber-400"
              >
                □ {todo.text}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                …他 {extraCount} 件
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex w-[30px] items-center justify-center rounded-r-lg border border-l-0 border-black/[.15] bg-amber-500 py-3.5 text-xs font-bold tracking-wide text-black shadow-lg [writing-mode:vertical-rl] dark:border-white/[.2]">
        📋 工程
      </div>
    </div>
  );
}
