# dsh-pet 日本語版 🐾

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)で動くデスクトップペットです。青髪の小さなメイドが、待機・散歩・食事・ゲームなどの透明アニメーションを再生します。クリックに反応し、ドラッグして投げると跳ね返ります。複数のペット、AIとの会話、ひとりごと、残高表示、作業状況との連動に対応しています。

原作者・元プロジェクト：[PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)。このフォークの`ja`ブランチは日本語版です。設定画面、メニュー、通知、会話、画像内の文字、文字入り動画を日本語化しています。内部の設定キー・APIパス・アニメーションID・素材ファイル名は互換性のため元の表記を使います。

## インストール

日本語版はこのブランチをビルドして使用します。npmの`dsh-pet`は上流版で、このフォークの日本語変更は含まれません。

Node.js 22.12以上と、使用できるDSH環境が必要です。上流が開発・検証に使用しているDSHのバージョンは`0.2.1-rc.2`です。

```sh
git clone --branch ja https://github.com/souta-lab/dsh-pet.git dsh-pet-ja
cd dsh-pet-ja/dsh-pet
npm install --ignore-scripts
npm run build
```

`dsh web`では、ビルドした**内側のプラグインディレクトリ**を指定します。パスは実際の絶対パスに置き換えてください。

```sh
dsh plugin --profile web add file:/absolute/path/to/dsh-pet-ja/dsh-pet
```

Windowsでの指定例は`file:D:/path/to/dsh-pet-ja/dsh-pet`です。Electron版DSHは、アプリ内の「プラグイン管理」からローカルのプラグインを指定します。CLIを使う場合は、そのデスクトップアプリに付属するCLIを使ってください。

導入後はDSHを再起動します。ホスト側の変更には再起動が必要です。クライアント側だけの変更はページの再読み込みで反映できます。プラグインIDは`dsh-pet`のままなので、元版と同時には読み込まないでください。

`npm run build`はクライアント・ホストに加え、デスクトップ共有コア、型宣言、配布ファイル一覧を生成します。`tsdown`だけでは完全なインストール用成果物になりません。`npm pack`・`npm publish`では`prepack`がビルドを実行します。日本語版の配布物を手元で作る場合は`npm pack`を使えます。

## 起動時の動作

標準設定の`display`は`both`です。

1. ブラウザーの右上にペットが表示されます。位置は設定画面から変更できます。
2. Electronが見つからない場合、ホストが`$DSH_HOME/electron/`にダウンロードします。同じバージョンは再ダウンロードしません。進捗はDSHのコンソールに表示されます。
3. 展開後、ペットごとに透明な最前面ウィンドウが開きます。ブラウザーとデスクトップに同じ設定のペットが1体ずつ表示されます。
4. 片方だけにする場合は、設定画面または右クリックメニューの「表示場所」で変更します。

ダウンロード中もブラウザー側は使用できます。Electronの導入に失敗した場合はデスクトップ側のみ影響します。Linuxで`DISPLAY`も`WAYLAND_DISPLAY`もない場合はデスクトップ表示をスキップします。

## 主な機能

- **アニメーション**：待機・方向転換・移動・分類別のしぐさを重み付きで選び、二重バッファーで滑らかにつなぎます。
- **複数のペット**：個別に名前・サイズ・位置・表示先を設定できます。追加種族のpet packにも対応します。
- **操作**：クリックで反応、ドラッグで移動、投げると重力・壁の反発・床の摩擦を再現します。ゆっくり放せばその場に置けます。物理処理はブラウザーとデスクトップで共有しています。
- **散歩**：向いている方向へ歩き、画面外へ出ないように移動します。複数画面、画面ごとの拡大率、作業領域に対応し、「現在の画面内に固定」も選べます。
- **右クリックメニュー**：分類からアニメーションを再生し、ひとりごと・会話・初期位置への復帰・表示場所の変更を行えます。移動アニメーションを選ぶと実際に移動します。
- **デスクトップ用メニュー**：サイトを開く、残高確認、設定再読み込みを利用できます。DSHデスクトップアプリでは`dsh://open`で本体を前面に表示し、Web版・単独モードでは既定のブラウザーで開きます。
- **イベント連動**：残高・ひとりごと・作業状態に対応するアニメーションを再生します。各段階に候補配列を指定すると同じ動きの連続を避けて選びます。
- **アクセシビリティー**：`prefers-reduced-motion`では弾む変形とフェードを省略します。

