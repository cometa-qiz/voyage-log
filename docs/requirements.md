# 作業の航海日誌 要件定義書

> バージョン: 1.0
> 作成日: 2026-07-03
> 挙動リファレンス: `docs/voyage-log.html`（プロトタイプ・単一HTML版 v5）

---

## 1. プロジェクト概要

取り組んでいる作業・プロジェクトを「航海」に見立て、作業するたびに海図上で
船が目的地へ少しずつ進むタスク・記録アプリ。

1つの作業＝1つの「航路」として管理し、複数のプロジェクトを並行して進められる。
作業時間の記録（出航／停泊）、工程（Todo）の管理、航海日誌（メモ）、
宝集め（コレクション要素）を通じて、「使っていて楽しい」日常使いを最優先とする。

スマートフォン・PCの両方から同一データにアクセスでき、複数のデバイスで
開いても状態（航行中かどうか・進捗・工程）が一致する設計とする。

アプリ名は「作業の航海日誌」。プロトタイプとして完成済みの `voyage-log.html` が
**UI・演出・ゲームロジックの正**であり、本実装はその移植＋Firebase対応である。

---

## 2. スコープ

### v1（今回実装する範囲）

| # | 機能 |
|---|------|
| 1 | コアループ：航路（プロジェクト）管理、工程（Todo）管理、出航／停泊、船の進捗・移動、航海日誌ログ |
| 2 | 複数航路の並行管理（タブ切替） |
| 3 | アーカイブ管理（完了済み航海でも工程チェック・宝獲得が可能） |
| 4 | 宝物庫（工程3個達成ごと・入港ごとにA〜Zの宝を獲得、図鑑グリッド表示） |
| 5 | 天候システム（ランダム切替）・時間帯システム（朝〜深夜の巡回） |
| 6 | SE（Web Audio APIによる合成音・ミュート機能） |
| 7 | 入港演出（紙吹雪・戦利品表示）・全速前進演出（全工程完了時） |
| 8 | 無制限モード（時間ではなく工程達成率で船が進む） |
| 9 | Todoドロワー（画面左端の常時表示パネル・クリック開閉） |
| 10 | インポート／エクスポート（JSON） |
| 11 | Googleサインイン・Firestore同期・Firebase Hostingデプロイ |

### v1.5送り（今回は対象外）

| 機能 | 送りの理由 |
|------|-----------|
| ポモドーロモード（25分作業／5分休憩、休憩中は航行時間停止） | タイマー状態（phase / phaseStart / sessBreakMs）の永続化・複数デバイス間同期の設計を別途検討する |

> ポモドーロ関連のデータフィールド（`sessBreakMs` / `pomo`）はスキーマ上は**予約フィールドとして残す**。
> v1では常に `sessBreakMs: 0` / `pomo: null` とし、UIを実装しない。

---

## 3. 技術スタック

| レイヤー | 採用技術 | 理由 |
|---------|---------|------|
| フロントエンド | Next.js + TypeScript | App Router採用・静的エクスポートでFirebase Hostingに対応（Yggd-memoと同構成） |
| スタイリング | Tailwind CSS + 素のCSS | 海図SVG・天候／時間帯オーバーレイ・ドロワーのアニメーションは素のCSSで実装 |
| アニメーション | CSS Transition + requestAnimationFrame | 船のpath沿い移動（getPointAtLength）はrAFで実装。追加ライブラリは導入しない |
| 効果音 | Web Audio API（合成音のみ） | 音源ファイル不使用（著作権フリー・容量ゼロ）。プロトタイプの`tone()`/`bell()`合成を移植 |
| データベース | Firebase Firestore | リアルタイム同期・無料枠が広い |
| 認証 | Firebase Authentication（Google Sign-in） | 複数デバイス間のデータ同期に必要 |
| ホスティング | Firebase Hosting | Firestoreと同一プロジェクトで管理可能 |
| パッケージマネージャー | pnpm | npm install禁止のルールを踏襲 |

