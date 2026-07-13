import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Treasure } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// grantTreasure()内のletter抽選部分だけを取り出した同期関数。
// 呼び出し側（page.tsx）がFirestoreへの書き込み（非同期）より前に、表示する文字を
// 同期的に確定させたい場合に使う（宝獲得モーダルの表示タイミング制御のため）。
export function pickRandomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

export function useTreasures() {
  const [uid, setUid] = useState<string | null>(null);
  const [treasures, setTreasures] = useState<Treasure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeTreasures: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeTreasures?.();

      if (!user) {
        setUid(null);
        setTreasures([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);
      setLoading(true);
      const treasuresRef = collection(db, "users", user.uid, "treasures");
      unsubscribeTreasures = onSnapshot(treasuresRef, (snapshot) => {
        setTreasures(
          snapshot.docs.map((docSnap) => docSnap.data() as Treasure),
        );
        setLoading(false);
      });
    });

    return () => {
      unsubscribeTreasures?.();
      unsubscribeAuth();
    };
  }, []);

  // letterはオプショナル。省略時は内部でpickRandomLetter()を呼ぶ（従来通り）。
  // 呼び出し側が先に決めた文字をそのまま保存したい場合（宝獲得モーダルに表示した
  // 文字とFirestoreに保存される文字を一致させたい場合）は明示的に渡す。
  const grantTreasure = async (
    source: Treasure["source"],
    letter?: string,
  ) => {
    if (!uid) return;
    const resolvedLetter = letter ?? pickRandomLetter();
    const treasure: Treasure = {
      id: genId(),
      letter: resolvedLetter,
      ts: Date.now(),
      source,
    };
    await setDoc(doc(db, "users", uid, "treasures", treasure.id), treasure);
    return treasure;
  };

  return { treasures, loading, grantTreasure };
}
