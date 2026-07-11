# AGENTS.md

## このプロジェクトについて

取り組んでいる作業・プロジェクトを「航海」に見立て、作業するたびに海図上で
船が目的地へ少しずつ進むタスク・記録アプリ。1つの作業＝1つの「航路」として管理し、
複数のプロジェクトを並行して進められる。天候・時間帯の演出、宝集め（コレクション要素）
を通じて「使っていて楽しい」日常使いを最優先とする。

プロトタイプ（`docs/voyage-log.html`、単一HTML・localStorage版 v5）が
**UI・演出・ゲームロジックの正**であり、本実装はその移植＋Firebase対応である。

Next.js + React + TypeScript + Firebase で構築し、Firebase Hosting で公開する。

---

## ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/agent_prompt.md` | 📋 作業依頼テンプレート（Yggd-memoと共通・変更不要） |
| `docs/requirements.md` | 技術仕様・データモデル・機能要件 |
| `docs/status.md` | 実装進捗チェックリスト（Phase 0〜10） |
| `docs/constraints.md` | ⛔ NEVERルール（絶対禁止事項） |
| `docs/voyage-log.html` | プロトタイプ（UI・演出・ロジックの正） |
| `CONTRIBUTING.md` | Git/GitHub運用ルール（Yggd-memo版を本プロジェクト向けに調整済み） |

---

## 開発環境

- **OS**: Windows
- **シェル**: PowerShell（コマンドは必ずPowerShell向けの構文で生成すること）
- **注意点**:
  - パス区切り文字はバックスラッシュ（`\`）を使用すること
  - `&&` によるコマンド連結は使用しないこと（PowerShellでは `;` または別行で実行）
  - `mkdir -p` の代わりに `New-Item -ItemType Directory -Force` を使用すること
  - スクリプトを作成する場合は `.sh` ではなく `.ps1` 形式にすること

---

## エージェントへの指示

1. **作業前に必ず以下の順序でドキュメントを読むこと**
   1. `docs/constraints.md`（NEVERルール）
   2. `CONTRIBUTING.md`（Git/GitHub運用ルール）
   3. `docs/requirements.md`（技術仕様）
   4. `docs/voyage-log.html`（挙動の実物確認。特にROUTES定数・SE合成・アニメーションのタイミング）
   5. `docs/status.md`（現在の進捗）
2. `docs/status.md` の未完了タスク（`[ ]`）を上から順番に実装すること
3. タスクが完了したら該当行を `[x]` に更新すること
4. **1つのPhaseが完了して動作確認が取れてから次のPhaseに進むこと**
5. **Phase 4以降は、Phase完了時に必ずデプロイし、公開URL（PC・スマホ実機）で
   動作確認すること**（`docs/status.md` の運用ルール参照）
6. コードを変更する場合は既存ファイルを確認してから編集すること（上書き厳禁）
7. `voyages` はすべて論理削除（`isActive`）方式である。一覧表示・タブ・集計・書き出し処理では
   必ず `isActive: true` のデータのみを対象にすること
8. **「破棄」（`isActive: false`）と「アーカイブ」（`archived: true`＝入港済み）は別概念**である。
   混同しないこと。破棄済みの航路は表示自体から消え、アーカイブ済みの航路は
   「完了した航海」として表示され続け、工程チェック・工程宝の獲得のみ可能
9. `treasures` は追記専用のコレクションである。削除・上書きしないこと。
   `todoRewards`（工程宝の排出済み回数）も減算・リセットしないこと
10. 航行時間は `sailStart` 基準の実時間計算（`elapsedMs = accumMs + (sailing ? now - sailStart : 0)`）
    を用いること。タイマーによる秒加算の積み上げ方式に書き換えないこと
11. 進捗%はFirestoreに保存しないこと。`accumMs` / `sailStart` / `targetMinutes` / `todos` から
    毎回計算する派生値として扱うこと
12. 航行中の毎秒更新はクライアント計算のみで行い、Firestoreへの書き込みは
    状態が変わるイベント時のみ（出航・停泊・記帳・工程チェック・入港・航路作成/破棄）とすること
13. SEはWeb Audio APIのオシレータ合成のみで実装すること。音源ファイル・効果音ライブラリは導入しないこと
14. ポモドーロ関連フィールド（`sessBreakMs` / `pomo`）はv1では予約のみ
    （常に `sessBreakMs: 0` / `pomo: null`）。UIは実装しないこと
15. `ROUTES`（航路パス・島・応援ゾーンの座標）や天候確率・時間帯サイクル・宝の排出条件などの
    数値パラメータは、`docs/requirements.md` の更新なしに変更しないこと
16. 数値パラメータや演出のタイミングで判断に迷う場合は、`docs/voyage-log.html` を
    実際にブラウザで開いて挙動を確認すること（コードを読むより実物確認が早く正確な場合が多い）

---

## 技術スタック（概要）

- **フロントエンド**: Next.js + TypeScript（App Router・Static Export）
- **スタイリング**: Tailwind CSS + 素のCSS（海図SVG・天候/時間帯オーバーレイ・ドロワーアニメーション）
- **アニメーション**: CSS Transition + requestAnimationFrame（船の移動はrAF。追加ライブラリは導入しない）
- **効果音**: Web Audio API（合成音のみ。音源ファイル不使用）
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication（Google Sign-in）
- **ホスティング**: Firebase Hosting（`out/` ディレクトリを配信）
- **パッケージマネージャー**: pnpm（npm install禁止）

詳細は `docs/requirements.md` を参照すること。
