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
    <div className="modal-bg open">
      <div className="modal treasure-card">
        <div className="t-chest">🪙</div>
        <div className="treasure-letter">{letter}</div>
        <p>
          工程を {achievedCount} 個達成した戦利品！
          <br />
          宝『
          <b>{letter}</b>
          』を手に入れた！
        </p>
        <button type="button" onClick={onClose} className="btn-ok">
          宝物庫にしまう
        </button>
      </div>
    </div>
  );
}
