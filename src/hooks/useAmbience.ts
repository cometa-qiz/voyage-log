"use client";

import { useEffect, useState } from "react";
import {
  useTodStart,
  useTodOffset,
  useWeatherKey,
  useWeatherSetAt,
} from "@/hooks/useLocalSettings";

// docs/voyage-log.html 846〜857行目のWXS/randomWx()/currentWx/setIntervalと、
// 859〜880行目のTODS/todStart/todOffset/currentTod()を移植。
// 天候・時間帯はクライアントローカルの演出用状態であり、Firestoreには保存しない
// （constraints.md：天候・時間帯はクライアントローカルで抽選する方針）。
// ページ再読み込みでも継続するよう、起点値・現在値をlocalStorageに保存する
// （ユーザー要望による、プロトタイプからの意図的な拡張）。

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

function findWx(key: string): Weather {
  return WXS.find((w) => w.key === key) ?? WXS[0];
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
  const [weatherKey, setWeatherKey] = useWeatherKey();
  const [weatherSetAt, setWeatherSetAt] = useWeatherSetAt();
  const [todStart] = useTodStart();
  const [todOffset] = useTodOffset();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    currentTod(todStart, todOffset),
  );

  // マウント時、前回の天候変更から既にWX_INTERVAL_MS以上経過していれば
  // 即座に再抽選する（離れていた間の分を追いつかせる）。
  useEffect(() => {
    if (Date.now() - weatherSetAt >= WX_INTERVAL_MS) {
      const next = randomWx();
      setWeatherKey(next.key);
      setWeatherSetAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const next = randomWx();
      setWeatherKey(next.key);
      setWeatherSetAt(Date.now());
    }, WX_INTERVAL_MS);
    return () => clearInterval(id);
  }, [setWeatherKey, setWeatherSetAt]);

  // プロトタイプの`setInterval(()=>{if(state.view==='chart')applyAmbience();},5000)`
  // （1441行目）を移植。このフックはChart表示中のみマウントされるため、
  // view==='chart'の条件チェックは不要（マウント自体がその条件を満たす）。
  useEffect(() => {
    const id = setInterval(() => {
      setTimeOfDay(currentTod(todStart, todOffset));
    }, TOD_POLL_MS);
    return () => clearInterval(id);
  }, [todStart, todOffset]);

  return { weather: findWx(weatherKey), timeOfDay };
}
