import { progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// タブ切替。docs/voyage-log.html の render()内タブ生成部分（1073〜1087行目付近）を移植。
// 表示対象（!v.archivedのみ）のフィルタと、activeIdに該当が無い場合の自動選択は
// 呼び出し側（page.tsx）で行う。
export function TabBar({
  voyages,
  activeId,
  view,
  treasureCount,
  onSelectVoyage,
  onSelectCollection,
  onOpenNewVoyage,
}: {
  voyages: Voyage[];
  activeId: string | null;
  view: "chart" | "collection";
  treasureCount: number;
  onSelectVoyage: (id: string) => void;
  onSelectCollection: () => void;
  onOpenNewVoyage: () => void;
}) {
  return (
    <div className="tabs">
      {voyages.map((voyage) => {
        const isActive = view === "chart" && voyage.id === activeId;
        return (
          <button
            key={voyage.id}
            type="button"
            onClick={() => onSelectVoyage(voyage.id)}
            className={`tab${isActive ? " active" : ""}`}
          >
            {voyage.sailing ? (
              <span className="sailing-dot" />
            ) : (
              <span>⛵</span>
            )}
            <span>{voyage.name}</span>
            <span className="pct">
              {voyage.mode === "free" ? "♾" : ""}
              {Math.floor(progressOf(voyage))}%
            </span>
          </button>
        );
      })}

      <button type="button" onClick={onOpenNewVoyage} className="tab tab-new">
        ＋ 新しい航路
      </button>

      <button
        type="button"
        onClick={onSelectCollection}
        className={`tab tab-treasure${view === "collection" ? " active" : ""}`}
      >
        🪙 宝物庫 <span className="pct">{treasureCount}</span>
      </button>
    </div>
  );
}
