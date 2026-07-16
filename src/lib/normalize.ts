import type { Todo, Voyage } from "./types";

type RawTodo = Partial<Todo> & Pick<Todo, "id" | "text" | "done" | "doneAt">;

export type RawVoyage = Partial<Voyage> &
  Pick<
    Voyage,
    "id" | "name" | "goal" | "createdAt" | "routeIndex" | "sailing" | "sailStart"
  > & {
    todos?: RawTodo[];
    // プロトタイプ旧版（v2〜v4）のスキーマに存在した時間指定フィールド。
    // 現行のVoyage型には無いが、インポートで古いエクスポートJSONを
    // 読み込む場合に備え、プロトタイプのnormalizeVoyage（746〜759行目）と
    // 同じフォールバックを再現する
    targetHours?: number;
  };

export function normalizeVoyage(voyage: RawVoyage): Voyage {
  const mode =
    voyage.mode ??
    (voyage.targetMinutes == null && voyage.targetHours == null
      ? "free"
      : "time");
  const targetMinutes =
    mode === "time" && voyage.targetMinutes == null
      ? (voyage.targetHours || 1) * 60
      : (voyage.targetMinutes ?? null);

  const todos: Todo[] = (voyage.todos ?? []).map((todo) => ({
    id: todo.id,
    text: todo.text,
    done: todo.done,
    doneAt: todo.doneAt,
    elapsedAtDone: todo.elapsedAtDone ?? null,
  }));

  return {
    id: voyage.id,
    name: voyage.name,
    goal: voyage.goal,
    mode,
    targetMinutes,
    createdAt: voyage.createdAt,
    routeIndex: voyage.routeIndex,
    sailing: voyage.sailing,
    sailStart: voyage.sailStart,
    accumMs: voyage.accumMs ?? 0,
    sessions: voyage.sessions ?? [],
    logs: voyage.logs ?? [],
    todos,
    passed: voyage.passed ?? [],
    todoRewards: voyage.todoRewards ?? 0,
    // v1ではポモドーロ未実装のため、入力値に関わらず常に予約値へ強制する
    sessBreakMs: 0,
    pomo: null,
    archived: voyage.archived ?? false,
    archivedAt: voyage.archivedAt ?? null,
    isActive: voyage.isActive ?? true,
    // v1のスキーマは5のみのため常に5へ補完する。将来バージョンが増えたら
    // ここでvoyage.schemaVersionを見て移行処理を分岐する
    schemaVersion: 5,
  };
}
