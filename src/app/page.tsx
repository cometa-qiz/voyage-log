"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVoyages } from "@/hooks/useVoyages";
import { pickRandomLetter, useTreasures } from "@/hooks/useTreasures";
import { useActiveId, useView } from "@/hooks/useLocalSettings";
import { useSoundContext } from "@/components/SoundProvider";
import { TabBar } from "@/components/TabBar";
import { VoyagePanel } from "@/components/VoyagePanel";
import { NewVoyageModal } from "@/components/NewVoyageModal";
import { NoteModal } from "@/components/NoteModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Notebook } from "@/components/Notebook";
import { TodoDock } from "@/components/TodoDock";
import { TreasureModal } from "@/components/TreasureModal";
import { TreasureCollection } from "@/components/TreasureCollection";
import { elapsedMs, fmtDate, fmtDur, progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// プロトタイプのuid()と同じ生成方式（Date.now()のbase36＋乱数）
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// arrive()内の紙吹雪生成（1691〜1699行目）を移植。50個・5色・left/duration/delayの
// 数値範囲はプロトタイプのまま。DOM操作ではなく、配列を1回だけ生成してmapで描画する。
interface ConfettiPiece {
  left: string;
  color: string;
  animationDuration: string;
  animationDelay: string;
}

const CONFETTI_COLORS = ["#C2418C", "#C9A85C", "#F4EFE2", "#BFDDE8", "#D77BB2"];

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 50 }, (_, i) => ({
    left: `${Math.random() * 100}vw`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDuration: `${2.2 + Math.random() * 2}s`,
    animationDelay: `${Math.random() * 0.8}s`,
  }));
}

// anchorShip(v)（停泊確定：accumMs・sessions・sailing/sailStart・自動記帳）を移植。
// toggleSail()の停泊分岐と、100%到達時の自動停泊（arrive前段）の両方から使う共通処理。
function buildAnchorUpdate(voyage: Voyage) {
  const now = Date.now();
  const dur = Math.max(0, now - (voyage.sailStart ?? now));
  const accumMs = voyage.accumMs + dur;
  const updatedVoyage = { ...voyage, accumMs, sailing: false, sailStart: null };
  return {
    accumMs,
    payload: {
      accumMs,
      sessions: [
        ...voyage.sessions,
        { start: voyage.sailStart ?? now, end: now },
      ],
      sailing: false,
      sailStart: null,
      logs: [
        ...voyage.logs,
        {
          id: genId(),
          ts: now,
          note: `⚓ ${fmtDur(dur)} 航行して停泊`,
          pos: progressOf(updatedVoyage),
          sys: true,
        },
      ],
    },
  };
}