## スラッシュコマンド

DSHの入力欄で`/`から呼び出せます。

| コマンド              | 動作                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/pet [idまたは名前]` | `/chat`の対象を選びます。引数なしで現在の選択を確認できます。同名の場合はidを指定してください。                            |
| `/chat [メッセージ]`  | メッセージありで会話し、引数なしでひとりごとを即時生成します。返答は記憶に保存され、両画面の吹き出しに表示されます。       |
| `/balance`            | 残高を即時更新します。利用可能なら段階別アニメーションと残高を表示し、未対応・認証情報不足・取得失敗なら理由を表示します。 |

`/pet`をまだ選んでいない場合は、有効なペット一覧の先頭を使用します。HTTP APIではこの既定値を使わず、対象を明示します。

## 残高・会話・作業状態

### 残高

`eventsRefreshSec.balance`秒ごと（標準1800秒、起動時にも1回）に現在のプロバイダーを照会し、利用率に応じて6段階の動きと10秒間の吹き出しを表示します。`pets[].balanceEnabled`で個別に有効化できます。

| プロバイダーID      | 表示内容                                                          | 認証情報              |
| ------------------- | ----------------------------------------------------------------- | --------------------- |
| `deepseek-official` | アカウント残高。20元を基準に使用率へ換算します。                  | `DEEPSEEK_API_KEY`    |
| `opencode-go`       | 5時間・週間・月間のうち最も残量の少ない枠とリセット時期。         | `OPENCODE_GO_API_KEY` |
| `commandcode`       | 5時間・週間・月間のうち最も厳しい枠。窓制限のないプランは月間枠。 | `COMMANDCODE_API_KEY` |

キーはDSHの認証情報に設定します。未対応のプロバイダーや取得エラーでは説明を表示します。自動照会では理由が変化したときだけ表示し、手動照会では毎回表示します。

### ひとりごとと会話

`whisperEnabled`を有効にすると、`eventsRefreshSec.whisper`秒ごと（標準300秒）に1文生成します。周期はペットごとに独立しています。手動のひとりごとは自動生成の設定に関係なく利用できます。

`whisperPrompt`はひとりごとと会話に共通する人格設定です。日本語版の標準設定は日本語で返答するよう指定しています。既存のユーザー設定に中国語の`whisperPrompt`や`workStatusTexts`がある場合は、その内容が優先されるため、項目を日本語に変更するか、該当する上書き項目を削除してください。

`whisperModel`と`chatModel`でプロバイダーとモデルを個別に指定できます。両方空欄なら現在のDSH会話のモデルを使用します。片方だけの指定は無効です。指定モデルで失敗した場合は現在の会話のモデルで1回再試行します。

会話履歴は`$DSH_HOME/dsh-pet/memory.json`にすべて保存され、ブラウザーとデスクトップで共有します。`chatMemoryRounds`はリクエストに含める直近の往復数（標準5、0で履歴なし）で、保存済み履歴を削除する設定ではありません。

ひとりごとの画像は`memes`からランダムに1枚、会話の画像はモデルが文脈に応じて最大1枚選びます。`whisperImageEnabled`・`chatImageEnabled`で切り替えられます。`chatImageLimit`（標準10、0で無制限）はモデルへ渡す候補を設定順の先頭N枚に制限します。候補一覧は各メッセージに付くため、画像が増えるほどトークン消費も増えます。

### 作業状態と通知

`workStatusEnabled`を有効にすると、DSHのイベントに応じて思考・作業・整理・待機・成功・エラーの6状態を表示します。通常状態はアニメーションと吹き出しを維持し、成功・エラーは1回再生して10秒で吹き出しを閉じます。複数ターンのタスクは最後の完了時に祝います。

`animations.events.workStatus`の添字が状態を表すため、既存の配列の途中には新しい状態を挿入しないでください。`workStatusTexts`は状態ごとに複数の候補を指定でき、タスク詳細がある場合はそちらを優先します。

`notificationsEnabled`を有効にすると、ウィンドウにフォーカスがないときに、会話完了・生成失敗・出力打ち切り・権限確認・回答待ちをOS通知で知らせます。

## 設定とデータ

DSHの設定にある「ペット設定」で編集して保存すると即時反映されます。サイズは横幅pxで、高さは幅の9/16です。位置は四隅と`marginX`・`marginY`で指定します。

| `display` | 表示先       |
| --------- | ------------ |
| `web`     | ブラウザー   |
| `desktop` | デスクトップ |
| `both`    | 両方         |
| `none`    | 非表示       |

「初期設定を同期」は、コメントと高度な設定を含む内蔵`config.jsonc`をユーザー設定へ**丸ごとコピー**します。既存の調整も上書きするため、必要な内容を先にバックアップしてください。

| パス                                     | 内容                                                |
| ---------------------------------------- | --------------------------------------------------- |
| パッケージの`assets/config.jsonc`        | 読み取り専用の標準設定。全項目の構造と説明。        |
| `$DSH_HOME/dsh-pet/main-config.jsonc`    | ユーザー設定。標準設定より優先。                    |
| `$DSH_HOME/dsh-pet/memory.json`          | 会話履歴。削除すると記憶を消去。                    |
| `$DSH_HOME/dsh-pet/main-animation/webm/` | ユーザーのVP9-Alpha動画。パッケージ内素材より優先。 |
| `$DSH_HOME/dsh-pet/memes/`               | ユーザーのPNG画像。`memes`に名前と説明を登録。      |
| `$DSH_HOME/dsh-pet/pet/`                 | 追加種族の設定と素材。                              |

**トップレベルのフィールドは一括置換です。** たとえば`animations`を指定すると、そのオブジェクト全体で標準のプールを置き換えます。内部の省略キーは標準設定から補完されません。トップレベル自体を省略した項目は既定値を使います。不正な設定は警告とともに扱われます。詳細は設定ファイル内のコメントを参照してください。

主な編集項目は`pets`、`animations`、`animationWeights`、`eventsRefreshSec`、`whisperPrompt`、`memes`です。物理設定`physics`の既定値は、`gravity: 1400`、`restitution: 0.78`、`groundFriction: 2.5`、`ceilingBounce: true`、`throwPower: 1`、`petCollision: false`。重力0で無重力、`petCollision: true`でペット同士の衝突を有効にします。

`fixedEnabled`は自動の方向転換と移動だけを止めます。クリック・ドラッグ・手動再生・イベントには影響しません。`font`ではフォントのプリセット、文字サイズ、ペットサイズとの連動を設定できます。設定ファイルを直接編集した場合はページの再読み込み、デスクトップの設定再読み込み、必要に応じてHelperの再起動を行ってください。

### 追加種族（pet pack）

`pet/pig-config.json`と`pet/pig-animation/`のように、同じ接頭辞の設定と素材を配置します。`pig-memes/`は任意です。設定は標準設定と同じ構造で、`pets`に複数のインスタンスを指定できます。ファイル名の接頭辞は種族名、各`pets[].id`は一意のインスタンスIDです。

- `animations`と`animationWeights`を種族ごとに指定します。主ペットのアニメーションにはフォールバックしません。
- `pig-animation/`の動画はこの種族だけで使用します。見つからない場合は404になります。種族用の`pig-memes/`がある場合、画像もそのディレクトリだけを検索します。ない場合はユーザーの`memes/`、パッケージ素材を使用します。
- `pets`は空でない配列にし、各インスタンスの必須フィールドを指定してください。IDが主ペットや他の種族と衝突する場合、その種族は警告してスキップします。
- ユーザーの全体設定で指定した物理・フォント・画面制限・モデル・画像・履歴・周期は種族にも適用され、種族側のトップレベル指定で上書きできます。
- `notificationsEnabled`と残高の更新周期`eventsRefreshSec.balance`はmainだけを読みます。ひとりごとの周期は種族ごとに上書きできます。
- ファイルで追加したペットは設定画面の一覧に含まれず、保存・同期で主設定に書き戻されません。変更後はブラウザーを再読み込みし、デスクトップはHelperを再起動してください。

新しい種族を作るときは`assets/config.jsonc`をコピーし、インスタンスID、アニメーションプール、素材名を変更するのが確実です。動画名はプールに書いたIDと拡張子を除いて一致させます。通常の不透明WebMでは背景が黒くなるため、VP9-Alphaを使ってください。

## デスクトップと単独モード

デスクトップではペットごとに小さな透明の最前面ウィンドウを作り、ブラウザーと同じロジック・素材を使用します。ホストとの通信は専用のプロセス間チャネルです。

```sh
# パッケージディレクトリでElectronを手動取得
npm run ensure:electron
# デスクトップのみをデバッグ
npm run start:desktop -- http://127.0.0.1:3080/dsh-pet-7340/config
# DSHを起動せず実行（先にビルド）
npm run standalone
```

Electronは`DSH_PET_ELECTRON_PATH`で実行ファイルを指定できます。ダウンロード先の変更は`DSH_PET_ELECTRON_MIRROR`、バージョン指定は`DSH_PET_ELECTRON_VERSION`を使い、変更後に再起動してください。

単独モードの実行ファイルは`dsh-pet-standalone`です。`--check`で診断、`--port 3100`でポートを指定できます。標準ポートは3080で、使用中なら次へ進みます。`display`が`desktop`または`both`のインスタンスを表示し、`Ctrl+C`または`POST /shutdown`で終了します。

単独モードではアニメーション、操作、複数表示、独自素材、pet packを利用できます。DSHに依存する残高・ひとりごと・会話・システム通知は利用できず、APIは理由付きの失敗を返します。設定はDSH内で実行する場合と共通です。同時起動ではElectron Helperのキャッシュも共有するため、干渉する可能性があります。

## 対応環境とmacOS

Windows・Linux・macOSに対応します。標準のVP9-Alpha WebMはChrome・Edge・FirefoxとElectronで透過再生できます。Safari/WKWebViewはWebMのアルファを扱えないため、HEVC-with-AlphaのMOVを使用します。

1. 上流の[assets-movリリース](https://github.com/PC2005-cloud/dsh-pet/releases/tag/assets-mov)から素材を取得します。
2. 主ペットは`$DSH_HOME/dsh-pet/main-animation/mov/`、追加種族は`pet/<種族>-animation/mov/`に置きます。
3. ソースの`src/shared/constants.ts`にある`ANIMATION_EXT`を`.mov`へ変更して再ビルドします。配布済み成果物を編集する場合は`lib/client.js`、デスクトップ側は`runtime/electron-helper/shared-core.js`も対象です。

ホストのルートは`webm`と`mov`の両方を処理できます。上流のMOV素材には、このフォークで行った日本語の動画編集は含まれません。日本語動画をMOVで使うには、編集済みWebMから別途アルファ付きで変換してください。

## HTTP API

他のプラグインやスクリプトから発話・アニメーション・位置・投擲・占有ロックを操作できます。状態は`GET /dsh-pet-7340/state`から取得します。対象指定が必要なAPIでは`pet`を省略できません。

- [API一覧](https://github.com/souta-lab/dsh-pet/blob/ja/API.md)
- [OpenAPI 3.1仕様](https://github.com/souta-lab/dsh-pet/blob/ja/openapi.yaml)：Swagger UIやPostmanへインポートできます。
- [APIテスト用コンソール](https://github.com/souta-lab/dsh-pet/blob/ja/tools/api-tester.html)：リポジトリのルートで`node tools/api-tester.cjs`を実行します。

ルートはDSHのWebサービスに登録されます。`7340`はパスの一部で、ポート番号ではありません。サービスは127.0.0.1で待ち受け、認証はありません。元のAPI仕様に従い、公開ネットワークへ転送しないでください。

## アンインストール

Web版は次のコマンド、デスクトップアプリは「プラグイン管理」を使います。

```sh
dsh plugin --profile web remove dsh-pet
```

保存先は設定画面の「アンインストールと保存先」で確認できます。削除前にDSHとペットを終了してください。

| 保存先                                        | 内容                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `$DSH_HOME/dsh-pet/`                          | 設定・会話履歴・独自素材・追加種族。削除すると失われます。                                                     |
| `$DSH_HOME/electron/`                         | Electron本体。再利用時に再取得されます。                                                                       |
| Windowsの`%APPDATA%/dsh-pet-electron-helper/` | Helperのキャッシュ。macOSは`~/Library/Application Support/`、Linuxは`$XDG_CONFIG_HOME`または`~/.config/`配下。 |
| Windowsの`%LOCALAPPDATA%/electron/Cache/`     | ダウンロードキャッシュ。macOSは`~/Library/Caches/electron`、Linuxは`$XDG_CACHE_HOME`または`~/.cache/`配下。    |

プラグイン本体はDSHに管理させてください。設定・記憶を残す場合はユーザーデータをバックアップします。

## 開発と検証

パッケージディレクトリ`dsh-pet/`で実行します。

```sh
npm run build
npm run typecheck
npm test
npm run lint
npm run check:openapi
```

ブラウザーテストは[テスト手順](https://github.com/souta-lab/dsh-pet/blob/ja/dsh-pet/scripts/tests/README.md)を参照してください。日本語表示は360・520・900pxで確認しています。元画像・動画の編集範囲と検証記録は`localization/`にあります。

## ライセンスと原作者表記

- コード：MIT。`LICENSE`を参照してください。
- アニメーション・生成プロンプト・元動画：上流の利用条件ではオープンソースでの使用を許可し、**商用利用は禁止**されています。
- 派生版・改変版・外観変更版を紹介・展示・配布する場所には、原作者のGitHub URLを表示する必要があります：[PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)。

不具合報告にはプラグインとDSHのバージョン、OS、再現手順、必要に応じてログ・スクリーンショットを添えてください。上流のmainにある修正がnpmの最新版に含まれていない場合もあります。

## アニメーションのプレビュー

640×360の動画から作成したGIFです。再生用の透過WebMは`https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/webm/`にあります。

**待機・方向転換**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/daiji-huxi-xiuxian.gif" width="160" alt="のんびり待機" title="のんびり待機">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dongzhangxiwang.gif" width="160" alt="きょろきょろ" title="きょろきょろ">
</p>

**移動**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/pangxie-zoulu.gif" width="160" alt="カニ歩き" title="カニ歩き">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-piaofu-tabu.gif" width="160" alt="ふわふわ足踏み" title="ふわふわ足踏み">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-zuozhuan-benpao.gif" width="160" alt="左に走る" title="左に走る">
</p>

**しぐさ**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/youxian-hengga.gif" width="160" alt="鼻歌" title="鼻歌">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chaoda-shenlanyao.gif" width="160" alt="大きく伸びる" title="大きく伸びる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-qiaoji-zhuomian-hudong.gif" width="160" alt="机をとんとん" title="机をとんとん">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-zhongli-xiadun-yasuo.gif" width="160" alt="しゃがむ" title="しゃがむ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/haqian-liantian.gif" width="160" alt="あくび" title="あくび">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-xiaoqi-chenmian.gif" width="160" alt="ひと眠り" title="ひと眠り">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/nvpu-quxi-liyi.gif" width="160" alt="メイドのお辞儀" title="メイドのお辞儀">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/beixiayitiao-zhamao.gif" width="160" alt="びっくり" title="びっくり">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/xiaofudu-yuandi-360du-xuanzhuan-zhanshi.gif" width="160" alt="くるっと一回転" title="くるっと一回転">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/touchi-lingshi-bei-zhuazhu.gif" width="160" alt="つまみ食いがばれた" title="つまみ食いがばれた">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yong-jingyu-weiba-paidadi.gif" width="160" alt="しっぽで床をたたく" title="しっぽで床をたたく">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/da-keshui-bei-jingxing.gif" width="160" alt="居眠りからはっと起きる" title="居眠りからはっと起きる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/zhao-jingzi.gif" width="160" alt="鏡を見る" title="鏡を見る">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/zhengti-huanzhuang-shise.gif" width="160" alt="着せ替え" title="着せ替え">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/qingkuai-jilu.gif" width="160" alt="メモする" title="メモする">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/xie-daima.gif" width="160" alt="コードを書く" title="コードを書く">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yaoshan-naliang.gif" width="160" alt="うちわで涼む" title="うちわで涼む">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chenjian-shuaya.gif" width="160" alt="朝の歯磨き" title="朝の歯磨き">
</p>

**遊び**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-zhuanxin-wan-mofang.gif" width="160" alt="ルービックキューブ" title="ルービックキューブ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-dunxia-wan-wanju-qiche.gif" width="160" alt="ミニカーで遊ぶ" title="ミニカーで遊ぶ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/jingyu-tu-paopao-texiao.gif" width="160" alt="クジラの泡" title="クジラの泡">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/yuandi-tiaoyue-zhuasui-touding-wupin.gif" width="160" alt="ジャンプでキャッチ" title="ジャンプでキャッチ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/wan-youxi-qijibaituai.gif" width="160" alt="ゲームでむきになる" title="ゲームでむきになる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/wan-shuiqiang.gif" width="160" alt="水鉄砲" title="水鉄砲">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/xiaotiqin-yanzou.gif" width="160" alt="バイオリン" title="バイオリン">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/lanjing-xianshi.gif" width="160" alt="シロナガスクジラ登場" title="シロナガスクジラ登場">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/youya-nvpuwu.gif" width="160" alt="優雅なメイドダンス" title="優雅なメイドダンス">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/qingkuai-yaobaiwu.gif" width="160" alt="軽快なダンス" title="軽快なダンス">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/keai-zhaiwu.gif" width="160" alt="かわいいダンス" title="かわいいダンス">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chui-qiqiu.gif" width="160" alt="風船をふくらませる" title="風船をふくらませる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dongwu-huanrao.gif" width="160" alt="動物に囲まれる" title="動物に囲まれる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/fang-fengzheng.gif" width="160" alt="たこあげ" title="たこあげ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chai-liwu.gif" width="160" alt="プレゼントを開ける" title="プレゼントを開ける">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/bian-gezi.gif" width="160" alt="ハトを出す" title="ハトを出す">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/puke-moshu.gif" width="160" alt="トランプマジック" title="トランプマジック">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chou-tuoluo.gif" width="160" alt="こま回し" title="こま回し">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chui-dizi.gif" width="160" alt="笛を吹く" title="笛を吹く">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/hudie-mifeng-huanrao-touding-kaihua.gif" width="160" alt="蝶と蜂とお花" title="蝶と蜂とお花">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/lu-mao.gif" width="160" alt="猫をなでる" title="猫をなでる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/pingkong-shenghua.gif" width="160" alt="花を出す" title="花を出す">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/qi-muma.gif" width="160" alt="木馬" title="木馬">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/sanqiu-paojie.gif" width="160" alt="ジャグリング" title="ジャグリング">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/ti-jianzi.gif" width="160" alt="羽根蹴り" title="羽根蹴り">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/xiawuziqi.gif" width="160" alt="五目並べ" title="五目並べ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dangqiuqian.gif" width="160" alt="ブランコ" title="ブランコ">
</p>

**食べもの**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-baifan.gif" width="160" alt="白ごはん" title="白ごはん">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dakou-chi-lingshi.gif" width="160" alt="おやつをほおばる" title="おやつをほおばる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-token.gif" width="160" alt="トークンを食べる" title="トークンを食べる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-zaocan.gif" width="160" alt="朝ごはん" title="朝ごはん">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-wucan.gif" width="160" alt="お昼ごはん" title="お昼ごはん">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-wancan.gif" width="160" alt="晩ごはん" title="晩ごはん">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-bingqilin-ronghua.gif" width="160" alt="とけるアイス" title="とけるアイス">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-dazhaxie.gif" width="160" alt="カニを食べる" title="カニを食べる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-tanghulu.gif" width="160" alt="タンフールー" title="タンフールー">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-changshoumian.gif" width="160" alt="長寿麺" title="長寿麺">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-xigua.gif" width="160" alt="スイカ" title="スイカ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/shuan-huoguo.gif" width="160" alt="火鍋" title="火鍋">
</p>

**季節**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/beiluoye-yanmo.gif" width="160" alt="落ち葉に埋もれる" title="落ち葉に埋もれる">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/zhongqiu-shangyue-chi-yuebing.gif" width="160" alt="お月見と月餅" title="お月見と月餅">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/duixueren.gif" width="160" alt="雪だるま" title="雪だるま">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/fang-yanhua.gif" width="160" alt="花火" title="花火">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-zongzi.gif" width="160" alt="ちまき" title="ちまき">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-niangao.gif" width="160" alt="おもち" title="おもち">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-qingtuan.gif" width="160" alt="草だんご" title="草だんご">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-labazhou.gif" width="160" alt="臘八粥" title="臘八粥">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chi-chongyanggao.gif" width="160" alt="重陽のお菓子" title="重陽のお菓子">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/shou-hongbao.gif" width="160" alt="お年玉" title="お年玉">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/xie-fuzi.gif" width="160" alt="福の書き初め" title="福の書き初め">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chuanzhenqiqiao.gif" width="160" alt="七夕の針仕事" title="七夕の針仕事">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/wu-shitou.gif" width="160" alt="獅子舞" title="獅子舞">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/taotang-nanguadeng.gif" width="160" alt="ハロウィーン" title="ハロウィーン">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/cha-zhuyu-shangju.gif" width="160" alt="菊のお花見" title="菊のお花見">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/fanghedeng.gif" width="160" alt="灯籠流し" title="灯籠流し">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/menghua-xiaoyouling.gif" width="160" alt="小さなおばけ" title="小さなおばけ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/zhuangdian-shengdanshu.gif" width="160" alt="クリスマスツリー" title="クリスマスツリー">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/fang-kongmingdeng.gif" width="160" alt="ランタン飛ばし" title="ランタン飛ばし">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chitangyuan.gif" width="160" alt="湯円" title="湯円">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/chijiaozi.gif" width="160" alt="ギョーザ" title="ギョーザ">
</p>

**セリフ**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/shia-chishenme.gif" width="160" alt="何を食べよう？" title="何を食べよう？">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/shendu-sikao-suisuinian.gif" width="160" alt="考えごとのひとりごと" title="考えごとのひとりごと">
</p>

**クリックへの反応**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dianji-huiying-kaixin-yuedong.gif" width="160" alt="うれしくジャンプ" title="うれしくジャンプ">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dianji-huiying-haixiu-jingya.gif" width="160" alt="照れてびっくり" title="照れてびっくり">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dianji-huiying-aojiao-shengqi-ceshen-zhanshi.gif" width="160" alt="ツンと怒る" title="ツンと怒る">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dianji-huiying-naoyang-gegexiao.gif" width="160" alt="くすぐられて笑う" title="くすぐられて笑う">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dianji-huiying-yuanqi-huishou.gif" width="160" alt="元気に手を振る" title="元気に手を振る">
</p>

**ドラッグ**

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/beishubiao-tuozhuai-xuankong-fankui.gif" width="160" alt="つままれて宙ぶらりん" title="つままれて宙ぶらりん">
</p>

**残高イベント**（利用率に応じて、満額から残量不足・使い切りへ）

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/qian-dai-man-yi.gif" width="160" alt="残高：袋いっぱい" title="残高：袋いっぱい">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/jin-dai-ding-dang.gif" width="160" alt="残高：まだたっぷり" title="残高：まだたっぷり">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/qian-dai-ru-chang.gif" width="160" alt="残高：いつもどおり" title="残高：いつもどおり">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/shu-jin-zhou-mei.gif" width="160" alt="残高：ちょっと心配" title="残高：ちょっと心配">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/dai-kong-ru-xi.gif" width="160" alt="残高：からっぽ寸前" title="残高：からっぽ寸前">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/fen-wen-bu-sheng.gif" width="160" alt="残高：使い切った" title="残高：使い切った">
</p>

**発話アニメーション**（ひとりごと・会話で候補から1つを再生）

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/suisuinian-cazhuo-suisuinian.gif" width="160" alt="机を拭きながらひとりごと" title="机を拭きながらひとりごと">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/suisuinian-fadai-suisuinian.gif" width="160" alt="ぼんやりひとりごと" title="ぼんやりひとりごと">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/suisuinian-duiping-suisuinian.gif" width="160" alt="画面を見てひとりごと" title="画面を見てひとりごと">
</p>

**作業状態のアニメーション**（DSHのイベントに応じて思考・作業・整理・待機・成功・エラーを表示）

<p>
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-sikao-maopao.gif" width="160" alt="作業：考え中" title="作業：考え中">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-manglu-dianan.gif" width="160" alt="作業：処理中" title="作業：処理中">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-qingdian-guidang.gif" width="160" alt="作業：整理中" title="作業：整理中">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-yuandi-duobu-zhangwang.gif" width="160" alt="作業：確認待ち" title="作業：確認待ち">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-queyue-qingzhu.gif" width="160" alt="作業：完了！" title="作業：完了！">
  <img src="https://raw.githubusercontent.com/souta-lab/dsh-pet/ja/dsh-pet/assets/preview/gongzuozhuangtai-chuitou-tanqi-maohan.gif" width="160" alt="作業：エラー" title="作業：エラー">
</p>

> 透過部分はGIFプレビューではページの背景色で表示されます。実際のWebMも透過素材です。

## 素材生成の手順

プロンプトと動画加工の手順は[リポジトリのREADME](https://github.com/souta-lab/dsh-pet/blob/ja/README.md#自分のペット素材を生成する)を参照してください。
