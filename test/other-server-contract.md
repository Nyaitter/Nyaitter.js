# SDK / Server 契約照合（担当 API）

照合元は `Server/server/routes/*.js` の現行登録と各登録時の ApiRegistry 仕様（`/spec` および `/spec/endpoints` が公開する元データ）、照合先は `nyaitter.js/src/api/*API.js`。パス中の `:param` はSDKが値をURLエンコードして埋める。以下は登録ルートの完全な一覧で、括弧内は対応するSDKメソッド。

| API / Server登録ルート | SDK対応 |
|---|---|
| spaces `GET /spaces/ice-servers`, `GET /spaces`, `POST /spaces`, `GET /spaces/mine`, `GET|PATCH|DELETE /spaces/:spaceId`, `POST /spaces/:spaceId/join`, `POST /spaces/:spaceId/leave`, `GET /spaces/:spaceId/members`, `GET|POST /spaces/:spaceId/channels`, `PATCH|DELETE /spaces/:spaceId/channels/:channelId`, `GET|POST /spaces/:spaceId/channels/:channelId/messages`, `DELETE /spaces/:spaceId/messages/:messageId` | `getIceServers`, `list`, `create`, `getMine`, `get`, `update`, `delete`, `join`, `leave`, `getMembers`, `getChannels`, `createChannel`, `updateChannel`, `deleteChannel`, `getMessages`, `sendMessage`, `deleteMessage` |
| notifications `GET|POST /notifications`, `GET /notifications/unread`, `PUT /notifications/:id/read`, `PUT /notifications/:id/clicked`, `DELETE /notifications/:id`, `PUT /notifications/read-all`, `PUT /notifications/click-all` | `list`, `create`, `getUnreadCount`, `markAsRead`, `markAsClicked`, `delete`, `markAllAsRead`, `markAllAsClicked` |
| calls `GET|POST /calls/stages`, `GET|PATCH /calls/stages/:id`, `POST /calls/stages/:id/guest-session`, `DELETE /calls/stages/guest-session`, `GET /calls/dm/:id` | `listStages`, `createStage`, `getStage`, `updateStage`, `createGuestSession`, `deleteGuestSession`, `getDmCall` |
| polls `GET /polls/:pollId`, `POST /polls/:pollId/vote` | `get`, `vote` |
| push `GET /push/config`, `POST|DELETE /push/subscriptions` | `getConfig`, `subscribe`, `unsubscribe` |
| imposters `GET|POST /imposters`, `POST /imposters/:imposterId/members`, `PATCH|DELETE /imposters/:imposterId/members/:memberId`, `DELETE /imposters/:imposterId` | `list`, `create`, `addMember`, `updateMemberRole`, `removeMember`, `delete` |
| ranking `GET /ranking/me`, `GET /ranking/:type` | `getMe`, `get`（`getFollowers`, `getPosts`, `getLikes`, `getStars` は同ルートの convenience wrapper） |
| rules `GET /rules` | `RulesAPI.get`; `SystemAPI.getRules` も同ルート |
| ui `GET /ui/summary` | `getSummary`; `SystemAPI.getUiSummary` も同ルート |
| oembed `GET /oembed` | `get`; `SystemAPI.getOembed` も同ルート |
| url-cards `GET /url-cards` | `get`; `SystemAPI.getUrlCard` も同ルート |
| system `GET /status` | `getStatus`, `getStatusResponse` |

上の登録一覧は `node --test test/other-server-contract.test.js` でnode:testの専用プロセスにServerの実ルートモジュールを読み込み、期待一覧と比較する。これはServerをlistenせず、handlerを実行せず、DBアダプターを生成しない「登録メタデータの照合」である。SDKの実際のHTTP method/path/query/body/headersについては `test/http-contract.test.js` と `test/dm-server-contract.test.js` のfetchモック検査であり、モック応答をServer応答とみなさない。

このテストはSDKメソッドの呼出・値変換、認証/認可、成功レスポンス本文、DB依存動作を検査しない。今回の担当APIはServerルートの登録表とSDK実装を目視で照合し、明白なpath/method/field不一致は見つからなかった。独立したServerプロセスへの隔離HTTP検査は `test/live-server-http.test.js` に追加した（上表のうち polls・push・imposters・ranking・rules・oembed・url-cards・spaces・notifications・calls の一部経路のみ。登録ルート全体の実HTTP網羅ではない）。`SystemAPI.getHealth()` と `getReady()` はServerアプリ側のhealth/ready mountを使用する補助APIで、ApiRegistry上のRESTルート一覧には含めていない。`/api/spec/endpoints` および `/api/docs` は旧配置へのfallbackであり、現行Server登録はそれぞれ `/spec/endpoints` と `/docs`。
