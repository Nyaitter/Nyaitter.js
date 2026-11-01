# DM SDK / Server 契約照合

対象は `Server/server/routes/dm.js` の17登録ルートと `src/api/DmAPI.js`。登録は全て `auth: 'required'`。通常の実ハンドラーは `requireAuth` を通し、個別ルートではDMメンバー/ホスト/発言者等の認可を追加する。表のSDKメソッド名は `client.dm.*`。

| Method / path | SDK | 入力 | 成功レスポンス（Server） | SDK照合 |
|---|---|---|---|---|
| GET `/dm/` | `list` | `limit` (default 50, max 100), `offset` (default 0) | `{dm,members,unread_total}` | query既定値一致 |
| GET `/dm/unread` | `getUnreadCount` | — | `{unread_count}` | 一致 |
| GET `/dm/unread-counts` | `getUnreadCounts` | — | `{unread_total,unread_by_dm}` | 一致 |
| GET `/dm/find` | `find` | `user_id` 必須・非負整数 | `{dm:null}` または `{dm}` | 一致（query変換） |
| GET `/dm/keys` | `getKeys` | 任意 `user_ids` (comma-separated) | `{keys}`。E2E無効時410 | 一致 |
| POST `/dm/keys` | `setKey` | `public_key` 必須、長さ10–2048 | `{success:true}`。E2E無効時410 | 一致 |
| POST `/dm/` | `create` | `member` 非空配列（SDK `members`） | 201 `{dm,created:true}` または `{dm,created:false}` | 一致 |
| GET `/dm/:dmId` | `get` | path `dmId`; 任意 `limit,offset,mark_read` | DM payload | 一致（booleanを`1`/`0`へ変換） |
| PUT `/dm/:dmId` | `updateRoom` | `title,member,host_id,post`、履歴更新時は取得した `state_version` 必須 | `{dm}` | 一致（camelCase変換）。旧クライアントが履歴を版なしで送ると400 |
| DELETE `/dm/:dmId` | `delete` | path `dmId` | `{success:true}` | 一致 |
| PATCH `/dm/:dmId/messages/:messageId` | `editMessage` | path両ID; `content` 非空 | `{success:true,message}` | 一致 |
| DELETE `/dm/:dmId/messages/:messageId` | `deleteMessage` | path両ID | `{success:true}` | 自分の発言のみ削除。競合時409 |
| POST `/dm/:dmId/messages` | `sendMessage` | path `dmId`; body `message` object | 201 `{dm,message}` | 一致（SDK fieldsを`message`に包む） |
| POST `/dm/:dmId/accept` | `accept` | path `dmId` | `{success:true,dm}` | 一致 |
| POST `/dm/:dmId/decline` | `decline` | path `dmId` | `{success:true}` | 一致 |
| POST `/dm/:dmId/read` | `markAsRead` | path `dmId`; body任意 | `{success:true}` | 一致 |
| POST `/dm/:dmId/leave` | `leave` | path `dmId` | `{success:true}` | 一致 |

実認証HTTPでの状態変化は `live-server-http.md` を参照。隔離Memoryでは辞退後にメンバー・一覧から除外され、アクセスは403、再招待は承認待ちとなり、受諾後は既読可能になることを確認した。承諾済みメンバーの辞退は400。他のアダプターは未検証。公開鍵の実行確認はE2E有効の隔離fixtureに限る。

`node --test test/dm-server-contract.test.js` は17ルートのSDK wire method/path/query/bodyとBearerヘッダー、およびエラーstatus/message伝播を検証する。SDK側テストはServerを起動せず、ServerハンドラーのDB動作、各ルートの実際の認証/メンバー認可や全ての成功・失敗レスポンスを実証するものではない。動的ルート網羅を保証するにはServerのExpress mount後にルートスタックを列挙し、SDK側に維持した契約fixtureと比較する統合テストが必要。現状のSDK単体テストではServer実行時の登録変更を自動検出しない。

## 削除された旧SDK操作（0.2.0）

`addMember`, `removeMember`, `addReaction`, `removeReaction` は現行Serverに同等HTTP登録がないため、0.2.0 で SDK から削除した。メンバー追加は `updateRoom` の `member` で、退出は `leave` で行う。
