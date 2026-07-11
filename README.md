# 作業の航海日誌（voyage-log）

取り組んでいる作業・プロジェクトを「航海」に見立て、作業するたびに海図上で
船が目的地へ少しずつ進むタスク・記録アプリ。1つの作業＝1つの「航路」として管理し、
複数のプロジェクトを並行して進められる。天候・時間帯の演出、宝集め（コレクション要素）
を通じて「使っていて楽しい」日常使いを最優先とする。

プロトタイプ（`docs/voyage-log.html`、単一HTML・localStorage版 v5）が
UI・演出・ゲームロジックの正であり、本実装はその移植＋Firebase対応である。

Next.js + React + TypeScript + Firebase で構築し、Firebase Hosting で公開する。

詳細は `AGENTS.md` / `docs/requirements.md` / `docs/status.md` を参照。

## セットアップ

```powershell
pnpm install
pnpm dev
```
