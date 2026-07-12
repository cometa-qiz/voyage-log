"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { Route } from "@/lib/routes";

interface ShipPoint {
  x: number;
  y: number;
  ang: number;
}

// docs/voyage-log.html の shipPoint(path,progress) を移植。
// getTotalLength/getPointAtLengthで進捗位置の座標を求め、2px先の点との角度差から
// 進行方向（tangent）を計算する。
function shipPoint(path: SVGPathElement, progress: number): ShipPoint {
  const totalLength = path.getTotalLength();
  const length = (totalLength * Math.max(0, Math.min(100, progress))) / 100;
  const point = path.getPointAtLength(length);
  const point2 = path.getPointAtLength(Math.min(totalLength, length + 2));
  const ang = (Math.atan2(point2.y - point.y, point2.x - point.x) * 180) / Math.PI;
  return { x: point.x, y: point.y, ang };
}

// 船（船体・帆・マスト・旗）。docs/voyage-log.html の <g id="ship"> を移植。
// 揺れ（bobbing）は実装しない。fs-sprayは全速前進演出（Phase 8）用の要素のみ用意し、
// 表示切り替えロジックはここでは実装しない。
export function Ship({
  routePathRef,
  route,
  progress,
}: {
  routePathRef: RefObject<SVGPathElement | null>;
  route: Route;
  progress: number;
}) {
  const [point, setPoint] = useState<ShipPoint | null>(null);

  useEffect(() => {
    const path = routePathRef.current;
    if (!path) return;
    setPoint(shipPoint(path, progress));
    // routePathRefはuseRefの安定した参照のため依存配列には含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, progress]);

  if (!point) return null;

  return (
    <g id="ship" transform={`translate(${point.x},${point.y}) rotate(${point.ang})`}>
      <g id="shipInner">
        <g className="fs-spray" id="fsSpray" style={{ display: "none" }}>
          <line x1={-20} y1={6} x2={-34} y2={4} />
          <line x1={-20} y1={10} x2={-38} y2={11} />
          <line x1={-19} y1={13} x2={-31} y2={16} />
        </g>
        <g transform="scale(1.15)">
          <path d="M -14,4 L 14,4 L 9,11 L -9,11 Z" fill="#2E3B45" />
          <path d="M -14,4 L 14,4 L 9,10 L -9,10 Z" fill="#3E5163" />
          <rect x={-4} y={-2} width={8} height={6} fill="#F4EFE2" stroke="#2E3B45" strokeWidth={1} />
          <line x1={0} y1={-2} x2={0} y2={-16} stroke="#2E3B45" strokeWidth={1.6} />
          <path d="M 0,-16 L 11,-5 L 0,-5 Z" fill="#F4EFE2" stroke="#2E3B45" strokeWidth={1} />
          <path d="M 0,-14 L -8,-6 L 0,-6 Z" fill="#C2418C" opacity={0.9} />
        </g>
      </g>
    </g>
  );
}
