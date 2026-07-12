// 海図SVGの固定装飾レイヤー。座標は docs/voyage-log.html の ROUTES非依存部分（chart-bg）をそのまま移植。

const GRID_ROWS = [125, 250, 375, 500];
const GRID_COLS = [200, 400, 600, 800];

const LATITUDE_LABELS = [
  { x: 6, y: 121, text: "36°10'N" },
  { x: 6, y: 246, text: "36°00'N" },
  { x: 6, y: 371, text: "35°50'N" },
  { x: 6, y: 496, text: "35°40'N" },
];

const LONGITUDE_LABELS = [
  { x: 184, y: 614, text: "140°10'E" },
  { x: 384, y: 614, text: "140°20'E" },
  { x: 584, y: 614, text: "140°30'E" },
  { x: 784, y: 614, text: "140°40'E" },
];

const DEPTH_NUMBERS: { x: number; y: number; text: string; italic?: boolean }[] = [
  { x: 150, y: 180, text: "42" },
  { x: 330, y: 120, text: "57" },
  { x: 640, y: 80, text: "88" },
  { x: 740, y: 140, text: "104" },
  { x: 120, y: 430, text: "31" },
  { x: 380, y: 500, text: "63" },
  { x: 560, y: 540, text: "49" },
  { x: 880, y: 560, text: "72" },
  { x: 870, y: 300, text: "95" },
  { x: 420, y: 300, text: "76", italic: true },
  { x: 180, y: 560, text: "28" },
  { x: 560, y: 290, text: "67" },
];

const REEF_POINTS: [number, number][] = [
  [250, 545],
  [268, 560],
  [236, 562],
  [852, 150],
  [868, 138],
];

// ゴール島（GoalIsland）を挟む都合上、chart-bg内の描画順を保つため
// 固定装飾を「ゴール島より手前」「ゴール島より奥」の2つに分けている。
// 外枠の <g class="chart-bg"> はChart.tsx側で1つにまとめて描画する。
export function ChartBackgroundBase() {
  return (
    <>
      <rect width={1000} height={620} fill="url(#sea)" />

      <g stroke="#8FB4C4" strokeWidth={0.6} opacity={0.35}>
        {GRID_ROWS.map((y) => (
          <line key={`row-${y}`} x1={0} y1={y} x2={1000} y2={y} />
        ))}
        {GRID_COLS.map((x) => (
          <line key={`col-${x}`} x1={x} y1={0} x2={x} y2={620} />
        ))}
      </g>

      <g fontFamily="Consolas,monospace" fontSize={10} fill="#6E93A3" opacity={0.7}>
        {LATITUDE_LABELS.map(({ x, y, text }) => (
          <text key={text} x={x} y={y}>
            {text}
          </text>
        ))}
        {LONGITUDE_LABELS.map(({ x, y, text }) => (
          <text key={text} x={x} y={y}>
            {text}
          </text>
        ))}
      </g>

      <g fontFamily="Consolas,monospace" fontSize={11} fill="#5E8496" opacity={0.8}>
        {DEPTH_NUMBERS.map(({ x, y, text, italic }) => (
          <text key={`${x}-${y}`} x={x} y={y} fontStyle={italic ? "italic" : undefined}>
            {text}
          </text>
        ))}
      </g>

      <g>
        <path
          d="M 165,300 C 150,260 200,225 260,232 C 330,240 355,290 335,340 C 315,392 230,400 190,368 C 165,348 172,320 165,300 Z"
          fill="#BFDDE8"
        />
        <path
          d="M 630,430 C 625,395 680,375 740,382 C 800,390 830,430 812,470 C 792,514 700,516 660,486 C 636,468 634,450 630,430 Z"
          fill="#BFDDE8"
        />
        <path
          d="M 455,70 C 470,52 515,50 540,66 C 566,84 560,116 530,126 C 498,136 452,120 450,96 C 449,86 448,78 455,70 Z"
          fill="#BFDDE8"
        />
        <path
          d="M 185,300 C 175,270 212,244 258,250 C 312,257 332,295 316,332 C 300,372 235,378 202,352 C 183,336 190,316 185,300 Z"
          fill="#EBDBA6"
          stroke="#B49B5E"
          strokeWidth={1.4}
        />
        <path
          d="M 648,432 C 645,406 686,392 736,398 C 784,404 806,434 792,462 C 776,494 706,496 674,472 C 655,458 650,446 648,432 Z"
          fill="#EBDBA6"
          stroke="#B49B5E"
          strokeWidth={1.4}
        />
        <path
          d="M 468,76 C 480,63 512,62 530,74 C 548,87 543,108 522,115 C 499,122 466,110 465,93 C 465,86 464,81 468,76 Z"
          fill="#EBDBA6"
          stroke="#B49B5E"
          strokeWidth={1.4}
        />
        <path
          d="M 215,300 C 210,282 235,266 262,270 C 292,275 304,297 294,318 C 284,340 244,344 224,328"
          fill="none"
          stroke="#C9B478"
          strokeWidth={1}
        />
        <path
          d="M 672,434 C 672,420 698,412 728,416 C 754,420 766,436 758,452"
          fill="none"
          stroke="#C9B478"
          strokeWidth={1}
        />
        <g
          fontFamily="'Hiragino Mincho ProN','Yu Mincho',serif"
          fontSize={13}
          fill="#7A6A3E"
          fontStyle="italic"
        >
          <text x={222} y={310}>
            霞島
          </text>
          <text x={700} y={446}>
            燈台礁
          </text>
          <text x={488} y={98} fontSize={11}>
            帆立岩
          </text>
        </g>
      </g>
    </>
  );
}

