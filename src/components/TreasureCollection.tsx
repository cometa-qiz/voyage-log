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
    <>
      <div className="collection-panel">
        <div className="section-title">宝 物 庫</div>

        <div className="coll-summary">
          <span>
            収集 <b>{treasures.length}</b> 個
          </span>
          <span>
            図鑑 <b>{kinds}</b> / 26 種
          </span>
        </div>

        <div className="treasure-grid">
          {LETTERS.map((letter) => {
            const count = counts[letter] ?? 0;
            const owned = count > 0;
            return (
              <div
                key={letter}
                className={`t-cell ${owned ? "owned" : "unowned"}`}
                title={owned ? `宝『${letter}』 ×${count}` : "未発見"}
              >
                <div className="t-letter">{owned ? letter : "?"}</div>
                <div className="t-count">{owned ? `×${count}` : "—"}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="empty" style={{ marginTop: "14px" }}>
        宝の入手方法：工程を3つ達成するごとに1個 ／
        航海を完了（入港）するごとに1個。全26種、同じ確率で出ます。
      </div>
    </>
  );
}
