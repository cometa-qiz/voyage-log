"use client";

import { useState } from "react";
import { useVoyages } from "@/hooks/useVoyages";
import { useTreasures } from "@/hooks/useTreasures";
import { useActiveId, useView } from "@/hooks/useLocalSettings";
import { TabBar } from "@/components/TabBar";
import { Chart } from "@/components/Chart/Chart";
import { NewVoyageModal } from "@/components/NewVoyageModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtDur, progressOf } from "@/lib/progress";

// プロトタイプのuid()と同じ生成方式（Date.now()のbase36＋乱数）
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function Home() {
  const { voyages, createVoyage, updateVoyage, discardVoyage } = useVoyages();
  const { treasures } = useTreasures();
  const [activeId, setActiveId] = useActiveId();
  const [view, setView] = useView();
  const [isNewVoyageModalOpen, setIsNewVoyageModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  // render()内の `state.voyages.filter(v=>!v.archived)` 相当
  // （useVoyagesは既にisActive:trueのみ購読しているため、archivedのみ追加でフィルタする）
  const activeVoyages = voyages.filter((voyage) => !voyage.archived);
  const activeVoyage = activeVoyages.find((voyage) => voyage.id === activeId);

  // render()内の自動選択ロジック
  // `if(state.view==='chart'&&!activeVoyage()&&act.length)state.activeId=act[0].id;` を移植
  if (view === "chart" && !activeVoyage && activeVoyages.length > 0) {
    setActiveId(activeVoyages[0].id);
  }

  // toggleSail()/anchorShip()を移植。sessBreak()はv1では常に0（sessBreakMs:0固定・
  // pomo:null固定のため）なので休憩時間の減算ロジックは実装しない。
  // 進捗100%以上での自動入港（arrive相当）は別タスクで対応する。
  const handleToggleSail = async () => {
    if (!activeVoyage) return;

    if (activeVoyage.sailing) {
      const now = Date.now();
      const dur = Math.max(0, now - (activeVoyage.sailStart ?? now));
      const accumMs = activeVoyage.accumMs + dur;
      const updatedVoyage = {
        ...activeVoyage,
        accumMs,
        sailing: false,
        sailStart: null,
      };
      await updateVoyage(activeVoyage.id, {
        accumMs,
        sessions: [
          ...activeVoyage.sessions,
          { start: activeVoyage.sailStart ?? now, end: now },
        ],
        sailing: false,
        sailStart: null,
        logs: [
          ...activeVoyage.logs,
          {
            id: genId(),
            ts: now,
            note: `⚓ ${fmtDur(dur)} 航行して停泊`,
            pos: progressOf(updatedVoyage),
            sys: true,
          },
        ],
      });
    } else {
      await updateVoyage(activeVoyage.id, {
        sailing: true,
        sailStart: Date.now(),
      });
    }
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
          <>
            <Chart voyage={activeVoyage} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToggleSail}
                className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background"
              >
                {activeVoyage.sailing ? "⚓ 停泊する" : "⛵ 出航する"}
              </button>
              <button
                type="button"
                onClick={() => setIsDiscardConfirmOpen(true)}
                className="w-fit rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
              >
                破棄
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            航路がありません。「＋ 新しい航路」から作成してください。
          </p>
        )}
      </main>

      {isNewVoyageModalOpen && (
        <NewVoyageModal
          onClose={() => setIsNewVoyageModalOpen(false)}
          onCreate={createVoyage}
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
