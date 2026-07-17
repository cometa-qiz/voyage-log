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
      className={`todo-dock ${isOpen ? "" : "closed"}`}
    >
      <div className="td-panel">
        <div className="td-title">残 り の 工 程</div>

        {remain.length === 0 ? (
          <div className="td-done-all">
            {voyage.todos.length > 0
              ? "全工程完了！🚩"
              : "工程はまだありません"}
          </div>
        ) : (
          <>
            {shown.map((todo) => (
              <div key={todo.id} className="td-item">
                {todo.text}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="td-more">…他 {extraCount} 件</div>
            )}
          </>
        )}
      </div>

      <div className="td-tab">📋 工程</div>
    </div>
  );
}
