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

// progressはオプショナル。渡されなければprogressOf(voyage)を内部計算する
// （従来通りの挙動）。渡された場合はそちらを優先する。呼び出し側（VoyagePanel）が
// 無制限モードの船アニメーション中に補間値を渡すために使う。
export function Chart({
  voyage,
  progress: progressOverride,
}: {
  voyage: Voyage;
  progress?: number;
}) {
  const route = ROUTES[voyage.routeIndex % ROUTES.length];
  const progress = progressOverride ?? progressOf(voyage);
  const routePathRef = useRef<SVGPathElement>(null);
  const weather = useAmbience();

  return (
    <div className="chart-panel">
      <div className={`chart-frame ${weather.key}`}>
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
          <Ship routePathRef={routePathRef} route={route} progress={progress} />
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
      </div>
    </div>
  );
}