export function ChartBackgroundOverlay() {
  return (
    <>
      <g transform="translate(786,404)">
        <rect x={-4} y={-20} width={8} height={20} fill="#C2418C" />
        <rect x={-6} y={-24} width={12} height={5} fill="#2E3B45" />
        <polygon points="-7,0 7,0 5,-8 -5,-8" fill="#F4EFE2" stroke="#2E3B45" strokeWidth={1} />
        <circle cx={0} cy={-22} r={2.4} fill="#FFE58A" />
        <path d="M 0,-22 L 46,-40 L 46,-6 Z" fill="url(#lightbeam)" opacity={0.8}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 -22"
            to="360 0 -22"
            dur="9s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      <g stroke="#4C6B7C" strokeWidth={1.6} opacity={0.85}>
        {REEF_POINTS.map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M ${x - 5},${y} h10 M ${x},${y - 5} v10 M ${x - 3.5},${y - 3.5} l7,7 M ${x - 3.5},${y + 3.5} l7,-7`}
          />
        ))}
      </g>
      <text
        x={228}
        y={586}
        fontFamily="'Hiragino Mincho ProN',serif"
        fontSize={10}
        fill="#4C6B7C"
        fontStyle="italic"
      >
        岩礁注意
      </text>

      <g transform="translate(905,555)" opacity={0.9}>
        <circle r={34} fill="none" stroke="#C2418C" strokeWidth={1} />
        <circle r={25} fill="none" stroke="#C2418C" strokeWidth={0.6} opacity={0.6} />
        <g fill="#C2418C">
          <polygon points="0,-32 4,-6 0,0 -4,-6" />
          <polygon points="0,32 4,6 0,0 -4,6" opacity={0.55} />
          <polygon points="-32,0 -6,4 0,0 -6,-4" opacity={0.55} />
          <polygon points="32,0 6,4 0,0 6,-4" opacity={0.55} />
        </g>
        <text
          y={-38}
          textAnchor="middle"
          fontFamily="Consolas,monospace"
          fontSize={12}
          fill="#C2418C"
          fontWeight="bold"
        >
          N
        </text>
      </g>
    </>
  );
}
