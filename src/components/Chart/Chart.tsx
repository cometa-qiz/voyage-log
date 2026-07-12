import { ChartBackgroundBase, ChartBackgroundOverlay } from "./ChartBackground";
import { GoalIsland } from "./GoalIsland";
import { ROUTES } from "@/lib/routes";
import type { Voyage } from "@/lib/types";

export function Chart({ voyage }: { voyage: Voyage }) {
  const route = ROUTES[voyage.routeIndex % ROUTES.length];

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
          </g>
        </svg>
      </div>
    </div>
  );
}
