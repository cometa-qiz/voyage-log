"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSoundImpl } from "@/hooks/useSound";

// useSoundImpl()（AudioContext・muted状態を内部で持つ）をアプリ全体で1回だけ
// 生成し、Contextで配下に配る。コンポーネントごとにuseSoundImpl()を直接呼ぶと
// AudioContextが重複生成され、ミュート状態の切り替えも呼び出し元ごとに
// バラバラになってしまうため、必ずこのProvider経由（useSoundContext）で使うこと。
type SoundContextValue = ReturnType<typeof useSoundImpl>;

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sound = useSoundImpl();
  return <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>;
}

export function useSoundContext(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSoundContext must be used within a SoundProvider");
  }
  return ctx;
}
