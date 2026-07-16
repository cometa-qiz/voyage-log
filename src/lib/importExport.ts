import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizeVoyage, type RawVoyage } from "./normalize";
import type { Treasure, Voyage } from "./types";

interface ExportPayload {
  exportedAt: string;
  schemaVersion: 5;
  voyages: Voyage[];
  treasures: Treasure[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// exportData()（docs/voyage-log.html 1714〜1721行目）のBlob+aタグ方式を移植。
// state全体ではなく、破棄済み航路を除いた（constraints.md #9）voyagesと
// treasuresのみを書き出す（view/dockOpen/muted/activeIdはFirestoreに
// 保存しない設計のため対象外）。
export async function exportVoyageLog(uid: string): Promise<void> {
  const voyagesRef = collection(db, "users", uid, "voyages");
  const activeVoyagesQuery = query(voyagesRef, where("isActive", "==", true));
  const treasuresRef = collection(db, "users", uid, "treasures");

  const [voyagesSnap, treasuresSnap] = await Promise.all([
    getDocs(activeVoyagesQuery),
    getDocs(treasuresRef),
  ]);

  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 5,
    voyages: voyagesSnap.docs.map((docSnap) => docSnap.data() as Voyage),
    treasures: treasuresSnap.docs.map((docSnap) => docSnap.data() as Treasure),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `voyage-log_${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface ImportResult {
  voyageCount: number;
  treasureCount: number;
}

function treasureKey(t: Pick<Treasure, "letter" | "ts" | "source">): string {
  return `${t.letter}|${t.ts}|${t.source}`;
}

interface ImportPayload {
  voyages: RawVoyage[];
  treasures: Partial<Treasure>[];
}

// importData()内の `if(!Array.isArray(data.voyages))throw 0;`（docs/voyage-log.html
// 1728行目）と同じ判定。呼び出し側（Header）が確認ダイアログを出す前に、
// ファイルが読み込み可能な形式かどうかを事前チェックする用途にも使う。
export function validateImportPayload(jsonText: string): ImportPayload {
  const data = JSON.parse(jsonText);
  if (!Array.isArray(data.voyages)) {
    throw new Error("invalid import data: voyages is not an array");
  }
  return {
    voyages: data.voyages as RawVoyage[],
    treasures: (
      Array.isArray(data.treasures) ? data.treasures : []
    ) as Partial<Treasure>[],
  };
}

// importData()（docs/voyage-log.html 1722〜1739行目）を移植。
// 呼び出し側で確認ダイアログ（ConfirmDialog）を経た後に呼ばれる想定。
// - 既存のアクティブ航路は物理削除せずisActive:falseへ更新する（constraints.md #8・#9）
// - インポートした航路はFirestore自動採番IDで新規ドキュメントとして追加する
//   （JSON内のidはそのまま使わない。既存ドキュメントとの衝突を避けるため）
// - 既存のtreasuresはletter+ts+sourceが完全一致する場合のみスキップし、
//   それ以外は追記する（削除・上書きは絶対禁止。constraints.md #10）
export async function importVoyageLog(
  uid: string,
  jsonText: string,
): Promise<ImportResult> {
  const { voyages: importedVoyages, treasures: importedTreasures } =
    validateImportPayload(jsonText);

  const voyagesRef = collection(db, "users", uid, "voyages");
  const treasuresRef = collection(db, "users", uid, "treasures");

  const [existingActiveSnap, existingTreasuresSnap] = await Promise.all([
    getDocs(query(voyagesRef, where("isActive", "==", true))),
    getDocs(treasuresRef),
  ]);

  const batch = writeBatch(db);

  existingActiveSnap.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isActive: false });
  });

  importedVoyages.forEach((rawVoyage) => {
    const newDocRef = doc(voyagesRef);
    const normalized = normalizeVoyage({ ...rawVoyage, id: newDocRef.id });
    batch.set(newDocRef, { ...normalized, isActive: true, schemaVersion: 5 });
  });

  const existingTreasureKeys = new Set(
    existingTreasuresSnap.docs.map((docSnap) =>
      treasureKey(docSnap.data() as Treasure),
    ),
  );

  let treasureCount = 0;
  importedTreasures.forEach((rawTreasure) => {
    if (!rawTreasure.letter || rawTreasure.ts == null || !rawTreasure.source) {
      return;
    }
    const key = treasureKey(rawTreasure as Pick<Treasure, "letter" | "ts" | "source">);
    if (existingTreasureKeys.has(key)) {
      return;
    }
    existingTreasureKeys.add(key);
    const newDocRef = doc(treasuresRef);
    const treasure: Treasure = {
      id: newDocRef.id,
      letter: rawTreasure.letter,
      ts: rawTreasure.ts,
      source: rawTreasure.source,
    };
    batch.set(newDocRef, treasure);
    treasureCount += 1;
  });

  const preferencesRef = doc(db, "users", uid, "settings", "preferences");
  batch.set(preferencesRef, { schemaVersion: 5 }, { merge: true });

  await batch.commit();

  return {
    voyageCount: importedVoyages.length,
    treasureCount,
  };
}
