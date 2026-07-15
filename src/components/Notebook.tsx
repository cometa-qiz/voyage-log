"use client";

import { useState } from "react";
import { fmtDur } from "@/lib/progress";
import type { Todo, Voyage } from "@/lib/types";

// 工程手帳。docs/voyage-log.html の #nbBtn/#nbBg/#notebook（645〜662行目）、
// toggleNotebook()（1239〜1250行目）・renderNotebook()（1255〜1298行目）を移植。
// nbVoyageId（手帳で特定の航路を指定して開く仕組み）はpage.tsx側で管理し、
// このコンポーネントには表示対象voyage（notebookVoyage相当）として渡ってくる
// （アクティブな航路とは限らず、「完了した航海」の📖ボタンから開いた
// アーカイブ済み航路の場合もある）。開閉状態（isOpen）もpage.tsx側で管理し、
// onOpenChangeで通知する（toggleNotebook(force)・openNotebookFor(id)相当の
// 制御をpage.tsx側から行うため）。
// チェックの切替・工程の追加・削除はそれぞれonToggleTodo/onAddTodo/onDeleteTodo経由で
// 呼び出し側（page.tsx）が行う。
export function Notebook({
  voyage,
  badgeCount,
  isOpen,
  onOpenChange,
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
}: {
  voyage: Voyage | null;
  badgeCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleTodo: (todoId: string) => void;
  onAddTodo: (text: string) => void;
  onDeleteTodo: (todoId: string) => void;
}) {
  const [newTodoText, setNewTodoText] = useState("");

  if (!voyage) return null;

  // addTodo()（1551〜1563行目）を移植。空文字は追加しない。
  const handleAddTodo = () => {
    const trimmedText = newTodoText.trim();
    if (!trimmedText) return;
    onAddTodo(trimmedText);
    setNewTodoText("");
  };

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
        onClick={() => onOpenChange(true)}
        title="工程手帳を開く"
        className="notebook-btn"
      >
        📖
        {badgeCount > 0 && <span className="nb-count">{badgeCount}</span>}
      </button>

      <div
        className={`nb-bg ${isOpen ? "open" : ""}`}
        onClick={() => onOpenChange(false)}
      />

      <div className={`notebook ${isOpen ? "open" : ""}`}>
        <div className="nb-head">
          工 程 手 帳
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="nb-close"
          >
            ×
          </button>
        </div>

        <div className="nb-sub">
          <b>{voyage.name}</b> の工程
          {voyage.archived && (
            <span className="arch-tag">（入港済・チェック可）</span>
          )}
        </div>

        {total > 0 && (
          <div className="nb-progress">
            ✓ {done} / {total}
            {done === total && done > 0 && "　— 全工程完了！"}
          </div>
        )}

        <div className="nb-hint">
          💡 工程を3つ達成するごとに宝を1つ発見！
        </div>

        <div className="nb-body">
          {total === 0 ? (
            <div className="nb-empty">
              工程を追加すると、チェックした時点までの航行時間が記録されます。
              <br />
              <br />
              すべて終えると船は全速力で目的地へ！
            </div>
          ) : (
            voyage.todos.map((todo) => {
              const lap = lapOf(todo);
              return (
                <div
                  key={todo.id}
                  onClick={() => onToggleTodo(todo.id)}
                  className={`nb-item ${todo.done ? "done" : ""}`}
                >
                  <div className="nb-check">✓</div>
                  <div className="nb-main">
                    <div className="nb-text">{todo.text}</div>
                    {todo.done && todo.elapsedAtDone != null && (
                      <div className="nb-time">
                        ⏱ {fmtDur(todo.elapsedAtDone)} 時点で完了
                        {lap != null && doneSorted.length > 1 && (
                          <span className="lap">（区間 {fmtDur(lap)}）</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    title="消す"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteTodo(todo.id);
                    }}
                    className="nb-del"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="nb-add">
          <input
            value={newTodoText}
            onChange={(event) => setNewTodoText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleAddTodo();
            }}
            placeholder="工程・Todoを追加"
          />
          <button type="button" onClick={handleAddTodo}>
            ＋
          </button>
        </div>
      </div>
    </>
  );
}