### Next.js 設定方針（Yggd-memoを踏襲）

- **App Router**（`src/app/`）＋ **Static Export**（`output: 'export'`）
- Firestoreアクセスはすべてクライアントサイド。SSR・APIルートは使用しない
- URLに航路IDなどの動的な値は含めない
- ビルド成果物は `out/` に出力し、Firebase Hostingで配信する

---

## 4. データモデル

### 4.1 現行データ構造（プロトタイプ・localStorage）

プロトタイプはキー `voyage-log-v5` にアプリ全状態を1つのJSONで保存している。
**この構造がFirestoreスキーマの出発点である。**

```typescript
// ルート状態（localStorage 'voyage-log-v5' の中身）
interface AppState {
  voyages: Voyage[];
  activeId: string | null;     // 表示中の航路ID
  muted: boolean;              // SEミュート
  treasures: Treasure[];       // 獲得した宝（追記専用）
  view: 'chart' | 'collection';// 海図表示 or 宝物庫表示
  dockOpen: boolean;           // Todoドロワーの開閉状態
}

interface Voyage {
  id: string;                  // uid（base36タイムスタンプ＋乱数）
  name: string;                // 船名（＝作業・プロジェクト名）
  goal: string;                // 目的地名（＝ゴールの名前）
  mode: 'time' | 'free';       // 時間目標 / 無制限
  targetMinutes: number | null;// 目標作業時間（分）。freeモードはnull
  createdAt: number;           // 作成時刻（ms epoch）
  routeIndex: number;          // 航路パターン（作成順 % 3）
  sailing: boolean;            // 航行中フラグ
  sailStart: number | null;    // 現セッションの出航時刻（ms epoch）
  accumMs: number;             // 確定済み累積航行時間（ms）
  sessions: Session[];         // 出航セッション履歴
  logs: LogEntry[];            // 航海日誌（手動メモ＋システム記帳）
  todos: Todo[];               // 工程
  passed: string[];            // 応援メッセージ表示済みの島名
  todoRewards: number;         // 工程宝の排出済み回数（※減算禁止）
  sessBreakMs: number;         // 【v1.5予約】現セッションの休憩累計。v1では常に0
  pomo: null;                  // 【v1.5予約】ポモドーロ状態。v1では常にnull
  archived: boolean;           // 入港済み（アーカイブ）
  archivedAt: number | null;
}

interface Session { start: number; end: number; }   // ms epoch

interface LogEntry {
  id: string;
  ts: number;                  // 記帳時刻（ms epoch）
  note: string;                // 本文
  pos: number | null;          // 記帳時点の進捗%（小数）。不明はnull
  sys: boolean;                // true=システム自動記帳（停泊・工程完了）
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: number | null;       // チェック時刻（ms epoch）
  elapsedAtDone: number | null;// チェック時点の累積航行時間（ms）＝「そこまでにかかった時間」
}

interface Treasure {
  id: string;
  letter: string;              // 'A'〜'Z'
  ts: number;                  // 獲得時刻（ms epoch）
  source: 'todo' | 'goal';     // 工程3個達成 / 入港
}
```

### 4.2 スキーマバージョンの変遷（参考）

| localStorageキー | 主な変更 |
|-----------------|---------|
| `voyage-log-v1` | 分単位の手動記録（`logs[].minutes`） |
| `voyage-log-v2` | セッション型に変更（`accumMs` / `sessions`）、Todo・時間計測を追加 |
| `voyage-log-v3` | `targetMinutes`化、工程手帳、島の応援（`passed`） |
| `voyage-log-v4` | 宝（`treasures` / `todoRewards`）、ポモドーロ（`sessBreakMs` / `pomo`） |
| `voyage-log-v5` | `mode`（無制限）、`dockOpen` |

プロトタイプは起動時に旧キーを検出して自動変換（`normalizeVoyage()`）している。
本実装ではFirestoreドキュメントに `schemaVersion: 5` を持たせ、
将来の変更時に同様のマイグレーション関数で吸収する方針とする。

