"use client";

// 宝獲得モーダル（工程宝専用）。docs/voyage-log.html の #treasureModal（718〜726行目）、
// showTreasure()（1624〜1629行目）、.treasure-card/.t-big/@keyframes tpop
// （490〜501行目、globals.cssに.treasure-letterとして移植）を移植。
// 入港宝の戦利品表示は別モーダルを重ねず、入港モーダル本文に直接追加する
// （page.tsxのarrivedVoyageモーダル側で対応、こちらは工程宝専用）。
export function TreasureModal({
  letter,
  achievedCount,
  onClose,
}: {
  letter: string;
  achievedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-xs flex-col items-center gap-1 rounded-lg bg-white p-6 text-center dark:bg-zinc-900">
        <div className="text-4xl">🪙</div>
        <div
          className="treasure-letter bg-gradient-to-br from-amber-200 via-amber-500 to-amber-800 bg-clip-text text-8xl leading-tight font-bold text-transparent"
          style={{
            fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
          }}
        >
          {letter}
        </div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          工程を {achievedCount} 個達成した戦利品！
          <br />
          宝『
          <b className="text-amber-600 dark:text-amber-400">{letter}</b>
          』を手に入れた！
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-fit rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-black"
        >
          宝物庫にしまう
        </button>
      </div>
    </div>
  );
}
