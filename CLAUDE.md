# haifu-note

麻雀の打ち筋（摸打）を記録する個人用Webアプリ。Vite + React + TypeScript製、GitHub Pagesで公開。詳細は [README.md](./README.md) を参照。

## 開発コマンド

```bash
npm install
npm run dev      # ローカル開発サーバー
npm run build    # 型チェック + 本番ビルド
npm run lint     # oxlint
```

## Git / ブランチ運用ルール

- **新しい作業を始める前に、直前の作業ブランチが `main` にマージ済みかどうかを確認する。**
  - マージ済みなら、同じブランチ名のまま `main` から作り直してから作業を始める:
    ```bash
    git fetch origin main
    git checkout -B <working-branch> origin/main
    ```
  - マージ済みでない（まだPR未作成・未マージの作業が残っている）場合は、そのブランチ上で作業を続ける（作り直さない）。
  - ブランチを作り直した後にリモートへpushする際は、古いブランチ参照が「マージ済みの履歴のみ」を含むことを確認した上で `--force-with-lease` を使ってよい。

- **PRの作成・squashマージは、ユーザーが明示的に「作業完了」を宣言するまで行わない。**
  - 変更はコミットしてブランチにpushするところまでに留める。
  - ユーザーが完了を宣言したら、そのブランチから `main` へのPRを作成し、**Squash and merge**でマージする。

- コミット前には `npm run build` と `npm run lint` を通すこと。
