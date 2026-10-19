# dsh-pet 日本語版

DeepSeek Harnessで動くデスクトップペットの日本語版です。
元プロジェクト：[PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)。MITライセンスと元の作者表記を引き継いでいます。

- 設定画面、ヘルプ、右クリックメニュー、通知、残高表示、スラッシュコマンドを日本語化。
- チャットとひとりごとは日本語で返答します。
- アニメーションの内部名と素材ファイル名は維持し、表示名だけを日本語化。
- 文字入り画像は元画像を参照して文字領域だけを編集し、元絵へ合成します。
- 文字入り動画は元フレームの動きと透過を保ち、吹き出しの文字を差し替えます。

## 日本語アニメーションのプレビュー

<img src="dsh-pet/assets/preview/shia-chishenme.gif" width="320" alt="何を食べようと考えるペット">
<img src="dsh-pet/assets/preview/shendu-sikao-suisuinian.gif" width="320" alt="日本語の吹き出しでひとりごとを話すペット">

## ビルド

Node.js 22.12以上が必要です。DSHの推奨バージョンは0.2.1-rc.2です。

```bash
git clone --branch ja https://github.com/souta-lab/dsh-pet.git dsh-pet-ja
cd dsh-pet-ja/dsh-pet
npm install --ignore-scripts
npm run build
npm run typecheck
npm test
```

DSHの画面側プラグインIDは元の`dsh-pet`を維持しています。元版と同時には読み込まないでください。

ユーザー設定に既存の`whisperPrompt`や`workStatusTexts`がある場合、それらが標準設定より優先されます。日本語版の標準文言を使うには、その項目だけを設定ファイルから削除するか、日本語へ変更してください。「初期設定を同期」は他のカスタマイズも上書きするため、先にバックアップしてください。

日本語版はDSH側の表示言語が英語・中国語でも日本語を表示します。DSH本体の表示言語は変更しません。

## 素材の編集方法

元画像全体を再生成すると絵柄が変わるため、文字部分の生成結果だけを元画像へ合成しています。モデルへは元画像と実際に切り出した文字領域を入力します。元のキャラクターを再生成した画像は採用しません。

白い外周背景を持つスタンプは、外周から連結する白背景だけを透過し、目やエプロンなど内部の白は残します。漫画のコマや夜景など、意味のある背景は保持します。作者の透かしや署名は翻訳対象に含めません。

動画の再合成スクリプトは`dsh-pet/scripts/ja/localize-video.cjs`です。生成済みの日本語文字レイヤーは`dsh-pet/assets/ja-lettering/`にあります。FFmpegとsharpを利用し、元の24fps・241フレーム・透過WebMを維持して合成します。GIFプレビューは動画から再作成します。

日本語の設定画面は360・520・900pxの幅で表示を確認しています。画像・動画の編集範囲と検証記録は`localization/`にあります。
