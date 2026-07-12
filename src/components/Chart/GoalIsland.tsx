import type { Route } from "@/lib/routes";

// ゴール島（浅瀬＋陸地＋桟橋＋ゴール旗）。docs/voyage-log.html の goalIslandSVG(r) を移植。
// リテラル定数（rx/ry・オフセット・stroke幅・dasharray・旗の座標）は変更しないこと。
export function GoalIsland({ route }: { route: Route }) {
  const { cx, cy } = route.island;
  const [ex, ey] = route.end;

  return (
    <>
      <ellipse cx={cx} cy={cy} rx={62} ry={46} fill="#BFDDE8" />
      <ellipse cx={cx} cy={cy} rx={46} ry={33} fill="#EBDBA6" stroke="#B49B5E" strokeWidth={1.4} />
      <ellipse cx={cx + 4} cy={cy - 4} rx={24} ry={15} fill="none" stroke="#C9B478" strokeWidth={1} />
      <line
        x1={ex}
        y1={ey}
        x2={(ex + cx) / 2}
        y2={(ey + cy) / 2}
        stroke="#8A6F3E"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <line
        x1={ex}
        y1={ey}
        x2={(ex + cx) / 2}
        y2={(ey + cy) / 2}
        stroke="#B49B5E"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
      <g transform={`translate(${cx},${cy - 14})`}>
        <line x1={0} y1={0} x2={0} y2={-20} stroke="#2E3B45" strokeWidth={1.8} />
        <polygon points="0,-20 15,-14 0,-8" fill="#C2418C" />
      </g>
    </>
  );
}
