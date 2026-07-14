"use client";

import { useEffect, useState } from "react";

// docs/voyage-log.html 846〜857行目のWXS/randomWx()/currentWx/setIntervalと、
// 859〜880行目のTODS/todStart/todOffset/currentTod()を移植。
// 天候・時間帯はクライアントローカルの演出用状態であり、Firestoreには保存しない
// （constraints.md：天候・時間帯はクライアントローカルで抽選する方針）。

export type WeatherKey = "wx-sunny" | "wx-cloudy" | "wx-storm";

interface Weather {
  key: WeatherKey;
  icon: string;
  label: string;
}

const WXS: Weather[] = [
  { key: "wx-sunny", icon: "☀️", label: "晴れ" },
  { key: "wx-cloudy", icon: "☁️", label: "曇り" },
  { key: "wx-storm", icon: "⛈️", label: "嵐" },
];

const WX_INTERVAL_MS = 240000;

function randomWx(): Weather {
  const r = Math.random();
  return WXS[r < 0.55 ? 0 : r < 0.85 ? 1 : 2];
}

export type TimeOfDayKey =
  | "tod-morning"
  | "tod-noon"
  | "tod-evening"
  | "tod-night"
  | "tod-midnight";

interface TimeOfDay {
  key: TimeOfDayKey;
  icon: string;
  label: string;
}

const TODS: TimeOfDay[] = [
  { key: "tod-morning", icon: "🌅", label: "朝" },
  { key: "tod-noon", icon: "🌞", label: "昼" },
  { key: "tod-evening", icon: "🌇", label: "夕" },
  { key: "tod-night", icon: "🌙", label: "夜" },
  { key: "tod-midnight", icon: "🌌", label: "深夜" },
];

const TOD_INTERVAL_MS = 600000;
const TOD_POLL_MS = 5000;

function currentTod(todStart: number, todOffset: number): TimeOfDay {
  return TODS[(todOffset + Math.floor((Date.now() - todStart) / TOD_INTERVAL_MS)) % 5];
}

export function useAmbience() {
  const [weather, setWeather] = useState<Weather>(randomWx);
  const [todStart] = useState<number>(() => Date.now());
  const [todOffset] = useState<number>(() => Math.floor(Math.random() * 5));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    currentTod(todStart, todOffset),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setWeather(randomWx());
    }, WX_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // プロトタイプの`setInterval(()=>{if(state.view==='chart')applyAmbience();},5000)`
  // （1441行目）を移植。このフックはChart表示中のみマウントされるため、
  // view==='chart'の条件チェックは不要（マウント自体がその条件を満たす）。
  useEffect(() => {
    const id = setInterval(() => {
      setTimeOfDay(currentTod(todStart, todOffset));
    }, TOD_POLL_MS);
    return () => clearInterval(id);
  }, [todStart, todOffset]);

  return { weather, timeOfDay };
}
