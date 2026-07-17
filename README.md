# 作業の航海日誌（voyage-log）

取り組んでいる作業を「航海」に見立てて記録する、タスク管理Webアプリです。

🔗 **公開URL**: https://voyage-log-e9098.web.app

## 特徴

- ⛵ **航路(Voyage)**: 1つの作業＝1つの航路として登録。時間目標モード
  （実時間の経過で船が進む）と無制限モード（工程チェックで船が進む）の2種類
- 🗺 **海図表示**: 航路をSVGの海図上に描画し、進捗に応じて船が進む様子を
  アニメーションで表示
- 🌤 **天候・時間帯演出**: 晴れ・曇り・嵐、朝〜深夜のサイクルで没入感を演出
  （ページを閉じても状態を維持）
- 📓 **工程手帳**: 作業を工程（Todo）に分解してチェック。出航中のみ操作可能
- 🪙 **宝物庫**: 工程達成・入港のたびに宝（A〜Zの26種）を獲得するコレクション要素
- 📤 **インポート/エクスポート**: 全データをJSONで書き出し・読み込み
- 🔔 **リアルタイム同期**: Firestoreによる複数デバイス間のリアルタイム同期・
  オフラインキャッシュ対応
- 📱 **PWA対応**: ホーム画面に追加してアプリのように利用可能

## 技術スタック

- Next.js 16 / React 19 / TypeScript
- Firebase（Firestore / Authentication / Hosting）
- Web Audio API（効果音、外部音源ファイル不使用）

## 開発の進め方

プロトタイプ（`docs/voyage-log.html`、単一HTML・localStorage版）がUI・演出・
ゲームロジックの仕様として先に作成され、本実装（Next.js + Firebase）はその
移植として開発されました。詳細は `AGENTS.md` / `docs/requirements.md` /
`docs/constraints.md` / `docs/status.md` を参照してください。

## セットアップ

```powershell
pnpm install
pnpm dev
```

`.env.local` にFirebaseの設定値が必要です（`.env.example` 参照）。
