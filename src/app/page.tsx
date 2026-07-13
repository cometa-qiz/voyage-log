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
  const { treasures } = useTreasures();
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

  // toggleTodo()の基本部分（1564〜1581行目）を移植。宝の付与（1585〜1596行目）・
  // 無制限モードの船アニメーション前進（1597〜1604行目）・全工程完了時の入港は別タスク。
  const handleToggleTodo = async (todoId: string) => {
    if (!activeVoyage) return;
    const todo = activeVoyage.todos.find((t) => t.id === todoId);
    if (!todo) return;

    if (!todo.done) {
      const elapsedAtDone = elapsedMs(activeVoyage);
      const updatedVoyage = {
        ...activeVoyage,
        todos: activeVoyage.todos.map((t) =>
          t.id === todoId
            ? { ...t, done: true, doneAt: Date.now(), elapsedAtDone }
            : t,
        ),
      };
      await updateVoyage(activeVoyage.id, {
        todos: updatedVoyage.todos,
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

  // arrive(v,false)の骨格版（時間目標モードのみ）。停泊確定と同じ処理を行い、
  // 簡易な入港メッセージ用のstateをセットする。宝の付与・紙吹雪・SE・本格的な
  // 入港カードはPhase 7/8の別タスク。
  const handleArrive = async () => {
    if (!activeVoyage) return;
    const { accumMs, payload } = buildAnchorUpdate(activeVoyage);
    await updateVoyage(activeVoyage.id, payload);
    setArrivedVoyage({
      id: activeVoyage.id,
      name: activeVoyage.name,
      goal: activeVoyage.goal,
      accumMs,
      sessionCount: activeVoyage.sessions.length + 1,
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

      <Notebook
        voyage={view === "chart" ? (activeVoyage ?? null) : null}
        onToggleTodo={handleToggleTodo}
      />

      {arrivedVoyage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg bg-white p-6 text-center dark:bg-zinc-900">
            <div className="text-4xl">⚓</div>
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              入 港
            </h2>
            <p className="text-sm text-black dark:text-zinc-50">
              「{arrivedVoyage.name}」号、{arrivedVoyage.goal}{" "}
              に到着。総航行 {fmtDur(arrivedVoyage.accumMs)}・出航
              {arrivedVoyage.sessionCount}回の航海でした。
            </p>
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
