import type { Route } from "@/lib/routes";

// 母港マーク・目的地マーク（パルスアニメ）・目的地名ラベル。
// docs/voyage-log.html の chartSVG() 内、航路パスより手前（=母港/目的地マークの後）に
// 描画される部分を移植。esc()によるHTMLエスケープはJSXが自動で行うため不要。
export function PortMarkers({ route, goal }: { route: Route; goal: string }) {
  const [startX, startY] = route.start;
  const [endX, endY] = route.end;

  return (
    <g fontFamily="'Hiragino Mincho ProN','Yu Mincho',serif">
      <circle cx={startX} cy={startY} r={7} fill="#F4EFE2" stroke="#C2418C" strokeWidth={2.4} />
      <text x={startX} y={startY + 26} textAnchor="middle" fontSize={13} fill="#2E3B45">
        母港
      </text>
      <g transform={`translate(${endX},${endY})`}>
        <circle r={8} fill="none" stroke="#C2418C" strokeWidth={2} />
        <circle r={3} fill="#C2418C" />
        <circle r={14} fill="none" stroke="#C2418C" strokeWidth={1} opacity={0.5}>
          <animate attributeName="r" values="8;18" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".6;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
      <text x={endX} y={endY - 24} textAnchor="end" fontSize={14} fill="#8E2F66" fontWeight={600}>
        {goal}
      </text>
    </g>
  );
}
