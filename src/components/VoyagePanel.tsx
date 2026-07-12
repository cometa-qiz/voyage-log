"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "@/components/Chart/Chart";
import { LogList } from "@/components/LogList";
import { elapsedMs, fmtClock, fmtDur, progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// docs/voyage-log.html の statText()（1165〜1168行目）を移植。
function statText(voyage: Voyage): string {
  if (voyage.mode === "free") {
    return `${fmtDur(elapsedMs(voyage))}（自由航路）`;
  }
  return `${fmtDur(elapsedMs(voyage))} / ${fmtDur((voyage.targetMinutes ?? 0) * 60000)}`;
}

// docs/voyage-log.html の updateLive() 内 `Math.max(0,Date.now()-v.sailStart-sessBreak(v))`
// を移植（v1ではsessBreakは常に0）。Date.now()の呼び出しをコンポーネント本体から
// 分離するためのヘルパー（react-hooks/purityルール対策。elapsedMs()と同じ扱い）。
function sailingClockMs(voyage: Voyage): number {
  if (!voyage.sailing || voyage.sailStart === null) return 0;
  return Math.max(0, Date.now() - voyage.sailStart);
}

// 選択中航路のChart・進捗表示・出航/停泊・破棄。
// docs/voyage-log.html の updateLive()（1412〜1428行目付近）のうち、
// 進捗%・統計テキスト・航行タイマー・Chart（航跡/船位置）の毎秒更新を移植。
// Firestoreへの書き込みは行わず、tick用stateをこのコンポーネント内に閉じ込めることで、
// 毎秒の再レンダーをこの航路パネルのサブツリー（Chart含む）だけに限定する
// （タブバー・モーダル・page.tsx本体は再レンダーされない）。
// 除外: updatePomoBadge/checkIslandPass（Phase 8）、無制限モードの全工程完了入港（Phase 6）、SE。
export function VoyagePanel({
  voyage,
  onToggleSail,
  onOpenNote,
  onDiscard,
  onDeleteLog,
  onArrive,
}: {
  voyage: Voyage;
  onToggleSail: () => void;
  onOpenNote: () => void;
  onDiscard: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onArrive: () => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!voyage.sailing) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [voyage.id, voyage.sailing]);

  const progress = progressOf(voyage);

  // updateLive()内 `if(v.mode!=='free'&&v.sailing&&p>=100){anchorShip(v,true);arrive(v,false);}` を移植。
  // 時間目標モードのみが対象（無制限モードの全工程完了入港は別タスク）。
  // Firestoreへの書き込みは非同期のため、書き込み完了前の次のtickで同じ条件を
  // 再検知して二重にonArrive()を呼ばないよう、arrivedRefで一度だけ発火させる
  // （プロトタイプのfinishingフラグに相当する簡易ガード）。
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (voyage.mode === "free") return;
    if (!voyage.sailing) return;
    if (progress < 100) return;
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    onArrive();
  }, [voyage.mode, voyage.sailing, progress, onArrive]);

  return (
    <>
      <Chart voyage={voyage} />

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl text-black dark:text-zinc-50">
            {progress.toFixed(1)}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.145]">
          <div
            className="h-full bg-foreground"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {statText(voyage)}
        </div>
        {voyage.sailing && voyage.sailStart !== null && (
          <div className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            {fmtClock(sailingClockMs(voyage))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleSail}
          className="w-fit rounded-full bg-foreground px-5 py-2 text-sm text-background"
        >
          {voyage.sailing ? "⚓ 停泊する" : "⛵ 出航する"}
        </button>
        <button
          type="button"
          onClick={onOpenNote}
          className="w-fit rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
        >
          ✎ 記帳する
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="w-fit rounded-full border border-black/[.08] px-5 py-2 text-sm dark:border-white/[.145]"
        >
          破棄
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold tracking-widest text-black dark:text-zinc-50">
          航 海 日 誌
        </h3>
        <LogList logs={voyage.logs} onDeleteLog={onDeleteLog} />
      </div>
    </>
  );
}
