import type { Voyage } from "./types";

// docs/voyage-log.html sessBreak()（883〜887行目）を移植。
// 現セッションの累積休憩時間（sessBreakMs）に、現在進行中の休憩フェーズの
// 経過分（あれば）を加算する。
export function sessBreak(voyage: Voyage): number {
  let b = voyage.sessBreakMs || 0;
  if (voyage.sailing && voyage.pomo && voyage.pomo.phase === "break") {
    b += Date.now() - voyage.pomo.phaseStart;
  }
  return b;
}

export function elapsedMs(voyage: Voyage): number {
  if (voyage.sailing && voyage.sailStart !== null) {
    return (
      voyage.accumMs +
      Math.max(0, Date.now() - voyage.sailStart - sessBreak(voyage))
    );
  }
  return voyage.accumMs;
}

export function progressOf(voyage: Voyage): number {
  if (voyage.archived) return 100;
  if (voyage.mode === "free") {
    if (voyage.todos.length === 0) return 0;
    return (
      (voyage.todos.filter((todo) => todo.done).length / voyage.todos.length) *
      100
    );
  }
  return Math.min(
    100,
    (elapsedMs(voyage) / ((voyage.targetMinutes ?? 0) * 60000)) * 100,
  );
}

export function fmtDur(ms: number): string {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h}時間${r}分`;
  if (h) return `${h}時間`;
  if (r) return `${r}分`;
  return "1分未満";
}

export function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
