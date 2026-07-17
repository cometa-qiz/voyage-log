"use client";

import { useCallback, useRef } from "react";
import { useMuted, useVolume } from "./useLocalSettings";

// docs/voyage-log.html 775〜823行目のac()/tone()/bell()/SEオブジェクト/toggleMute()を移植。
// pomoBreak/pomoWorkはv1スコープ外（constraints.md #18・requirements.md 2章）のため実装しない。

type OscillatorTypeName = "sine" | "sawtooth" | "triangle" | "square";

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// SoundProvider（src/components/SoundProvider.tsx）が1回だけ呼び出す実装本体。
// コンポーネントから直接呼ぶ場合はuseSoundContext()（SoundProvider経由）を使うこと
// （直接useSoundImpl()を複数箇所で呼ぶと、AudioContextとmuted状態のstateが
// 呼び出し元ごとに独立してしまい、ミュート操作が他コンポーネントに反映されない）。
export function useSoundImpl() {
  const [muted, setMuted] = useMuted();
  const [volume, setVolume] = useVolume();
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ac()（777〜781行目）を移植。AudioContextはtone()の初回呼び出し
  // （＝最初のユーザー操作時）まで生成しない遅延生成方式（iOS Safari対策）。
  const ac = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioContextCtor =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      audioCtxRef.current = new AudioContextCtor!();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // tone()（782〜795行目）を移植。パラメータの意味・デフォルト値・数式は変更しない。
  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorTypeName = "sine",
      vol = 0.18,
      when = 0,
      slideTo: number | null = null,
    ) => {
      if (muted) return;
      try {
        const c = ac();
        const o = c.createOscillator();
        const g = c.createGain();
        const t = c.currentTime + when;
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * (volume / 100), t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g);
        g.connect(c.destination);
        o.start(t);
        o.stop(t + dur + 0.05);
      } catch {
        // プロトタイプの`catch(e){}`（794行目）を踏襲。AudioContext未対応環境等では無音のまま握りつぶす。
      }
    },
    [muted, ac, volume],
  );

  // bell()（796〜800行目）を移植。
  const bell = useCallback(
    (when = 0, vol = 0.16) => {
      tone(880, 1.1, "sine", vol, when);
      tone(1320, 0.7, "sine", vol * 0.4, when);
      tone(2200, 0.35, "sine", vol * 0.2, when);
    },
    [tone],
  );

  // SEオブジェクト（801〜818行目）を移植。pomoBreak/pomoWorkはv1スコープ外のため除外。
  const depart = useCallback(() => {
    tone(146, 1.3, "sawtooth", 0.1, 0, 138);
    tone(148, 1.3, "triangle", 0.1, 0, 140);
    tone(73, 1.3, "sine", 0.08);
  }, [tone]);

  const anchor = useCallback(() => {
    bell(0);
    bell(0.55);
  }, [bell]);

  const write = useCallback(() => {
    tone(660, 0.07, "triangle", 0.14);
    tone(990, 0.09, "triangle", 0.1, 0.07);
  }, [tone]);

  const todoDone = useCallback(() => {
    tone(523, 0.13, "sine", 0.16);
    tone(659, 0.13, "sine", 0.16, 0.11);
    tone(784, 0.3, "sine", 0.16, 0.22);
  }, [tone]);

  const todoUndo = useCallback(() => {
    tone(440, 0.12, "sine", 0.1);
  }, [tone]);

  const cheer = useCallback(() => {
    tone(784, 0.1, "triangle", 0.12);
    tone(988, 0.1, "triangle", 0.12, 0.09);
    tone(1175, 0.18, "triangle", 0.12, 0.18);
  }, [tone]);

  const fullspeed = useCallback(() => {
    tone(146, 2.2, "sawtooth", 0.11, 0, 160);
    tone(73, 2.4, "sine", 0.09);
    tone(55, 2.4, "square", 0.045);
  }, [tone]);

  const treasure = useCallback(() => {
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.35, "triangle", 0.13, i * 0.1));
    tone(2637, 0.5, "sine", 0.08, 0.42);
  }, [tone]);

  const arrive = useCallback(() => {
    bell(0);
    bell(0.5);
    bell(1.0);
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.6, "triangle", 0.12, 1.2 + i * 0.14));
    tone(392, 1.4, "sine", 0.08, 1.2);
  }, [bell, tone]);

  // toggleMute()（819〜823行目）を移植。muted状態はuseLocalSettingsのuseMuted()経由で
  // localStorageに永続化される（プロトタイプのsave()に相当）。
  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, [setMuted]);

  return {
    muted,
    toggleMute,
    volume,
    setVolume,
    depart,
    anchor,
    write,
    todoDone,
    todoUndo,
    cheer,
    fullspeed,
    treasure,
    arrive,
  };
}