### 4.3 Firestoreスキーマ

```
users/{userId}/
├── settings/preferences        # 1ドキュメント
│     { schemaVersion: 5 }
├── voyages/{voyageId}          # 1航路＝1ドキュメント
│     { Voyage の全フィールド（logs / todos / sessions / passed は配列で埋め込み）
│       ＋ isActive: boolean（論理削除フラグ）
│       ＋ schemaVersion: 5 }
└── treasures/{treasureId}      # 1宝＝1ドキュメント（追記専用）
      { letter, ts, source }
```

**設計判断**

| 論点 | 決定 | 理由 |
|------|------|------|
| logs/todos/sessionsをサブコレクションにするか | **埋め込み配列** | 1航路のログは高々数百件・1件約100バイトで、1MB/ドキュメント制限に対して十分小さい。原子的に更新でき、読み取り回数も1回で済む |
| treasuresを配列にするか | **別コレクション** | 追記専用で無限に増えるため。図鑑表示は全件取得して集計する |
| `activeId` / `view` / `dockOpen` / `muted` | **Firestoreに保存しない（localStorage）** | 「どの航路を見ているか」「ドロワーが開いているか」はデバイスごとに異なるのが自然 |
| `sailing` / `sailStart` | **Firestoreに保存する** | 出航状態が全デバイスで一致し、どの端末でも `now - sailStart` で同じ進捗が計算できる |
| 航路の削除（「破棄」） | **論理削除（`isActive: false`）** | Yggd-memoの方針を踏襲。復元不可能な事故を防ぐ。一覧・集計は `isActive: true` のみ対象 |

### 4.4 リアルタイム同期の方針

| 対象 | 同期する | 理由 |
|------|---------|------|
| 航路の全データ（進捗・工程・日誌・出航状態） | する | 複数デバイスで作業状態を一致させる |
| 宝（treasures） | する | 図鑑はアカウント単位のコレクション |
| 天候・時間帯 | **しない** | 演出はクライアントローカルで抽選する（デバイスごとに違う空でよい） |
| activeId / view / dockOpen / muted | しない | デバイスごとの表示設定 |

- 進捗%は**保存しない**（`accumMs` / `sailStart` / `targetMinutes` / todosから毎回計算する派生値）
- 航行中の毎秒更新はクライアント内の計算のみで行い、**Firestoreへの書き込みは
  状態が変わるイベント時のみ**（出航・停泊・記帳・工程チェック・入港など）

---

## 5. 機能要件

### 5.1 航路（プロジェクト）管理

- 新規作成時の入力: 船名（必須）／目的地名（必須）／モード（時間目標 or 無制限）／
  目標時間（時間目標モードのみ・時間0〜50＋分5刻みのプルダウン・合計1分以上）／
  工程（テキストエリア・1行1件・無制限モードでは1件以上必須）
- `routeIndex` は作成順に `全航路数 % 3` で自動割当（3種の航路パターンをローテーション）
- 破棄は確認ダイアログを経て論理削除
- タブで航路を切替。タブには航行中インジケータ（緑点滅）または⛵、
  無制限モードは「♾」プレフィックス付きの進捗%を表示

### 5.2 出航／停泊と時間計測

- 「⛵ 出航する」で `sailing: true, sailStart: now` に更新（SE: 汽笛）
- 「⚓ 停泊する」で `accumMs += now - sailStart` を確定し、`sessions` に追記、
  日誌に「⚓ ◯時間◯分 航行して停泊」を自動記帳（SE: 号鐘×2）
- 累積航行時間の計算式（**この方式を崩さないこと。constraints.md #11参照**）:
  `elapsedMs = accumMs + (sailing ? now - sailStart : 0)`
  - タブを閉じても実時間で進み続けるのは仕様（停泊し忘れはユーザー責任）
- 航行中は1秒ごとに進捗%・航行距離・航跡・船位置・航行タイマーをクライアント計算で更新

