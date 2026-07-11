import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Treasure } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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

  const grantTreasure = async (source: Treasure["source"]) => {
    if (!uid) return;
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const treasure: Treasure = {
      id: genId(),
      letter,
      ts: Date.now(),
      source,
    };
    await setDoc(doc(db, "users", uid, "treasures", treasure.id), treasure);
    return treasure;
  };

  return { treasures, loading, grantTreasure };
}
