export interface CheerZone {
  at: number;
  island: string;
  x: number;
  y: number;
}

export interface Route {
  d: string;
  start: [number, number];
  end: [number, number];
  island: { cx: number; cy: number };
  zones: CheerZone[];
}

export const ROUTES: Route[] = [
  // 母港(左下)→霞島の東縁→帆立岩の南縁→北東のゴール島
  {
    d: "M 85,528 C 170,495 260,455 320,400 C 380,352 350,270 420,228 C 480,196 520,170 585,148 C 660,124 760,210 828,224 C 884,235 900,170 912,108",
    start: [85, 528],
    end: [912, 108],
    island: { cx: 948, cy: 82 },
    zones: [
      { at: 30, island: "霞島", x: 300, y: 390 },
      { at: 54, island: "帆立岩", x: 560, y: 150 },
    ],
  },
  // 母港(左上)→霞島の西縁→南縁→燈台礁の北縁→南東のゴール島
  {
    d: "M 88,118 C 150,150 180,210 172,280 C 165,350 230,412 330,428 C 450,446 560,430 618,392 C 660,365 700,350 760,368 C 838,388 890,450 915,505",
    start: [88, 118],
    end: [915, 505],
    island: { cx: 950, cy: 530 },
    zones: [
      { at: 26, island: "霞島", x: 172, y: 280 },
      { at: 70, island: "燈台礁", x: 648, y: 378 },
    ],
  },
  // 母港(左中)→霞島の北縁→帆立岩の南縁→燈台礁の北西縁→東のゴール島
  {
    d: "M 85,320 C 130,268 180,232 258,216 C 340,200 400,175 470,152 C 540,132 580,145 620,175 C 680,220 660,300 720,345 C 780,388 870,340 916,300",
    start: [85, 320],
    end: [916, 300],
    island: { cx: 952, cy: 298 },
    zones: [
      { at: 22, island: "霞島", x: 258, y: 222 },
      { at: 45, island: "帆立岩", x: 500, y: 148 },
      { at: 74, island: "燈台礁", x: 700, y: 352 },
    ],
  },
];
