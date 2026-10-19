# dsh-pet HTTP API一覧

ホストはDSHのWebサービスへ`/dsh-pet-7340`を登録します。ブラウザー・デスクトップ・設定画面・外部プラグインで同じ処理を使用します。パラメーター、応答、エラー、使用例の完全な定義は[OpenAPI仕様](openapi.yaml)を参照してください。

基底URLは`http://127.0.0.1:<port>/dsh-pet-7340`です。portはDSHの待ち受けポートで、7340はパス名です。127.0.0.1で待ち受け、認証はありません。公開ネットワークへ転送しないでください。

`?pet=`のある操作では対象IDが必須です。省略・空白は`pet-required`、存在しないIDは`unknown-pet`になります。現在の`/pet`の選択やmainへの暗黙の切り替えはありません。

## エンドポイント

| メソッドとパス                            | 動作                                        |
| ----------------------------------------- | ------------------------------------------- |
| `GET /dsh-pet-7340/state`                 | 統一状態Sを取得                             |
| `POST /dsh-pet-7340/balance`              | 残高を即時更新                              |
| `POST /dsh-pet-7340/whisper`              | 指定ペットのひとりごとを即時生成            |
| `POST /dsh-pet-7340/broadcast`            | 外部のテキストを吹き出しへ表示              |
| `POST /dsh-pet-7340/bubble/clear`         | 現在の発話の吹き出しを閉じる                |
| `POST /dsh-pet-7340/anim`                 | 指定した動画を再生                          |
| `POST /dsh-pet-7340/position`             | 指定位置へペットを移動                      |
| `POST /dsh-pet-7340/throw`                | 初速度を与えてペットを投げる                |
| `POST /dsh-pet-7340/lock`                 | 占有ロックの取得・延長                      |
| `POST /dsh-pet-7340/lock/release`         | 占有を解放（所有者の終了・ユーザーの操作）  |
| `GET /dsh-pet-7340/playback/{id}`         | 指定した再生の実際の状態を取得              |
| `POST /dsh-pet-7340/playback/{id}/report` | 描画側からホストへ再生状態を報告する内部API |
| `GET /dsh-pet-7340/chat`                  | 直近の会話履歴を取得                        |
| `POST /dsh-pet-7340/chat`                 | 指定ペットへ話しかけて返答を生成            |
| `GET /dsh-pet-7340/config`                | 結合済みの設定を取得                        |
| `PUT /dsh-pet-7340/config`                | ユーザー設定を保存                          |
| `POST /dsh-pet-7340/config`               | 標準設定でユーザー設定を置き換える          |
| `POST /dsh-pet-7340/pet-display`          | ペット1体の表示先を変更                     |
| `GET /dsh-pet-7340/config/meta`           | 設定とデータの保存先を取得                  |
| `GET /dsh-pet-7340/models`                | 選択可能なプロバイダーとモデルを取得        |
| `POST /dsh-pet-7340/reload`               | Helperを再起動してデスクトップを再読み込み  |
| `GET /dsh-pet-7340/thumb/{petId}/{file}`  | ペットの動画素材を取得                      |
| `GET /dsh-pet-7340/font/{file}`           | フォントを取得                              |
| `GET /dsh-pet-7340/pic/{file}`            | 通知アイコンまたは会話画像を取得            |

## 状態の読み取り

`GET /state`が状態の取得先です。各リーフの`counter`が前回と変わった場合にだけ処理します。

```jsonc
{
  "counter": 1755000000007, // 最後の書き込み番号＝状態全体のバージョン
  "sections": {
    // 共有状態
    "balance": { "counter": 0, "data": null },
    "workStatus": { "counter": 0, "data": null },
    "notify": { "counter": 0, "data": null },
    "config": { "counter": 0, "data": null },
  },
  "pets": {
    // キーはペットID。ドットを含む場合も分割しないでください。
    "main": {
      "say": { "counter": 1755000000007, "data": { "text": "お疲れさま！" } },
      "anim": { "counter": 0, "data": null },
      "position": { "counter": 0, "data": null },
      "throw": { "counter": 0, "data": null },
      "lock": { "counter": 0, "data": null },
    },
  },
}
```

リーフの`data: null`は未書き込みなので無視します。最初の取得は基準値を記録し、以後counterが変わった箇所を処理してください。読み取りだけでは外部APIやモデルを呼ばず、副作用はありません。

ロングポーリングは`?since=<前回のトップレベルcounter>&timeout=<ms>`を組で指定します。timeoutは0〜10000の整数です。変更があれば直ちに返り、なければ指定時間まで待ちます。応答後は新しいcounterですぐ次の要求を送れます。

## 占有とユーザー操作

外部プラグインが一連の演出を行う場合は、`POST /lock?pet=<id>`でロックを取得し、`lockId`を各操作の`?lock=`へ渡します。`lockId`付きの取得要求は延長、なしは新規取得です。TTLは標準2分、最長30分。期限は`expiresAt`を参照し、定期的に延長してください。

占有中は自動動作・残高・ひとりごと・作業状態の表示を止めます。`/anim`、`/broadcast`、`/bubble/clear`、`/position`、`/throw`には正しいロックIDが必要で、省略は`lock-required`、不一致は`lock-lost`になります。占有がなければlock引数は無視します。

ユーザーのクリック・ドラッグ・非表示・終了は優先され、描画側が占有を解除します。ユーザー自身が呼び出すひとりごと・会話・残高確認は利用できます。作業終了時は`POST /lock/release`へ`lockId`を渡してください。`force:true`は描画側がユーザー操作を報告する内部用です。

## 発話・動画・移動

`broadcast`は外部から渡した本文を表示し、`whisper`と`chat`はモデルで生成します。画像はプール内の`image`か外部の`url`を一方だけ指定できます。`duration`は標準10000ms、0で表示せず、`anim:false`で発話動画の連動を止めます。表示時間0は既存の吹き出しを閉じる操作ではありません。閉じるには`bubble/clear`を使用します。

`anim`はプール内の`name`か外部の`url`を一方だけ受け付けます。外部動画はhttp/httpsのみで、別オリジンの場合は配信側のCORS許可が必要です。向きは`left`が元素材、`right`が鏡像、省略は現状維持です。受付成功は再生完了を意味しません。返された`playbackId`で`GET /playback/{id}?wait=ended,failed,cancelled&timeout=10000`を使うと実際の終端状態を待てます。

`position`はペット中心の正規化座標0〜1を指定します。ブラウザーはビューポート、デスクトップは全画面の作業領域の外接矩形が基準です。範囲外や画面間の空白は補正します。`mode`は`instant`・`spring`・`line`のいずれかで、lineには`duration`が必要です。動画は変更しません。

`throw`は`angle`と正の`power`を指定します。角度は0が右、90が上、反時計回りが正です。ユーザーが操作中の場合、描画側が外部の移動・投擲を無視することがあります。

## 単独モード

DSHなしでも同じ接頭辞のルートをローカルサーバーが提供します。さらにサービスのルート直下に次を追加します。

| エンドポイント         | 動作                                                   |
| ---------------------- | ------------------------------------------------------ |
| `GET /`・`GET /health` | 名前・プラグインルート・バージョン・ポート・稼働時間。 |
| `POST /shutdown`       | Helperとタイマーを停止して正常終了。                   |

DSH依存の`POST /whisper`と`POST /chat`は`provider-missing`、`POST /balance`は`unsupported`を返します。

[テスト用コンソール](tools/api-tester.html)はリポジトリのルートで`node tools/api-tester.cjs`を実行すると起動します。ローカルプロキシでクロスオリジン接続を扱います。
