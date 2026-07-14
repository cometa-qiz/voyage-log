"use client";

import { useEffect, useState } from "react";

// docs/voyage-log.html 846〜857行目のWXS/randomWx()/currentWx/setIntervalを移植。
// 天候はクライアントローカルの演出用状態であり、Firestoreには保存しない
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

export function useAmbience() {
  const [weather, setWeather] = useState<Weather>(randomWx);

  useEffect(() => {
    const id = setInterval(() => {
      setWeather(randomWx());
    }, WX_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return weather;
}
