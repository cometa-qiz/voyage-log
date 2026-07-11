export interface Session {
  start: number;
  end: number;
}

export interface LogEntry {
  id: string;
  ts: number;
  note: string;
  pos: number | null;
  sys: boolean;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: number | null;
  elapsedAtDone: number | null;
}

export interface Treasure {
  id: string;
  letter: string;
  ts: number;
  source: "todo" | "goal";
}

export interface Voyage {
  id: string;
  name: string;
  goal: string;
  mode: "time" | "free";
  targetMinutes: number | null;
  createdAt: number;
  routeIndex: number;
  sailing: boolean;
  sailStart: number | null;
  accumMs: number;
  sessions: Session[];
  logs: LogEntry[];
  todos: Todo[];
  passed: string[];
  todoRewards: number;
  // 【v1.5予約】現セッションの休憩累計。v1では常に0
  sessBreakMs: number;
  // 【v1.5予約】ポモドーロ状態。v1では常にnull
  pomo: null;
  archived: boolean;
  archivedAt: number | null;
  // 論理削除フラグ（Firestore用）。falseの航路は一覧・集計・書き出しの対象外とする
  isActive: boolean;
  schemaVersion: 5;
}
