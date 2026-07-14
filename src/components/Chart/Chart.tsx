"use client";

import { useRef } from "react";
import { ChartBackgroundBase, ChartBackgroundOverlay } from "./ChartBackground";
import { GoalIsland } from "./GoalIsland";
import { PortMarkers } from "./PortMarkers";
import { RoutePath } from "./RoutePath";
import { Ship } from "@/components/Ship/Ship";
import { useAmbience } from "@/hooks/useAmbience";
import { ROUTES } from "@/lib/routes";
import { progressOf } from "@/lib/progress";
import type { Voyage } from "@/lib/types";

// showCheer()の吹き出し表示状態。VoyagePanel側のゾーン跨ぎ検知effectが生成し、
// このコンポーネントは受け取って.islander要素として描画するだけ。
export interface ActiveCheer {
  island: string;
  message: string;
  x: number;
  y: number;
  fadeout: boolean;
}

// progressはオプショナル。渡されなければprogressOf(voyage)を内部計算する
// （従来通りの挙動）。渡された場合はそちらを優先する。呼び出し側（VoyagePanel）が
// 無制限モードの船アニメーション中に補間値を渡すために使う。
export function Chart({
  voyage,
  progress: progressOverride,
  activeCheer,
  showFullspeedBanner,
  isFullSpeedAnimating,
}: {
  voyage: Voyage;
  progress?: number;
  activeCheer?: ActiveCheer | null;
  showFullspeedBanner?: boolean;
  isFullSpeedAnimating?: boolean;
}) {
  const route = ROUTES[voyage.routeIndex % ROUTES.length];
  const progress = progressOverride ?? progressOf(voyage);
  const routePathRef = useRef<SVGPathElement>(null);
  const { weather, timeOfDay } = useAmbience();

  return (
    <div className="chart-panel">
      <div className={`chart-frame ${weather.key} ${timeOfDay.key}`}>
        <svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" aria-label="海図">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#DCEBF1" />
              <stop offset="1" stopColor="#C3DCE7" />
            </linearGradient>
            <radialGradient id="lightbeam" cx="0" cy="0" r="1">
              <stop offset="0" stopColor="rgba(255,238,170,.6)" />
              <stop offset="1" stopColor="rgba(255,238,170,0)" />
            </radialGradient>
          </defs>
          <g className="chart-bg">
            <ChartBackgroundBase />
            <GoalIsland route={route} />
            <ChartBackgroundOverlay />
            <PortMarkers route={route} goal={voyage.goal} />
            <RoutePath route={route} progress={progress} routePathRef={routePathRef} />
          </g>
          <Ship
            routePathRef={routePathRef}
            route={route}
            progress={progress}
            isFullSpeedAnimating={isFullSpeedAnimating ?? false}
          />
        </svg>
        <div className="glints" />
        <div className="clouds">
          <div
            className="cloud"
            style={{ width: 180, height: 50, top: "8%", animationDuration: "70s" }}
          />
          <div
            className="cloud"
            style={{
              width: 240,
              height: 60,
              top: "30%",
              animationDuration: "95s",
              animationDelay: "-40s",
            }}
          />
          <div
            className="cloud"
            style={{
              width: 150,
              height: 44,
              top: "60%",
              animationDuration: "80s",
              animationDelay: "-20s",
            }}
          />
        </div>
        <div className="rain" />
        <div className="flash" />
        <div className="tod-tint" />
        <div className="stars" />
        <div className="wx-badge">
          <span>
            {timeOfDay.icon} {timeOfDay.label}
          </span>
          <span style={{ opacity: 0.4 }}>｜</span>
          <span>
            {weather.icon} {weather.label}
          </span>
        </div>
        {showFullspeedBanner && <div className="fullspeed-banner">全 速 前 進 ！</div>}
        {activeCheer && (
          <div
            className={`islander${activeCheer.fadeout ? " fadeout" : ""}`}
            style={{
              left: `${(activeCheer.x / 1000) * 100}%`,
              top: `${(activeCheer.y / 620) * 100}%`,
            }}
          >
            <span className="who">{activeCheer.island}のみんな</span>
            {activeCheer.message}
          </div>
        )}
      </div>
    </div>
  );
}
