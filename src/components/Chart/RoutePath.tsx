import type { Route } from "@/lib/routes";

// 航路パス（未踏区間の点線・通過済みのwake実線・船位置計算用の非表示routePath）。
// docs/voyage-log.html の chartSVG() 内、母港/目的地マーク直後の3本のpathを移植。
export function RoutePath({ route, progress }: { route: Route; progress: number }) {
  return (
    <>
      <path
        d={route.d}
        fill="none"
        stroke="#C2418C"
        strokeWidth={2}
        strokeDasharray="7 7"
        opacity={0.55}
      />
      <path
        id="wake"
        d={route.d}
        fill="none"
        stroke="#C2418C"
        strokeWidth={2.6}
        pathLength={100}
        strokeDasharray={`${progress} 100`}
        strokeLinecap="round"
      />
      <path id="routePath" d={route.d} fill="none" stroke="none" />
    </>
  );
}