export default function Home() {
  const { voyages, createVoyage, updateVoyage, discardVoyage } = useVoyages();
  const { treasures, grantTreasure } = useTreasures();
  const sound = useSoundContext();
  const [activeId, setActiveId] = useActiveId();
  const [view, setView] = useView();
  const [isNewVoyageModalOpen, setIsNewVoyageModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [arrivedVoyage, setArrivedVoyage] = useState<{
    id: string;
    name: string;
    goal: string;
    accumMs: number;
    sessionCount: number;
    fullSpeed: boolean;
    lootLetter: string | null;
  } | null>(null);
  const [treasureModal, setTreasureModal] = useState<{
    letter: string;
    achievedCount: number;
  } | null>(null);
  // arrive()内の`setTimeout(()=>SE.treasure(),1600)`（1688行目）を移植する
  // タイマーIDの保持先。setArrivedVoyage(null)（入港カードを閉じる）または
  // アンマウント時に、鳴っていない戦利品SEが遅れて鳴らないようクリアする。
  const treasureSoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  useEffect(() => {
    return () => {
      if (treasureSoundTimeoutRef.current !== null) {
        clearTimeout(treasureSoundTimeoutRef.current);
      }
    };
  }, []);
  // 紙吹雪はarrivedVoyageがセットされた（＝新しい入港が発生した）タイミングでのみ
  // 1回生成する。再レンダーのたびに再生成しないようarrivedVoyage.idに依存させる。
  const arrivedVoyageId = arrivedVoyage?.id ?? null;
  const confetti = useMemo(
    () => (arrivedVoyageId ? generateConfetti() : []),
    [arrivedVoyageId],
  );
  // nbVoyageId相当。手帳が「完了した航海」の📖ボタンから開かれている場合に
  // 対象航路のidを保持する（null時はアクティブな航路に追従）。
  const [notebookVoyageId, setNotebookVoyageId] = useState<string | null>(
    null,
  );
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  // render()内の `state.voyages.filter(v=>!v.archived)` 相当
  // （useVoyagesは既にisActive:trueのみ購読しているため、archivedのみ追加でフィルタする）
  const activeVoyages = voyages.filter((voyage) => !voyage.archived);
  const activeVoyage = activeVoyages.find((voyage) => voyage.id === activeId);
  // renderArchive()の `state.voyages.filter(v=>v.archived)` 相当
  const archivedVoyages = voyages.filter((voyage) => voyage.archived);

  // nbVoyage()（1063〜1068行目）を移植。nbVoyageId（notebookVoyageId）が設定されて
  // おり該当航路が見つかればそれを優先（archived含む全voyagesから検索）、
  // 無ければアクティブな航路に追従する。render()内でcollection表示中は
  // nbBtn自体を隠す（toggleNotebook(false)相当）仕様も反映し、view!=='chart'では常にnull。
  const notebookVoyage =
    view !== "chart"
      ? null
      : ((notebookVoyageId
          ? voyages.find((voyage) => voyage.id === notebookVoyageId)
          : undefined) ??
        activeVoyage ??
        null);

  // render()内の自動選択ロジック
  // `if(state.view==='chart'&&!activeVoyage()&&act.length)state.activeId=act[0].id;` を移植
  if (view === "chart" && !activeVoyage && activeVoyages.length > 0) {
    setActiveId(activeVoyages[0].id);
  }

  // toggleSail()を移植。sessBreak()はv1では常に0（sessBreakMs:0固定・
  // pomo:null固定のため）なので休憩時間の減算ロジックは実装しない。
  const handleToggleSail = async () => {
    if (!activeVoyage) return;

    if (activeVoyage.sailing) {
      const { payload } = buildAnchorUpdate(activeVoyage);
      sound.anchor();
      await updateVoyage(activeVoyage.id, payload);
    } else {
      sound.depart();
      await updateVoyage(activeVoyage.id, {
        sailing: true,
        sailStart: Date.now(),
      });
    }
  };

  // addNote()を移植。posは送信時点の最新progressOf(activeVoyage)で計算する
  // （モーダルを開いた時点の値を使い回さない）。
  const handleAddNote = async (note: string) => {
    if (!activeVoyage) return;
    sound.write();
    await updateVoyage(activeVoyage.id, {
      logs: [
        ...activeVoyage.logs,
        {
          id: genId(),
          ts: Date.now(),
          note,
          pos: progressOf(activeVoyage),
          sys: false,
        },
      ],
    });
  };

  // deleteLog()を移植。constraints.mdの論理削除ルールはvoyageドキュメント単位の話であり、
  // logs配列内の要素をfilterで除去すること自体は問題ない。
  const handleDeleteLog = async (logId: string) => {
    if (!activeVoyage) return;
    await updateVoyage(activeVoyage.id, {
      logs: activeVoyage.logs.filter((log) => log.id !== logId),
    });
  };

  // toggleTodo()の基本部分（1564〜1581行目）・工程宝の判定（1585〜1596行目）を移植。
  // アーカイブ済み航海でも工程チェック・工程宝の獲得は有効なため、activeVoyageではなく
  // notebookVoyage（手帳が表示している航路。nbVoyage()相当）を対象にする。
  // 無制限モードの船アニメーション前進（1597〜1604行目）・全工程完了時の入港は別タスク。
  const handleToggleTodo = async (todoId: string) => {
    if (!notebookVoyage) return;
    const todo = notebookVoyage.todos.find((t) => t.id === todoId);
    if (!todo) return;

    if (!todo.done) {
      const elapsedAtDone = elapsedMs(notebookVoyage);
      const updatedTodos = notebookVoyage.todos.map((t) =>
        t.id === todoId
          ? { ...t, done: true, doneAt: Date.now(), elapsedAtDone }
          : t,
      );
      const updatedVoyage = { ...notebookVoyage, todos: updatedTodos };

      // `doneCount>=3*(v.todoRewards+1)`（1589行目）を移植。
      // チェック解除方向（elseブロック）ではこの判定自体を行わない
      // （todoRewardsの減算はconstraints.md #12で禁止）。
      const doneCount = updatedTodos.filter((t) => t.done).length;
      const shouldGrantTreasure =
        doneCount >= 3 * (notebookVoyage.todoRewards + 1);

      // 宝獲得モーダルと入港モーダルの表示順序バグ（工程が3の倍数個の航路で
      // 最後の1件をチェックすると、無制限モードの全工程完了検知がonSnapshotの
      // ローカル楽観反映だけで即座にhandleArriveを呼ぶため、2回のFirestore書き込み
      // （updateVoyage→grantTreasure）完了を待つ従来のsetTreasureModal呼び出しより
      // 必ず先に走ってしまっていた）の修正。letterはMath.random()による同期計算
      // （pickRandomLetter()）なのでawaitより前に確定でき、setTreasureModal(...)を
      // ここで同期的に呼ぶことで、直後のupdateVoyage()を起点にVoyagePanel側の
      // 入港検知effectが（別のレンダーサイクルで）handleArriveを呼ぶより確実に先に
      // 実行される。実際にFirestoreへ保存するletterも同じ値を使う。
      let treasureLetter: string | null = null;
      if (shouldGrantTreasure) {
        treasureLetter = pickRandomLetter();
        // showTreasure(letter,`工程を ${v.todoRewards*3} 個達成した戦利品！`)（1592〜1593行目）を移植。
        // v.todoRewardsはgrantTreasure呼び出し前に++済みのため、こちらでは更新後の値
        // （notebookVoyage.todoRewards + 1）を使う。
        setTreasureModal({
          letter: treasureLetter,
          achievedCount: (notebookVoyage.todoRewards + 1) * 3,
        });
      }

      sound.todoDone();
      await updateVoyage(notebookVoyage.id, {
        todos: updatedTodos,
        todoRewards: shouldGrantTreasure
          ? notebookVoyage.todoRewards + 1
          : notebookVoyage.todoRewards,
        logs: [
          ...notebookVoyage.logs,
          {
            id: genId(),
            ts: Date.now(),
            note: `☑ 工程完了：${todo.text}（${fmtDur(elapsedAtDone)} 時点）`,
            pos: progressOf(updatedVoyage),
            sys: true,
          },
        ],
      });

      if (treasureLetter) {
        await grantTreasure("todo", treasureLetter);
        sound.treasure();
      }
    } else {
      sound.todoUndo();
      await updateVoyage(notebookVoyage.id, {
        todos: notebookVoyage.todos.map((t) =>
          t.id === todoId
            ? { ...t, done: false, doneAt: null, elapsedAtDone: null }
            : t,
        ),
      });
    }
  };

  // addTodo()（1551〜1563行目）を移植。notebookVoyage（手帳が表示している航路）が対象。
  // SE.write()・入力欄フォーカスはPhase 8/UI側の関心事のため対象外。
  const handleAddTodo = async (text: string) => {
    if (!notebookVoyage) return;
    const trimmedText = text.trim();
    if (!trimmedText) return;
    sound.write();
    await updateVoyage(notebookVoyage.id, {
      todos: [
        ...notebookVoyage.todos,
        {
          id: genId(),
          text: trimmedText,
          done: false,
          doneAt: null,
          elapsedAtDone: null,
        },
      ],
    });
  };

  // deleteTodo()（1610〜1615行目）を移植。notebookVoyage（手帳が表示している航路）が対象。
  // 確認ダイアログなし（プロトタイプもconfirm()を使わない）。
  const handleDeleteTodo = async (todoId: string) => {
    if (!notebookVoyage) return;
    await updateVoyage(notebookVoyage.id, {
      todos: notebookVoyage.todos.filter((t) => t.id !== todoId),
    });
  };

  // checkIslandPass()（1339〜1348行目）内の`v.passed.push(z.island);save();`部分を移植。
  // SE再生・吹き出し表示・ゾーン跨ぎ判定自体はVoyagePanel側のeffectで行い、
  // ここではpassedへの永続化のみを担当する（Firestore書き込み完了を待たない
  // fire-and-forgetでよい：応援表示自体は既にローカルstateで即座に行われているため）。
  const handleCheer = (island: string) => {
    if (!activeVoyage) return;
    void updateVoyage(activeVoyage.id, {
      passed: [...activeVoyage.passed, island],
    });
  };

  // toggleNotebook(force)（1239〜1250行目）を移植。閉じたら
  // `if(!open)nbVoyageId=null;`（1244行目）の通りnotebookVoyageIdをリセットし、
  // アクティブな航路の表示に戻す。
  const handleNotebookOpenChange = (open: boolean) => {
    setIsNotebookOpen(open);
    if (!open) {
      setNotebookVoyageId(null);
    }
  };

  // openNotebookFor(id)（1251〜1254行目）を移植。「完了した航海」の
  // 「📖 工程 n/m」ボタンから、対象のアーカイブ済み航路を指定して手帳を開く。
  const handleOpenNotebookFor = (voyageId: string) => {
    setNotebookVoyageId(voyageId);
    setIsNotebookOpen(true);
  };

  // arrive(v,fullSpeed)の骨格版。fullSpeed=falseは時間目標モードの100%到達、
  // fullSpeed=trueは無制限モードの全工程完了検知（fullSpeedFinish()相当）から呼ばれる。
  // fullSpeedFinish()冒頭の `if(v.sailing)anchorShip(v,true);`（1636行目）の通り、
  // 停泊確定（accumMs確定・sessions追記・自動記帳）は航行中の場合のみ行う
  // （時間目標モードの呼び出し元は必ずsailing:trueの状態で呼ばれるため、従来と同じ結果になる）。
  // `const letter=grantTreasure('goal');`（arrive()内、1680行目）を移植。
  // handleArrive自体はVoyagePanel側の二重発火防止ガード（arrivedRef/fullSpeedArrivedRef、
  // およびarchived:trueの航路にはVoyagePanelがそもそもマウントされない構造）により
  // 1回の入港につき1回しか呼ばれないため、ここで再付与防止のガードを重複して
  // 持つ必要はない。全速前進アニメーション・紙吹雪・SEはPhase 7/8の別タスク。
  const handleArrive = async (fullSpeed: boolean) => {
    if (!activeVoyage) return;
    // arrive()冒頭の `SE.arrive();`（1678行目）を移植。
    sound.arrive();
    // arrive()内の `closeModal('treasureModal');`（1679行目）を移植。
    // 工程が3の倍数個の航路で最後の1件をチェックすると、工程宝獲得と全工程完了入港が
    // 同一操作内で同時に発生しうる。入港処理を優先し、開いていた工程宝獲得モーダルは
    // 強制的に閉じる。
    setTreasureModal(null);
    let accumMs = activeVoyage.accumMs;
    let sessionCount = activeVoyage.sessions.length;
    if (activeVoyage.sailing) {
      const built = buildAnchorUpdate(activeVoyage);
      await updateVoyage(activeVoyage.id, built.payload);
      accumMs = built.accumMs;
      sessionCount = activeVoyage.sessions.length + 1;
    }
    const treasure = await grantTreasure("goal");
    // `setTimeout(()=>SE.treasure(),1600)`（1688行目）を移植。
    if (treasureSoundTimeoutRef.current !== null) {
      clearTimeout(treasureSoundTimeoutRef.current);
    }
    treasureSoundTimeoutRef.current = setTimeout(() => {
      sound.treasure();
      treasureSoundTimeoutRef.current = null;
    }, 1600);
    setArrivedVoyage({
      id: activeVoyage.id,
      name: activeVoyage.name,
      goal: activeVoyage.goal,
      accumMs,
      sessionCount,
      fullSpeed,
      lootLetter: treasure?.letter ?? null,
    });
  };

  // closeArrival()を移植。閉じたタイミングでアーカイブ化し、
  // 閉じた航路がactiveIdならリセットする。
  const handleCloseArrival = async () => {
    if (!arrivedVoyage) return;
    // 入港カードを閉じた時点で、未再生の戦利品SEタイマーが残っていれば
    // 鳴らさずに破棄する（不要な遅延SE対策）。
    if (treasureSoundTimeoutRef.current !== null) {
      clearTimeout(treasureSoundTimeoutRef.current);
      treasureSoundTimeoutRef.current = null;
    }
    await updateVoyage(arrivedVoyage.id, {
      archived: true,
      archivedAt: Date.now(),
    });
    if (activeId === arrivedVoyage.id) setActiveId(null);
    setArrivedVoyage(null);
  };

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <TabBar
        voyages={activeVoyages}
        activeId={activeId}
        view={view}
        treasureCount={treasures.length}
        onSelectVoyage={(id) => {
          setView("chart");
          setActiveId(id);
        }}
        onSelectCollection={() => {
          setView("collection");
          // render()内 `if(state.view==='collection'){nbBtn.style.display='none';
          // ...toggleNotebook(false);}`（1092〜1095行目）を移植。宝物庫表示中は
          // 手帳を閉じ、開いていたアーカイブ済み航路の指定もリセットする。
          setIsNotebookOpen(false);
          setNotebookVoyageId(null);
        }}
        onOpenNewVoyage={() => setIsNewVoyageModalOpen(true)}
      />

      <main className="mx-auto flex w-full max-w-[1060px] flex-1 flex-col gap-4 p-4">
        {view === "collection" ? (
          <TreasureCollection treasures={treasures} />
        ) : activeVoyage ? (
          <VoyagePanel
            key={activeVoyage.id}
            voyage={activeVoyage}
            onToggleSail={handleToggleSail}
            onOpenNote={() => setIsNoteModalOpen(true)}
            onDiscard={() => setIsDiscardConfirmOpen(true)}
            onDeleteLog={handleDeleteLog}
            onArrive={handleArrive}
            onCheer={handleCheer}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            航路がありません。「＋ 新しい航路」から作成してください。
          </p>
        )}

        {view === "chart" && archivedVoyages.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold tracking-widest text-black dark:text-zinc-50">
              完 了 し た 航 海
            </h2>
            <div className="flex flex-col gap-1.5">
              {archivedVoyages.map((voyage) => (
                <div
                  key={voyage.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.08]"
                >
                  <span>🏁</span>
                  <span className="font-medium text-black dark:text-zinc-50">
                    {voyage.name}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    → {voyage.goal} ／ {fmtDur(voyage.accumMs)}・出航
                    {voyage.sessions.length}回 ／{" "}
                    {fmtDate(voyage.archivedAt ?? voyage.createdAt)} 入港
                  </span>
                  {voyage.todos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenNotebookFor(voyage.id)}
                      className="rounded-full border border-black/[.08] px-3 py-1 text-xs dark:border-white/[.145]"
                    >
                      📖 工程 {voyage.todos.filter((t) => t.done).length}/
                      {voyage.todos.length}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <TodoDock voyage={view === "chart" ? (activeVoyage ?? null) : null} />

      <Notebook
        voyage={notebookVoyage}
        badgeCount={activeVoyage ? activeVoyage.todos.filter((t) => !t.done).length : 0}
        isOpen={isNotebookOpen}
        onOpenChange={handleNotebookOpenChange}
        onToggleTodo={handleToggleTodo}
        onAddTodo={handleAddTodo}
        onDeleteTodo={handleDeleteTodo}
      />

      {arrivedVoyage && (
        <div className="arrival">
          {confetti.map((piece, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: piece.left,
                background: piece.color,
                animationDuration: piece.animationDuration,
                animationDelay: piece.animationDelay,
              }}
            />
          ))}
          <div className="arrival-card">
            <div className="flag">{arrivedVoyage.fullSpeed ? "🚩" : "⚓"}</div>
            <h2>{arrivedVoyage.fullSpeed ? "全工程踏破・入港" : "入 港"}</h2>
            <p>
              {arrivedVoyage.fullSpeed
                ? `全ての工程を終え、「${arrivedVoyage.name}」号は全速力で ${arrivedVoyage.goal} に入港！ 総航行 ${fmtDur(arrivedVoyage.accumMs)}・出航${arrivedVoyage.sessionCount}回の航海でした。`
                : `「${arrivedVoyage.name}」号、${arrivedVoyage.goal} に到着。総航行 ${fmtDur(arrivedVoyage.accumMs)}・出航${arrivedVoyage.sessionCount}回の航海でした。`}
            </p>
            {arrivedVoyage.lootLetter && (
              <div className="arrival-loot">
                入港の戦利品：
                <span className="loot-letter">{arrivedVoyage.lootLetter}</span>
              </div>
            )}
            <button type="button" onClick={handleCloseArrival} className="btn-ok">
              航海を記録に残す
            </button>
          </div>
        </div>
      )}

      {treasureModal && (
        <TreasureModal
          letter={treasureModal.letter}
          achievedCount={treasureModal.achievedCount}
          onClose={() => setTreasureModal(null)}
        />
      )}

      {isNewVoyageModalOpen && (
        <NewVoyageModal
          onClose={() => setIsNewVoyageModalOpen(false)}
          onCreate={createVoyage}
        />
      )}

      {isNoteModalOpen && activeVoyage && (
        <NoteModal
          voyage={activeVoyage}
          onClose={() => setIsNoteModalOpen(false)}
          onSubmit={handleAddNote}
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
