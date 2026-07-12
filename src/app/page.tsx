"use client";

import { useState } from "react";
import { useVoyages } from "@/hooks/useVoyages";
import { useTreasures } from "@/hooks/useTreasures";
import { useActiveId, useView } from "@/hooks/useLocalSettings";
import { TabBar } from "@/components/TabBar";
import { Chart } from "@/components/Chart/Chart";
import { NewVoyageModal } from "@/components/NewVoyageModal";

export default function Home() {
  const { voyages, createVoyage } = useVoyages();
  const { treasures } = useTreasures();
  const [activeId, setActiveId] = useActiveId();
  const [view, setView] = useView();
  const [isNewVoyageModalOpen, setIsNewVoyageModalOpen] = useState(false);

  // render()内の `state.voyages.filter(v=>!v.archived)` 相当
  // （useVoyagesは既にisActive:trueのみ購読しているため、archivedのみ追加でフィルタする）
  const activeVoyages = voyages.filter((voyage) => !voyage.archived);
  const activeVoyage = activeVoyages.find((voyage) => voyage.id === activeId);

  // render()内の自動選択ロジック
  // `if(state.view==='chart'&&!activeVoyage()&&act.length)state.activeId=act[0].id;` を移植
  if (view === "chart" && !activeVoyage && activeVoyages.length > 0) {
    setActiveId(activeVoyages[0].id);
  }

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

      <main className="flex flex-1 flex-col gap-4 p-4">
        {view === "collection" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            宝物庫（図鑑グリッド表示はPhase 7で実装します）
          </p>
        ) : activeVoyage ? (
          <Chart voyage={activeVoyage} />
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
    </div>
  );
}
