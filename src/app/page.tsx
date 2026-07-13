"use client";

import { useState } from "react";
import { useVoyages } from "@/hooks/useVoyages";
import { useTreasures } from "@/hooks/useTreasures";
import { useActiveId, useView } from "@/hooks/useLocalSettings";
import { TabBar } from "@/components/TabBar";
import { VoyagePanel } from "@/components/VoyagePanel";
import { NewVoyageModal } from "@/components/NewVoyageModal";
import { NoteModal } from "@/components/NoteModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Notebook } from "@/components/Notebook";
import { TodoDock } from "@/components/TodoDock";
import { TreasureModal } from "@/components/TreasureModal";
import { elapsedMs, fmtDate, fmtDur, progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// プロトタイプのuid()と同じ生成方式（Date.now()のbase36＋乱数）
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// anchorShip(v)（停泊確定：accumMs・sessions・sailing/sailStart・自動記帳）を移植。
// toggleSail()の停泊分岐と、100%到達時の自動停泊（arrive前段）の両方から使う共通処理。
function buildAnchorUpdate(voyage: Voyage) {
  const now = Date.now();
  const dur = Math.max(0, now - (voyage.sailStart ?? now));
  const accumMs = voyage.accumMs + dur;
  const updatedVoyage = { ...voyage, accumMs, sailing: false, sailStart: null };
  return {
    accumMs,
    payload: {
      accumMs,
      sessions: [
        ...voyage.sessions,
        { start: voyage.sailStart ?? now, end: now },
      ],
      sailing: false,
      sailStart: null,
      logs: [
        ...voyage.logs,
        {
          id: genId(),
          ts: now,
          note: `⚓ ${fmtDur(dur)} 航行して停泊`,
          pos: progressOf(updatedVoyage),
          sys: true,
        },
      ],
    },
  };
}

export default function Home() {
  const { voyages, createVoyage, updateVoyage, discardVoyage } = useVoyages();
  const { treasures, grantTreasure } = useTreasures();
  const [activeId, setActiveId] = useActiveId();
  const [view, setView] = useView();
  const [isNewVoyageModalOpen, setIsNewVoyageModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [arrivedVoyage, setArrivedVoyage] = useState<{
    id: string;
    name: string;
    goal: string;
    accumMs: number;
    sessionCount: number;
    fullSpeed: boolean;
    lootLetter: string | null;
  } | null>(null);
  const [treasureModal, setTreasureModal] = useState<{
    letter: string;
    achievedCount: number;
  } | null>(null);

  // render()内の `state.voyages.filter(v=>!v.archived)` 相当
  // （useVoyagesは既にisActive:trueのみ購読しているため、archivedのみ追加でフィルタする）
  const activeVoyages = voyages.filter((voyage) => !voyage.archived);
  const activeVoyage = activeVoyages.find((voyage) => voyage.id === activeId);
  // renderArchive()の `state.voyages.filter(v=>v.archived)` 相当
  const archivedVoyages = voyages.filter((voyage) => voyage.archived);

  // render()内の自動選択ロジック
  // `if(state.view==='chart'&&!activeVoyage()&&act.length)state.activeId=act[0].id;` を移植
  if (view === "chart" && !activeVoyage && activeVoyages.length > 0) {
    setActiveId(activeVoyages[0].id);
  }

  // toggleSail()を移植。sessBreak()はv1では常に0（sessBreakMs:0固定・
  // pomo:null固定のため）なので休憩時間の減算ロジックは実装しない。
  const handleToggleSail = async () => {
    if (!activeVoyage) return;

    if (activeVoyage.sailing) {
      const { payload } = buildAnchorUpdate(activeVoyage);
      await updateVoyage(activeVoyage.id, payload);
    } else {
      await updateVoyage(activeVoyage.id, {
        sailing: true,
        sailStart: Date.now(),
      });
    }
  };

  // addNote()を移植。posは送信時点の最新progressOf(activeVoyage)で計算する
  // （モーダルを開いた時点の値を使い回さない）。
  const handleAddNote = async (note: string) => {
    if (!activeVoyage) return;
    await updateVoyage(activeVoyage.id, {
      logs: [
        ...activeVoyage.logs,
        {
          id: genId(),
          ts: Date.now(),
          note,
          pos: progressOf(activeVoyage),
          sys: false,
        },
      ],
    });
  };

  // deleteLog()を移植。constraints.mdの論理削除ルールはvoyageドキュメント単位の話であり、
  // logs配列内の要素をfilterで除去すること自体は問題ない。
  const handleDeleteLog = async (logId: string) => {
    if (!activeVoyage) return;
    await updateVoyage(activeVoyage.id, {
      logs: activeVoyage.logs.filter((log) => log.id !== logId),
    });
  };

  // toggleTodo()の基本部分（1564〜1581行目）・工程宝の判定（1585〜1596行目）を移植。
  // 無制限モードの船アニメーション前進（1597〜1604行目）・全工程完了時の入港は別タスク。
  // 宝獲得モーダル（showTreasure相当）はPhase 7の別タスクのため、今回は付与処理のみ。
  const handleToggleTodo = async (todoId: string) => {
    if (!activeVoyage) return;
    const todo = activeVoyage.todos.find((t) => t.id === todoId);
    if (!todo) return;

    if (!todo.done) {
      const elapsedAtDone = elapsedMs(activeVoyage);
      const updatedTodos = activeVoyage.todos.map((t) =>
        t.id === todoId
          ? { ...t, done: true, doneAt: Date.now(), elapsedAtDone }
          : t,
      );
      const updatedVoyage = { ...activeVoyage, todos: updatedTodos };

      // `doneCount>=3*(v.todoRewards+1)`（1589行目）を移植。
      // チェック解除方向（elseブロック）ではこの判定自体を行わない
      // （todoRewardsの減算はconstraints.md #12で禁止）。
      const doneCount = updatedTodos.filter((t) => t.done).length;
      const shouldGrantTreasure =
        doneCount >= 3 * (activeVoyage.todoRewards + 1);

      await updateVoyage(activeVoyage.id, {
        todos: updatedTodos,
        todoRewards: shouldGrantTreasure
          ? activeVoyage.todoRewards + 1
          : activeVoyage.todoRewards,
        logs: [
          ...activeVoyage.logs,
          {
            id: genId(),
            ts: Date.now(),
            note: `☑ 工程完了：${todo.text}（${fmtDur(elapsedAtDone)} 時点）`,
            pos: progressOf(updatedVoyage),
            sys: true,
          },
        ],
      });

      if (shouldGrantTreasure) {
        // showTreasure(letter,`工程を ${v.todoRewards*3} 個達成した戦利品！`)（1592〜1593行目）を移植。
        // v.todoRewardsはgrantTreasure呼び出し前に++済みのため、こちらでは更新後の値
        // （activeVoyage.todoRewards + 1）を使う。
        const treasure = await grantTreasure("todo");
        if (treasure) {
          setTreasureModal({
            letter: treasure.letter,
            achievedCount: (activeVoyage.todoRewards + 1) * 3,
          });
        }
      }
    } else {
      await updateVoyage(activeVoyage.id, {
        todos: activeVoyage.todos.map((t) =>
          t.id === todoId
            ? { ...t, done: false, doneAt: null, elapsedAtDone: null }
            : t,
        ),
      });
    }
  };

  // addTodo()（1551〜1563行目）を移植。SE.write()・入力欄フォーカスはPhase 8/UI側の関心事のため対象外。
  const handleAddTodo = async (text: string) => {
    if (!activeVoyage) return;
    const trimmedText = text.trim();
    if (!trimmedText) return;
    await updateVoyage(activeVoyage.id, {
      todos: [
        ...activeVoyage.todos,
        {
          id: genId(),
          text: trimmedText,
          done: false,
          doneAt: null,
          elapsedAtDone: null,
        },
      ],
    });
  };

  // deleteTodo()（1610〜1615行目）を移植。確認ダイアログなし（プロトタイプもconfirm()を使わない）。
  const handleDeleteTodo = async (todoId: string) => {
    if (!activeVoyage) return;
    await updateVoyage(activeVoyage.id, {
      todos: activeVoyage.todos.filter((t) => t.id !== todoId),
    });
  };

  // arrive(v,fullSpeed)の骨格版。fullSpeed=falseは時間目標モードの100%到達、
  // fullSpeed=trueは無制限モードの全工程完了検知（fullSpeedFinish()相当）から呼ばれる。
  // fullSpeedFinish()冒頭の `if(v.sailing)anchorShip(v,true);`（1636行目）の通り、
  // 停泊確定（accumMs確定・sessions追記・自動記帳）は航行中の場合のみ行う
  // （時間目標モードの呼び出し元は必ずsailing:trueの状態で呼ばれるため、従来と同じ結果になる）。
  // `const letter=grantTreasure('goal');`（arrive()内、1680行目）を移植。
  // handleArrive自体はVoyagePanel側の二重発火防止ガード（arrivedRef/fullSpeedArrivedRef、
  // およびarchived:trueの航路にはVoyagePanelがそもそもマウントされない構造）により
  // 1回の入港につき1回しか呼ばれないため、ここで再付与防止のガードを重複して
  // 持つ必要はない。全速前進アニメーション・紙吹雪・SEはPhase 7/8の別タスク。
  const handleArrive = async (fullSpeed: boolean) => {
    if (!activeVoyage) return;
    // arrive()冒頭の `closeModal('treasureModal');`（1679行目）を移植。
    // 工程が3の倍数個の航路で最後の1件をチェックすると、工程宝獲得と全工程完了入港が
    // 同一操作内で同時に発生しうる。入港処理を優先し、開いていた工程宝獲得モーダルは
    // 強制的に閉じる。
    setTreasureModal(null);
    let accumMs = activeVoyage.accumMs;
    let sessionCount = activeVoyage.sessions.length;
    if (activeVoyage.sailing) {
      const built = buildAnchorUpdate(activeVoyage);
      await updateVoyage(activeVoyage.id, built.payload);
      accumMs = built.accumMs;
      sessionCount = activeVoyage.sessions.length + 1;
    }
    const treasure = await grantTreasure("goal");
    setArrivedVoyage({
      id: activeVoyage.id,
      name: activeVoyage.name,
      goal: activeVoyage.goal,
      accumMs,
      sessionCount,
      fullSpeed,
      lootLetter: treasure?.letter ?? null,
    });
  };

  // closeArrival()を移植。閉じたタイミングでアーカイブ化し、
  // 閉じた航路がactiveIdならリセットする。
  const handleCloseArrival = async () => {
    if (!arrivedVoyage) return;
    await updateVoyage(arrivedVoyage.id, {
      archived: true,
      archivedAt: Date.now(),
    });
    if (activeId === arrivedVoyage.id) setActiveId(null);
    setArrivedVoyage(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      <TabBar
        voyages={activeVoyages}
        activeId={activeId}
        view={view}
        treasureCount={treasures.length}
        onSelectVoyage={(id) => {
          setView("chart");
          setActiveId(id);
        }}
        onSelectCollection={() => setView("collection")}
        onOpenNewVoyage={() => setIsNewVoyageModalOpen(true)}
      />

      <main className="mx-auto flex w-full max-w-[1060px] flex-1 flex-col gap-4 p-4">
        {view === "collection" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            宝物庫（図鑑グリッド表示はPhase 7で実装します）
          </p>
        ) : activeVoyage ? (
          <VoyagePanel
            key={activeVoyage.id}
            voyage={activeVoyage}
            onToggleSail={handleToggleSail}
            onOpenNote={() => setIsNoteModalOpen(true)}
            onDiscard={() => setIsDiscardConfirmOpen(true)}
            onDeleteLog={handleDeleteLog}
            onArrive={handleArrive}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            航路がありません。「＋ 新しい航路」から作成してください。
          </p>
        )}

        {view === "chart" && archivedVoyages.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold tracking-widest text-black dark:text-zinc-50">
              完 了 し た 航 海
            </h2>
            <div className="flex flex-col gap-1.5">
              {archivedVoyages.map((voyage) => (
                <div
                  key={voyage.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.08]"
                >
                  <span>🏁</span>
                  <span className="font-medium text-black dark:text-zinc-50">
                    {voyage.name}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    → {voyage.goal} ／ {fmtDur(voyage.accumMs)}・出航
                    {voyage.sessions.length}回 ／{" "}
                    {fmtDate(voyage.archivedAt ?? voyage.createdAt)} 入港
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <TodoDock voyage={view === "chart" ? (activeVoyage ?? null) : null} />

      <Notebook
        voyage={view === "chart" ? (activeVoyage ?? null) : null}
        onToggleTodo={handleToggleTodo}
        onAddTodo={handleAddTodo}
        onDeleteTodo={handleDeleteTodo}
      />

      {arrivedVoyage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg bg-white p-6 text-center dark:bg-zinc-900">
            <div className="text-4xl">{arrivedVoyage.fullSpeed ? "🚩" : "⚓"}</div>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              {arrivedVoyage.fullSpeed ? "全工程踏破・入港" : "入 港"}
            </h2>
            <p className="text-sm text-black dark:text-zinc-50">
              {arrivedVoyage.fullSpeed
                ? `全ての工程を終え、「${arrivedVoyage.name}」号は全速力で ${arrivedVoyage.goal} に入港！ 総航行 ${fmtDur(arrivedVoyage.accumMs)}・出航${arrivedVoyage.sessionCount}回の航海でした。`
                : `「${arrivedVoyage.name}」号、${arrivedVoyage.goal} に到着。総航行 ${fmtDur(arrivedVoyage.accumMs)}・出航${arrivedVoyage.sessionCount}回の航海でした。`}
            </p>
            {arrivedVoyage.lootLetter && (
              <p className="text-sm text-black dark:text-zinc-50">
                入港の戦利品：
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {arrivedVoyage.lootLetter}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={handleCloseArrival}
              className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {treasureModal && (
        <TreasureModal
          letter={treasureModal.letter}
          achievedCount={treasureModal.achievedCount}
          onClose={() => setTreasureModal(null)}
        />
      )}

      {isNewVoyageModalOpen && (
        <NewVoyageModal
          onClose={() => setIsNewVoyageModalOpen(false)}
          onCreate={createVoyage}
        />
      )}

      {isNoteModalOpen && activeVoyage && (
        <NoteModal
          voyage={activeVoyage}
          onClose={() => setIsNoteModalOpen(false)}
          onSubmit={handleAddNote}
        />
      )}

      {isDiscardConfirmOpen && activeVoyage && (
        <ConfirmDialog
          message={`「${activeVoyage.name}」を破棄しますか？一覧から表示されなくなります。`}
          onCancel={() => setIsDiscardConfirmOpen(false)}
          onConfirm={async () => {
            await discardVoyage(activeVoyage.id);
            setIsDiscardConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
}
