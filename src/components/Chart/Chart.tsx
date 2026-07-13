"use client";

import { useRef } from "react";
import { ChartBackgroundBase, ChartBackgroundOverlay } from "./ChartBackground";
import { GoalIsland } from "./GoalIsland";
import { PortMarkers } from "./PortMarkers";
import { RoutePath } from "./RoutePath";
import { Ship } from "@/components/Ship/Ship";
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

  return (
    <div className="chart-panel">
      <div className="chart-frame">
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
      </div>
    </div>
  );
}