### 5.3 進捗と船の移動

- 進捗の計算:
  - 時間目標モード: `min(100, elapsedMs / (targetMinutes * 60000) * 100)`
  - 無制限モード: `todos.length === 0 ? 0 : done数 / todos数 * 100`
  - アーカイブ済み: 常に100
- 船はSVG航路path上を `getTotalLength()` / `getPointAtLength()` で配置し、
  船首は進行方向（pathの接線）に回転させる
- 通過済み区間は実線（`pathLength="100"` ＋ `stroke-dasharray: "{progress} 100"`）、
  未踏区間はマゼンタの点線
- 無制限モードで工程をチェックすると、船が前の位置から新しい位置へ
  約1秒のイージング付きアニメーションで前進する（チェック解除で戻る）
- 時間目標モードで航行中に100%へ到達した場合は自動で停泊→入港する
  （無制限モードにはこの自動入港は存在しない。終了条件は全工程完了のみ）

### 5.4 工程（Todo）管理と工程手帳

- 画面右下の📖ボタンで工程手帳（右スライドドロワー）を開閉。未完了数をバッジ表示
- チェック時: `doneAt: now`、`elapsedAtDone: その時点のelapsedMs` を記録し、
  日誌に「☑ 工程完了：◯◯（◯時間◯分 時点）」を自動記帳（SE: 上昇チャイム）
- 手帳には各完了工程の「⏱ ◯時間◯分 時点で完了（区間 ◯分）」を表示
  （区間＝完了時間の昇順で直前の完了工程との差分）
- チェック解除可（`doneAt` / `elapsedAtDone` をnullに戻す。SE: 低音）
- 工程の追加・削除は手帳からいつでも可能
- **アーカイブ済み航海の工程もチェック可能**:
  「完了した航海」リストの「📖 工程 n/m」ボタンで手帳がその航海を開く
  （「入港済・チェック可」表示。チェック時の`elapsedAtDone`は確定済み`accumMs`。
  再入港・全速前進は発生しないが、工程宝の獲得は有効）

### 5.5 Todoドロワー（画面左端）

- 画面左端に固定。閉時は金色の縦タブ「📋 工程」のみ、クリックでパネルがスライド展開
- パネル: ネイビー半透明背景＋金枠、「残りの工程」を金文字で最大7件＋「…他N件」
- 全工程完了時は「全工程完了！🚩」、工程なしは「工程はまだありません」
- 開閉状態（`dockOpen`）は保存し、次回起動時に復元
- 宝物庫表示中・航路が1つもない場合は非表示

### 5.6 航海日誌（ログ）

- 「✎ 記帳する」でメモを入力（時間入力なし）。記帳時点の進捗%（`pos`）を自動付与
- 一覧は新しい順。手動メモ（マゼンタ縁）とシステム記帳（ティール縁・`sys: true`）を区別
- 個別削除可（確認ダイアログ）

### 5.7 宝システム

| 項目 | 仕様 |
|------|------|
| 種類 | A〜Zのアルファベット型・全26種（金の飾り文字で表示） |
| 排出確率 | 均等（各1/26）。重複あり |
| 獲得条件① | 1つの航路で工程を **3個達成するごと** に1個（3・6・9…個目の瞬間） |
| 二重排出防止 | `todoRewards`（排出済み回数）で管理。排出条件は `done数 >= 3 × (todoRewards + 1)`。**チェックを外してもtodoRewardsは減算しない**（外して付け直す稼ぎを防止） |
| 獲得条件② | 入港（航海完了）ごとに1個。入港カード内に「入港の戦利品」として表示 |
| ゴール後 | アーカイブ済み航海での工程チェックでも獲得条件①は有効 |
| 演出 | 獲得モーダル（金文字がポップ＋キラキラのアルペジオSE） |
| 宝物庫 | タブ列右端の「🪙 宝物庫」タブで表示。26マスの図鑑グリッド（所持＝金文字＋個数、未発見＝「?」）、収集総数と図鑑◯/26種を表示 |

