"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, type ActiveCheer } from "@/components/Chart/Chart";
import { LogList } from "@/components/LogList";
import { useSoundContext } from "@/components/SoundProvider";
import { elapsedMs, fmtClock, fmtDur, progressOf } from "@/lib/progress";
import { ROUTES } from "@/lib/routes";
import type { Voyage } from "@/lib/types";

// CHEERS配列（docs/voyage-log.html 840〜844行目）を移植。
const CHEERS = [
  "おーい！がんばれー！",
  "いい風が吹いてるよ！",
  "その調子だ、船長！",
  "無理は禁物だよ〜",
  "ゴールはもうすぐさ！",
  "休憩も大事だぞ！",
  "良い航海を！",
  "ここまで来たんだね、すごい！",
  "追い風を送るよ！",
];

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

// animateShipTo()のease-out cubic（1324行目 `const ease=t=>1-Math.pow(1-t,3);`）を移植。
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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
  onCheer,
}: {
  voyage: Voyage;
  onToggleSail: () => void;
  onOpenNote: () => void;
  onDiscard: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onArrive: (fullSpeed: boolean) => void;
  onCheer: (island: string) => void;
}) {
  const { cheer, fullspeed } = useSoundContext();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!voyage.sailing) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [voyage.id, voyage.sailing]);

  // onArriveは呼び出し側（page.tsx）でメモ化されていない（＝毎レンダー新しい関数）
  // 可能性がある。以前、下記の入港検知effect（arrivedRef/fullSpeedArrivedRef）の
  // 依存配列にonArriveを直接含めていたところ、無制限モードの全工程完了検知直後
  // （onArrive→setArrivedVoyage→Home再レンダー→onArrive参照が変わる→…）が繰り返し発生し、
  // 実機コンソールに「Maximum update depth exceeded」が出た（現象自体は各effect内の
  // useRefガードで実害＝二重入港には至らないが、無駄な再実行が連鎖し警告の閾値を超えていた）。
  // 呼び出し側の実装（メモ化の有無）に依存せず解決するため、常に最新のonArriveをrefに
  // 保持し、入港検知effectの依存配列からはonArriveそのものを外す
  // （Refで最新関数を握る、というEffect分離の定石パターン）。
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  });

  // onArriveRefと同じ理由（呼び出し側で毎レンダー新しい関数になり得るため）で
  // onCheerもrefで保持し、下記のゾーン跨ぎ検知effectの依存配列から外す。
  const onCheerRef = useRef(onCheer);
  useEffect(() => {
    onCheerRef.current = onCheer;
  });

  // showCheer()（1349〜1362行目）の吹き出し状態。fadeout開始・DOM除去相当の
  // タイマーIDをrefで保持し、アンマウント時にクリアする（下部の専用effect）。
  const [activeCheer, setActiveCheer] = useState<ActiveCheer | null>(null);
  const cheerFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cheerRemoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // fullSpeedFinish()（1631〜1674行目）関連のref/state。二重発火防止ガード
  // （fullSpeedArrivedRef）・バナー表示state・アニメーション中フラグ・
  // バナー非表示タイマー/rAFのIDを、下記の共通アンマウントクリーンアップeffectより
  // 前に宣言する（宣言前の値を参照するとreact-hooks/immutabilityに抵触するため）。
  const fullSpeedArrivedRef = useRef(false);
  const [showFullspeedBanner, setShowFullspeedBanner] = useState(false);
  const [isFullSpeedAnimating, setIsFullSpeedAnimating] = useState(false);
  const fullSpeedAnimationFrameRef = useRef<number | null>(null);
  const fullSpeedBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cheerFadeTimeoutRef.current !== null) clearTimeout(cheerFadeTimeoutRef.current);
      if (cheerRemoveTimeoutRef.current !== null) clearTimeout(cheerRemoveTimeoutRef.current);
      if (fullSpeedBannerTimeoutRef.current !== null) clearTimeout(fullSpeedBannerTimeoutRef.current);
      if (fullSpeedAnimationFrameRef.current !== null) {
        cancelAnimationFrame(fullSpeedAnimationFrameRef.current);
      }
    };
  }, []);

  const targetProgress = progressOf(voyage);
  // voyage.todos自体（配列参照）ではなく、その内容から導いた真偽値だけを
  // 下記アニメーション用effectの依存配列に渡すために、ここで計算しておく
  // （onSnapshotは内容が同じでも毎回新しい配列参照を返すため、voyage.todosを
  // 直接依存配列に入れると無関係な書き込みのたびにeffectが再実行されてしまう。
  // 詳細はアニメーション用effect側のコメント参照）。
  const allDone =
    voyage.todos.length > 0 && voyage.todos.every((todo) => todo.done);

  // checkIslandPass()/showCheer()（1339〜1362行目）を移植。
  // 進捗アニメーション用effect（下記）とは独立した「前回チェック済み進捗」を
  // 別のrefで持つ。同じrefを共有すると、応援ゾーン跨ぎ（onCheer→updateVoyage）の
  // Firestore書き込みが引き起こすonSnapshot再取得（voyage.passed/voyage.todosの
  // 参照がその都度新しくなる）でアニメーションeffectまで巻き込んで再実行され、
  // 実行中のrequestAnimationFrameアニメーションがcancelAnimationFrameされた上で
  // displayProgressが最終値へ瞬間的にスナップしてしまう不具合があったため分離した。
  // 複数ゾーンを同時に跨いだ場合はプロトタイプのforEach同様すべて処理する
  // （SE・onCheerは各ゾーンで発火するが、吹き出し表示は最後に処理したゾーンが残る。
  // 通常は1つずつ跨ぐ想定のため実運用上の影響はない）。
  const prevZoneCheckRef = useRef(targetProgress);

  useEffect(() => {
    const before = prevZoneCheckRef.current;
    const after = targetProgress;
    prevZoneCheckRef.current = after;

    const route = ROUTES[voyage.routeIndex % ROUTES.length];
    route.zones.forEach((zone) => {
      if (before < zone.at && after >= zone.at && !voyage.passed.includes(zone.island)) {
        onCheerRef.current(zone.island);
        cheer();

        if (cheerFadeTimeoutRef.current !== null) clearTimeout(cheerFadeTimeoutRef.current);
        if (cheerRemoveTimeoutRef.current !== null) clearTimeout(cheerRemoveTimeoutRef.current);

        const message = CHEERS[Math.floor(Math.random() * CHEERS.length)];
        setActiveCheer({ island: zone.island, message, x: zone.x, y: zone.y, fadeout: false });

        cheerFadeTimeoutRef.current = setTimeout(() => {
          setActiveCheer((current) => (current ? { ...current, fadeout: true } : current));
        }, 4200);
        cheerRemoveTimeoutRef.current = setTimeout(() => {
          setActiveCheer(null);
        }, 5000);
      }
    });
  }, [targetProgress, voyage.passed, voyage.routeIndex, cheer]);

  // toggleTodo()内の無制限モード船アニメーション（1597〜1604行目
  // `if(v.mode==='free'&&isActiveChart&&!allDone&&Math.abs(after-before)>0.01){...}`）と
  // placeShip()/animateShipTo()（1309〜1336行目）を移植。
  // 表示用の進捗値（displayProgress）は通常targetProgress（progressOf(voyage)）を
  // そのまま使うが、無制限モードでの進捗変化（全工程完了時を除く・変化量0.01%超）だけ、
  // 直前の表示値からease-out cubicで1秒かけて補間する。時間目標モードの毎秒更新や
  // 航路切替（VoyagePanelはkey={voyage.id}で航路ごとに再マウントされる）では
  // 即座に反映する。
  // 依存配列はtargetProgress/voyage.mode/allDoneのみに限定する
  // （voyage.passed・voyage.todos等、内容が変わらなくても書き込みのたびに
  // 参照が変わってしまう値を直接依存配列に入れない。allDoneは真偽値なので
  // 内容が実際に変わらない限り同じ値として比較され、無関係な再実行を防げる。
  // 上記の分離の理由を参照）。
  const [displayProgress, setDisplayProgress] = useState(targetProgress);
  const prevTargetRef = useRef(targetProgress);
  const animationFrameRef = useRef<number | null>(null);

  // fullSpeedFinish()（1631〜1674行目）の起点（fromP）取得用。onArriveRefと同じ
  // Refパターンで常に最新のdisplayProgressを保持し、下記fullSpeedArrivedRef用
  // effectの依存配列にdisplayProgress自体（毎フレーム変化するstate）を
  // 含めずに済むようにする。
  const displayProgressRef = useRef(displayProgress);
  useEffect(() => {
    displayProgressRef.current = displayProgress;
  });

  useEffect(() => {
    const before = prevTargetRef.current;
    const after = targetProgress;
    prevTargetRef.current = after;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 全工程完了（allDone）の場合はこのeffectでdisplayProgressに一切触れない。
    // 直後にfullSpeedArrivedRef用effectが全速前進アニメーションを開始する際、
    // このタイミングのdisplayProgress（フリーズされた実際の進捗）をfromPとして
    // 使うため、ここでsetDisplayProgress(after)により100%へスナップさせると
    // 起点と終点が同じになりアニメーションが実質発生しなくなってしまう。
    if (allDone) {
      return;
    }

    const shouldAnimate =
      voyage.mode === "free" && Math.abs(after - before) > 0.01;

    if (!shouldAnimate) {
      setDisplayProgress(after);
      return;
    }

    const durationMs = 1000;
    const startTime = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      setDisplayProgress(before + (after - before) * easeOutCubic(t));
      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(frame);
      } else {
        animationFrameRef.current = null;
      }
    };
    animationFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [targetProgress, voyage.mode, allDone]);

  // updateLive()内 `if(v.mode!=='free'&&v.sailing&&p>=100){anchorShip(v,true);arrive(v,false);}` を移植。
  // 時間目標モードのみが対象（無制限モードの全工程完了入港は別タスク）。
  // Firestoreへの書き込みは非同期のため、書き込み完了前の次のtickで同じ条件を
  // 再検知して二重にonArrive()を呼ばないよう、arrivedRefで一度だけ発火させる
  // （プロトタイプのfinishingフラグに相当する簡易ガード）。
  // targetProgress（表示アニメーション適用前の実値）を判定に使う
  // （時間目標モードはdisplayProgressが常にtargetProgressと同値のため実質同じだが、
  // アニメーションのラグに判定が引きずられないよう生の値を直接見る）。
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (voyage.mode === "free") return;
    if (!voyage.sailing) return;
    if (targetProgress < 100) return;
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    onArriveRef.current(false);
  }, [voyage.mode, voyage.sailing, targetProgress]);

  // toggleTodo()内の全工程完了検知（1605〜1607行目
  // `if(allDone&&!v.archived){setTimeout(()=>fullSpeedFinish(v,before),...)}`）と
  // fullSpeedFinish()（1631〜1674行目）を移植。
  // allDone判定・発火はプロトタイプ側でモードを問わず発火する
  // （無制限モード限定ではない。時間目標モードでも全工程チェック完了で、
  // 目標時間が残っていても入港する。status.mdの完了確認
  // 「全工程完了で入港し、時間目標モードでは目標時間が残っていても入港する」はこの仕様）。
  // 時間目標モードの経過時間100%到達（arrivedRef用effect、上記）とはトリガーが別であり、
  // 両方が同時に条件を満たすケースはv1では考慮しない。
  // 二重発火防止はarrivedRefと同じ方針で別のrefを使う。
  useEffect(() => {
    if (voyage.archived) return;
    if (!allDone) return;
    if (fullSpeedArrivedRef.current) return;
    fullSpeedArrivedRef.current = true;

    const fromP = displayProgressRef.current;
    fullspeed();
    setShowFullspeedBanner(true);
    setIsFullSpeedAnimating(true);

    fullSpeedBannerTimeoutRef.current = setTimeout(() => {
      setShowFullspeedBanner(false);
    }, 3400);

    // イージング式（1657行目）をそのまま移植。t<.4は加速区間（(t/.4)²×.25）、
    // t>=.4は残り75%を線形補間する2段階カーブ。
    const durationMs = 3000;
    const startTime = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased =
        t < 0.4 ? (t / 0.4) * (t / 0.4) * 0.25 : 0.25 + ((t - 0.4) / 0.6) * 0.75;
      setDisplayProgress(fromP + (100 - fromP) * eased);
      if (t < 1) {
        fullSpeedAnimationFrameRef.current = requestAnimationFrame(frame);
      } else {
        fullSpeedAnimationFrameRef.current = null;
        setIsFullSpeedAnimating(false);
        onArriveRef.current(true);
      }
    };
    fullSpeedAnimationFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (fullSpeedAnimationFrameRef.current !== null) {
        cancelAnimationFrame(fullSpeedAnimationFrameRef.current);
        fullSpeedAnimationFrameRef.current = null;
      }
    };
  }, [voyage.archived, allDone, fullspeed]);

  return (
    <>
      <Chart
        voyage={voyage}
        progress={displayProgress}
        activeCheer={activeCheer}
        showFullspeedBanner={showFullspeedBanner}
        isFullSpeedAnimating={isFullSpeedAnimating}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl text-black dark:text-zinc-50">
            {displayProgress.toFixed(1)}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.08] dark:bg-white/[.145]">
          <div
            className="h-full bg-foreground"
            style={{ width: `${Math.min(100, displayProgress)}%` }}
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
