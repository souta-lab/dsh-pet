# 設定画面のブラウザー回帰テスト

`dsh-pet/`パッケージディレクトリで実行します。

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
npm run test:ui
```

Linux CIでシステムライブラリが不足している場合は、`pnpm exec playwright install --with-deps chromium`を使用します。

実際のReactとChromiumで設定画面を描画し、設定・モデルのAPIを差し替えて、読み込み、失敗後の再試行、初期設定の復元、保存、日本語・英語・中国語の狭い画面幅でのレイアウトを検証します。日本語版はホストの言語に関係なく日本語を表示します。

一時的なローカルサーバーだけにアクセスし、利用者のDSH設定は読み書きしません。`npm test`のNode単体テストとは別に実行し、通常のプラグイン導入ではブラウザーをダウンロードしません。

`DSH_PET_UI_ARTIFACTS`に出力ディレクトリを指定すると、レイアウトのスクリーンショットを保存できます。Electronのウィンドウ、OSのクリック透過、画面の拡大率については、別途実行環境で確認する必要があります。