### 5.8 天候システム（ランダム切替）

- 開始時にランダム抽選し、以降 **240秒（4分）ごと** に再抽選
- 確率: 晴れ55% ／ 曇り30% ／ 嵐15%（乱数 r < 0.55 / < 0.85 / それ以外）
- 演出（海図へのCSS filter＋オーバーレイ）:
  - 晴れ: 彩度・明度アップ、陽光の反射（朝・昼のみ）
  - 曇り: 彩度低下＋流れる雲
  - 嵐: 暗転＋雨アニメーション＋稲妻フラッシュ（7秒周期）
- 天候はクライアントローカル（Firestoreに保存しない）

### 5.9 時間帯システム（朝〜深夜の巡回）

- 5段階: 朝🌅 → 昼🌞 → 夕🌇 → 夜🌙 → 深夜🌌 の循環
- **10分（600,000ms）ごと** に次の時間帯へ進む
- **起動時の最初の時間帯はランダム**（offset 0〜4を抽選）
- 演出: 時間帯ごとの色調オーバーレイ（朝＝暖色光、夕＝オレンジ〜マゼンタ、
  夜・深夜＝暗青＋星の瞬き。夜0.5／深夜0.9の星опacity）
- 海図左上バッジに「🌇 夕｜☀️ 晴れ」のように時間帯＋天候を常時表示

### 5.10 島と応援メッセージ

- 海図の固定装飾: 霞島・燈台礁（灯台の回転光付き）・帆立岩・岩礁（✕記号）・
  コンパスローズ・水深数字・緯度経度グリッド
- 各航路の終点には**ゴール島**（浅瀬＋陸地＋桟橋＋ゴール旗）を描画
- 航路は3パターンとも**島の浅瀬の縁をかすめて通る**（島の上は通らない）
- 各航路に応援ゾーン（`{at: 進捗%, island: 島名, x, y}`）を定義。
  船がゾーンを跨いだとき、島の位置から吹き出しで応援メッセージを表示
  （9種からランダム・SE付き・約4秒で消える）
- 同じ島の応援は1航海につき1回のみ（`passed` 配列で管理・保存）

### 5.11 入港・全速前進演出

- **通常入港**（時間目標モードで100%到達）: 号鐘＋ファンファーレSE、紙吹雪50個、
  入港カード（総航行時間・出航回数・戦利品の宝）→「航海を記録に残す」でアーカイブ
- **全速前進**（全工程チェック完了・未アーカイブの航海のみ）:
  「全 速 前 進 ！」バナー＋長い汽笛＋エンジン音、船が白波（スプレー線）を
  立てながら現在位置→100%へ3秒で加速移動（序盤40%で行程の25%＝緩→急）、
  到達後に「全工程踏破・入港」カード→アーカイブ
- 全速前進は目標時間が残っていても発動する（工程完遂＝航海完了）

### 5.12 SE（効果音）一覧

Web Audio APIのオシレータ合成のみで実装（音源ファイル禁止）。
ヘッダーの「🔊 音／🔇 消音」でミュート切替（設定はローカル保存）。

| SE | タイミング | 音の内容 |
|----|-----------|---------|
| depart | 出航 | 低い汽笛（sawtooth+triangle 約146Hz＋sine 73Hz、1.3秒） |
| anchor | 停泊 | 号鐘×2（880Hz基音＋倍音、0.55秒間隔） |
| write | 記帳・工程追加 | 短いポン（triangle 660→990Hz） |
| todoDone | 工程チェック | 上昇チャイム（523→659→784Hz） |
| todoUndo | チェック解除 | 低い単音（440Hz） |
| cheer | 島の応援 | 明るい3連音（784→988→1175Hz） |
| fullspeed | 全速前進 | 長い汽笛＋低周波エンジン（2.2〜2.4秒） |
| treasure | 宝獲得 | キラキラのアルペジオ（1047→1319→1568→2093Hz＋2637Hz） |
| arrive | 入港 | 号鐘×3＋ファンファーレ和音（523/659/784/1046Hz） |

