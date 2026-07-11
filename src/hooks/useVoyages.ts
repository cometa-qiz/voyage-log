import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ROUTES } from "@/lib/routes";
import type { Todo, Voyage } from "@/lib/types";

export interface CreateVoyageInput {
  name: string;
  goal: string;
  mode: "time" | "free";
  targetMinutes: number | null;
  todoTexts: string[];
}

// プロトタイプのuid()と同じ生成方式（Date.now()のbase36＋乱数）を移植
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useVoyages() {
  const [uid, setUid] = useState<string | null>(null);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeVoyages: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeVoyages?.();

      if (!user) {
        setUid(null);
        setVoyages([]);
        setLoading(false);
        return;
      }

      setUid(user.uid);
      setLoading(true);
      const voyagesRef = collection(db, "users", user.uid, "voyages");
      const activeVoyagesQuery = query(
        voyagesRef,
        where("isActive", "==", true),
      );
      unsubscribeVoyages = onSnapshot(activeVoyagesQuery, (snapshot) => {
        setVoyages(snapshot.docs.map((docSnap) => docSnap.data() as Voyage));
        setLoading(false);
      });
    });

    return () => {
      unsubscribeVoyages?.();
      unsubscribeAuth();
    };
  }, []);

  const createVoyage = async (input: CreateVoyageInput) => {
    if (!uid) return;
    const voyagesRef = collection(db, "users", uid, "voyages");
    const id = genId();

    const todos: Todo[] = input.todoTexts.map((text) => ({
      id: genId(),
      text,
      done: false,
      doneAt: null,
      elapsedAtDone: null,
    }));

    const voyage: Voyage = {
      id,
      name: input.name,
      goal: input.goal,
      mode: input.mode,
      targetMinutes: input.targetMinutes,
      createdAt: Date.now(),
      routeIndex: voyages.length % ROUTES.length,
      sailing: false,
      sailStart: null,
      accumMs: 0,
      sessions: [],
      logs: [],
      todos,
      passed: [],
      todoRewards: 0,
      sessBreakMs: 0,
      pomo: null,
      archived: false,
      archivedAt: null,
      isActive: true,
      schemaVersion: 5,
    };

    await setDoc(doc(voyagesRef, id), voyage);
  };

  const updateVoyage = async (voyageId: string, data: Partial<Voyage>) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "voyages", voyageId), data);
  };

  const discardVoyage = async (voyageId: string) => {
    await updateVoyage(voyageId, { isActive: false });
  };

  return { voyages, loading, createVoyage, updateVoyage, discardVoyage };
}
