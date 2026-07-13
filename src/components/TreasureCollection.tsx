import type { Treasure } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// 宝物庫タブ。docs/voyage-log.html の renderCollection()（1195〜1219行目）を移植。
export function TreasureCollection({ treasures }: { treasures: Treasure[] }) {
  const counts: Record<string, number> = {};
  for (const treasure of treasures) {
    counts[treasure.letter] = (counts[treasure.letter] ?? 0) + 1;
  }
  const kinds = Object.keys(counts).length;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]">
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-black dark:text-zinc-50">
          宝 物 庫
        </h2>

        <div className="mb-4 flex flex-wrap gap-6 font-mono text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            収集{" "}
            <b className="text-base text-amber-600 dark:text-amber-400">
              {treasures.length}
            </b>{" "}
            個
          </span>
          <span>
            図鑑{" "}
            <b className="text-base text-amber-600 dark:text-amber-400">
              {kinds}
            </b>{" "}
            / 26 種
          </span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5">
          {LETTERS.map((letter) => {
            const count = counts[letter] ?? 0;
            const owned = count > 0;
            return (
              <div
                key={letter}
                title={owned ? `宝『${letter}』 ×${count}` : "未発見"}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border ${
                  owned
                    ? "border-amber-500/60 bg-amber-500/5"
                    : "border-black/[.08] dark:border-white/[.145]"
                }`}
              >
                <div
                  className={
                    owned
                      ? "bg-gradient-to-br from-amber-200 via-amber-500 to-amber-800 bg-clip-text text-3xl leading-none font-bold text-transparent"
                      : "text-3xl leading-none font-bold text-black/[.15] dark:text-white/[.15]"
                  }
                  style={
                    owned
                      ? {
                          fontFamily:
                            '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
                        }
                      : undefined
                  }
                >
                  {owned ? letter : "?"}
                </div>
                <div
                  className={`font-mono text-[11px] ${
                    owned
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {owned ? `×${count}` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="rounded-md border border-dashed border-black/[.08] p-4 text-center text-xs text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
        宝の入手方法：工程を3つ達成するごとに1個 ／
        航海を完了（入港）するごとに1個。全26種、同じ確率で出ます。
      </p>
    </div>
  );
}