- AudioContextはユーザー操作後に生成・resumeする（iOS Safari対策）

### 5.13 インポート／エクスポート（JSON）

- エクスポート: 全データ（voyages・treasures等）を整形JSONでダウンロード
  （ファイル名 `voyage-log_YYYYMMDD.json`）
- インポート: JSONファイルを選択→確認ダイアログ→**現在のデータを置き換え**。
  読み込み時に `normalizeVoyage()` でスキーマ差分を補完
- Firestore版でもバックアップ手段として維持する（インポートはFirestore上の
  自分のデータを一括置換する操作として実装）

### 5.14 認証

- Googleアカウントでサインイン（Firebase Authentication）
- 未認証ユーザーはサインイン画面へリダイレクト
- 認証ガードはYggd-memoと同方式（`AuthGuard.tsx` Client Component、`/login` を除外）

---

## 6. 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンシブ | スマートフォン（375px〜）・タブレット・PCに対応。プロトタイプの調整内容（入力欄16px＝iOSズーム防止、`touch-action: manipulation`、セーフエリア対応、640px/420pxブレークポイント）を踏襲 |
| パフォーマンス | 初回表示3秒以内。航行中の毎秒更新はDOM部分更新のみ（フル再レンダーしない） |
| オフライン | Firestoreのオフラインキャッシュを有効化する |
| 競合処理 | Last Write Wins。競合検知・警告は行わない |
| セキュリティ | Firestoreセキュリティルールで自分のデータのみ読み書き可能に制限 |
| 環境変数 | FirebaseのAPIキーは`.env.local`で管理し、リポジトリに含めない |
| アクセシビリティ | `prefers-reduced-motion` でアニメーションを抑制する |

### Firestoreセキュリティルール

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 7. プロジェクト構成

```
voyage-log/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                    # App Router（layout / page / login）
│   ├── components/             # Chart / Ship / TodoDock / Notebook / Modals / Collection 等
│   ├── hooks/                  # useVoyages / useTreasures / useAmbience / useSound 等
│   └── lib/                    # firebase初期化 / 進捗計算 / 航路定義（ROUTES）/ SE合成
├── docs/
│   ├── requirements.md         ← 本ファイル
│   ├── constraints.md          ← NEVERルール
│   ├── status.md               ← 実装進捗チェックリスト（別途作成）
│   ├── agent_prompt.md         ← 作業依頼テンプレート
│   └── voyage-log.html         ← プロトタイプ（UI・演出・ロジックの正）
├── AGENTS.md
├── CONTRIBUTING.md
├── .env.local                  # Gitに含めない
├── .env.example
├── firebase.json               # public: "out"
├── firestore.rules
├── next.config.ts              # output: 'export'
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

> Yggd-memo・ハビットトラッカーとは別の新しいFirebaseプロジェクトを作成して使用する。

---

## 8. 実装上の注意（プロトタイプからの移植ポイント)

1. **航路データ（ROUTES）**: 3種のSVG path・母港/終点座標・ゴール島中心・応援ゾーンの
   数値は `voyage-log.html` の `ROUTES` 定数をそのまま移植する（手調整済みのため変更しない）
2. **海図SVG**: 島・岩礁・灯台・コンパスローズ・水深数字の座標も同様にプロトタイプが正
3. **船のアニメーション**: 揺れ（bobbing）は実装しない（削除済みの仕様）。
   移動はrAFでpath沿いに補間し、CSS transitionによる直線移動は使わない
4. **毎秒更新の設計**: 航行中のみ1秒間隔で進捗表示を更新。React再レンダーを最小化する
   （プロトタイプはDOM直接更新。React版ではstate分離やref更新などで同等の軽さを保つ）
5. **宝・入港の演出順序**: 工程宝モーダル→（250ms後）全速前進→入港カード、の順。
   入港時は開いている宝モーダルを閉じてから入港カードを出す
