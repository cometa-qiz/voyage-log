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
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto p-4">
      {voyages.map((voyage) => {
        const isActive = view === "chart" && voyage.id === activeId;
        return (
          <button
            key={voyage.id}
            type="button"
            onClick={() => onSelectVoyage(voyage.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap ${
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-black/[.08] dark:border-white/[.145]"
            }`}
          >
            {voyage.sailing ? (
              <span className="sailing-dot" />
            ) : (
              <span>⛵</span>
            )}
            <span>{voyage.name}</span>
            <span className="font-mono text-xs">
              {voyage.mode === "free" ? "♾" : ""}
              {Math.floor(progressOf(voyage))}%
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onOpenNewVoyage}
        className="rounded-full border border-dashed border-black/[.08] px-4 py-1.5 text-sm whitespace-nowrap dark:border-white/[.145]"
      >
        ＋ 新しい航路
      </button>

      <button
        type="button"
        onClick={onSelectCollection}
        className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap ${
          view === "collection"
            ? "border-foreground bg-foreground text-background"
            : "border-black/[.08] dark:border-white/[.145]"
        }`}
      >
        🪙 宝物庫 <span className="font-mono text-xs">{treasureCount}</span>
      </button>
    </div>
  );
}
