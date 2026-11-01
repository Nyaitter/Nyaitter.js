# 隔離Server実HTTPテスト

`node --test test/live-server-http.test.js` は Server を子プロセスで `127.0.0.1` の空きポートに起動し、`InMemoryAdapter` にテスト専用の一般ユーザー3名・管理者1名・一般ユーザー用の追加セッションを作る。ポート3000、既存稼働Server、実DBは使わない。Server PIDファイルの書き込み/削除を抑止し、ローカル保存先・operator socketは `/tmp/opencode/nyaitter-sdk-live-http` 以下に限定する。終了時は子プロセスにSIGTERMを送り、DBはプロセス終了とともに破棄する。

## 実行結果

2026-10-31（辞退修正後）: `npm test` は35件すべて成功。実認証の隔離Memory HTTPで、辞退後の一覧・メンバーからの除外と各操作の403、ホストによる再招待後の承認待ち・受諾・既読を確認した。承諾済みメンバーの辞退は400。SDK実装の変更はない。

2026-10-31（DM追加検証）: `npm test` は35件すべて成功。隔離fixtureのみE2Eを有効化し公開鍵の登録・更新・取得と認証・入力拒否を確認。DM詳細の `mark_read` と編集後再取得、未読数単独取得、招待辞退の応答と状態を確認した。SDKの修正はない。

2026-10-31: `npm test` は34件すべて成功。DMの検索・招待受諾・既読・メッセージ編集・ルーム更新・脱退・削除について、実セッションで成功、拒否、状態変化を追加確認した。SDKの修正はない。

2026-10-30（SDK公開準備の継続分）: `node --test test/live-server-http.test.js` は子テスト14件すべて成功（`# tests 15 / pass 15`）。`node --test` 全体も34件成功。実行は loopback のみの隔離ネットワーク（`unshare -n`）で行い、外部通信の試行が0件であることも併せて確認した。

前担当が残した実装はそのまま保持し、次のみ変更した。

- Spaces: `leave` の成功応答は `{ success: true }` ではなく `{ removed: boolean }` であるため期待値を修正。オーナーのleaveが409になる拒否系と、join再実行の `already: true` を追加。
- 隔離fixture: 起動前に選んだポートが待機中に他プロセスへ取られると `EADDRINUSE` で子プロセスが終了するため、その場合だけ新しいポートでfixtureごと最大3回再起動する。`EPERM`/`EACCES` など権限拒否は再試行せず、Serverのstderrを添えて即座に失敗する（拒否を別ポートで回避しない）。VAPID鍵を子プロセス内で生成してpush serviceを有効化（通知送信はしない）。URLカード取得は外部ネットワークへ出ないよう `UrlCardService.getUrlCard` だけを固定応答に差し替え、SDK/Server間のquery受け渡しと応答形のみを検証対象にした。
- 追加したHTTPサブテスト: polls / ranking / rules / oEmbed / urlCards、push、uploads / imposters / verification / appeals。

SDKから実際にHTTP実行したルート（`/server` prefix込み）:

| Route | 実行した条件 | 結果 |
|---|---|---|
| `GET /health` | Server起動待ち | 200で起動確認 |
| `GET /status` | 匿名 | `server=ok`、database状態・auth_methodsを確認 |
| `GET /ui/summary` | 匿名 / 有効session | 401 / notification・DM未読数が数値 |
| `GET /auth/me` | 匿名 / 不正token / 有効session | 匿名・不正は401、Alpha session成功payloadにuser ID |
| `GET /users/me/status` | 有効session | 成功payload object |
| `GET /auth/providers` | 匿名 | provider設定payloadを取得 |
| `GET /auth/sessions` | 匿名 / 有効session | 401 / session一覧。生tokenを含まないことを検証 |
| `DELETE /auth/sessions/:sessionId` | 所有ユーザー / 存在しないID | 追加session失効成功 / 404 |
| `GET /auth/blocked-ips` | 有効session | `blocked_ips`配列 |
| `DELETE /auth/blocked-ips/:ipHash` | 不正hash | 400 |
| `POST /auth/login-security/trust-current-ip` | 有効session | success |
| `GET /users/:userId/status` | 匿名 / 一般ユーザー / 管理者 | 401 / 403 / status成功 |
| `PUT /users/:userId/status` | 一般ユーザー / 管理者 | 403 / shadow=true,false更新成功 |
| `POST /users/:userId/trust-moderation` | 一般ユーザー / 管理者 | 403 / 不正reason 400 / ban・unban成功 |
| `PUT /users/:userId` | 管理者 | 不在ユーザー404 / Betaのverify等更新成功 |
| `POST /users/:userId/note-outcome-retract` | 管理者 | 存在しない実績404 |
| `POST /reports` | 匿名 / 不正target kind / 有効user target | 401 / 400 / report作成成功 |
| `GET /reports` | 一般ユーザー / 管理者 | 403 / reports配列 |
| `GET /reports/assigned` | 管理者 | reports配列 |
| `GET /reports/:id` | 管理者 | 作成reportの詳細取得 |
| `POST /users/me/account/delete/prepare` | 匿名 / 有効session | 401 / 一時confirmation token発行 |
| `DELETE /users/me/account` | 不正confirmation / 正しいconfirmation | 400 / fixtureアカウント削除成功 |
| `GET /auth/me` | account削除後、現行・追加Bearer token | ともに401 |
| `POST /posts` | 匿名 / 空content / 有効content | 匿名401、空contentは非2xx、投稿はqueued成功 |
| `GET /posts` | 投稿キュー処理後、`tab=all` | 投稿が一覧に現れるまでpollし取得 |
| `GET /posts/:id` | 作成した投稿 | id/contentが一覧の投稿と一致 |
| `GET /dm` | 匿名 | 401 |
| `POST /dm` | AlphaがBetaを含むDMを作成 | 成功、DM IDを取得 |
| `GET /dm/:dmId` | Alpha member / Outsider non-member | member成功、outsiderは403 |
| `POST /dm/:dmId/messages` | 有効content / 空content | 有効message payload一致、空contentは非2xx |
| `GET /dm/unread-counts` | Beta session | 成功payloadに`unread_total` |
| `GET /dm/unread` | Beta session | 未読総数がマップの合計と一致し、既読後0 |
| `GET /dm/keys` | 匿名 / E2E有効・複数ID / 単一ID | 401 / 登録前は空、登録後は各鍵、更新後の鍵を取得 |
| `POST /dm/keys` | 匿名 / 短い鍵 / E2E有効・有効な長さ | 401 / 400 / 登録・更新成功 |
| `GET /dm/find` | AlphaがBetaを検索 | 作成した1対1 DMのIDを取得 |
| `POST /dm/:dmId/accept` | non-member / 招待されたBeta | 403 / success |
| `POST /dm/:dmId/decline` | 匿名 / 存在しないDM / 承諾済み / 招待待ち / 辞退後 | 401 / 404 / 400 / success・メンバーから除外 / 403 |
| `PUT /dm/:dmId` | hostが辞退者を再招待 | メンバーに再追加され、本人は承認待ち。受諾後は承認待ち解除・既読可能 |
| `GET /dm/:dmId` | 編集後、承諾済みmemberの `mark_read=0` / `1`、non-memberの `1`、招待待ちmemberの `1` | 編集内容を再取得、未読維持 / 未読0 / 403 / pendingのまま |
| `PUT /dm/:dmId` | non-host / host | 403 / タイトル更新応答 |
| `PATCH /dm/:dmId/messages/:messageId` | 非作者 / 空content / 作者 | 403 / 400 / 更新contentとsuccess |
| `POST /dm/:dmId/read` | 未承諾member / non-member / 承諾済みBeta | 403 / 403 / success、DM別未読数が0に変化 |
| `POST /dm/:dmId/leave` | Beta | success、以後の詳細取得は403 |
| `DELETE /dm/:dmId` | non-host / host | 403 / success、以後の詳細取得は404 |
| `GET /spaces/ice-servers` | 匿名 | 成功、`ice_servers`配列 |
| `GET /spaces` | 匿名 | 作成した公開spaceを一覧で確認 |
| `POST /spaces` | 匿名 / 空name / 有効入力 | 401 / 400 / 作成成功、作成者所属一覧にも反映 |
| `GET /spaces/mine` | 作成者session | 作成spaceを確認 |
| `GET /spaces/:spaceId` | outsider | 公開spaceのpayloadを確認 |
| `PATCH /spaces/:spaceId` | non-owner | 403 |
| `POST /spaces/:spaceId/join` | Beta | 新規membership成功 |
| `GET /spaces/:spaceId/members` | outsider / 公開space | members配列を確認 |
| `GET /spaces/:spaceId/channels` | owner | 初期化された既定channelを確認 |
| `POST /spaces/:spaceId/channels` | 空name | 400 |
| `POST /spaces/:spaceId/channels/:channelId/messages` | Beta member / outsider | memberは作成成功、outsiderは403 |
| `GET /spaces/:spaceId/channels/:channelId/messages` | Beta member | 作成messageが一覧に永続化 |
| `DELETE /spaces/:spaceId/messages/:messageId` | 作成者 | `{deleted:true}` |
| `DELETE /spaces/:spaceId` | owner | `{deleted:true}` |
| `GET /groups` | session | 作成groupを一覧で確認 |
| `POST /groups` | 匿名 / 空name / 有効入力 | 401 / 400 / 作成成功、system roles初期化を確認 |
| `GET /groups/mine` | owner | 作成groupを確認 |
| `GET /groups/:groupId` | outsider | group payloadを確認 |
| `GET /groups/:groupId/roles` | owner | 初期化system rolesを確認 |
| `POST /groups/:groupId/join` | Beta | membership作成成功 |
| `PATCH /groups/:groupId` | non-owner member | 403 |
| `POST /groups/:groupId/invites` | ownerがOutsiderへ招待 | 招待作成と通知自動生成を確認 |
| `GET /notifications` | anonymous / recipient | 401 / 招待通知とunread数を確認 |
| `POST /notifications` | recipient id不正 / server-generated type | 400 / 403 |
| `GET /notifications/unread` | recipient | 件数payloadを確認 |
| `PUT /notifications/:id/read` | 他人 / recipient | 403 / 成功 |
| `PUT /notifications/:id/clicked` | recipient | `clicked:true` |
| `PUT /notifications/read-all` | recipient | success |
| `PUT /notifications/click-all` | recipient | success |
| `DELETE /notifications/:id` | recipient | success |
| `GET /notes/reason-tags` | anonymous / 無効side / Beta | 401 / 400 / tags配列 |
| `POST /posts/:postId/notes` | 空content / 有効content | 400 / 201、note payload確認 |
| `GET /posts/:postId/notes` | 作成者 | 作成noteを確認 |
| `POST /notes/bulk` | 作成者 / anonymous / 空配列 | 一括取得で同じnoteを確認、存在しないIDは `missing_post_ids` / 401 / 400 |
| `POST /notes/:noteId/ratings` | note作者自身 | 400（自己評価拒否） |
| `DELETE /notes/:noteId` | 非作成者 / 作成者 | 403 / success |
| `GET|POST /calls/stages`, `GET /calls/stages/:id`, `PATCH /calls/stages/:id`, `DELETE /calls/stages/guest-session` | 匿名 / owner / non-owner | 401 / 作成・公開情報 / owner以外403 / ended更新 / guest-session終了 |
| `GET /polls/:pollId` | 匿名（存在しないID / 不正ID / 実在） | 404 / 400 / poll payload |
| `POST /polls/:pollId/vote` | 匿名 / 空option / 有効option / 存在しないID | 401 / 400 / total_votes・my_votes更新と再取得での永続確認 / 400 |
| `GET /ranking/me` | 匿名 / 有効session | 401 / followers・posts・likes・starsのobject |
| `GET /ranking/:type` | followers・posts・likes・stars / 不正type | `data`配列 / 400 |
| `GET /rules` | 匿名 | `success`・`rules`文字列・`updated_at` |
| `GET /oembed` | url無し / 存在しない投稿 / 実在投稿 | 400 / 404 / `type=rich`・`html`・`provider_name=Nyaitter` |
| `GET /url-cards` | 匿名 / url空 | 固定応答card（`title`一致） / `card=null` |
| `GET /push/config` | 匿名 / 有効session | 401 / `enabled=true`・vapid公開鍵・`subscription_count` |
| `POST /push/subscriptions` | 不正keys / 正しい形 | 400 / `{success:true}`と`subscription_count`増加 |
| `DELETE /push/subscriptions` | 許可外endpoint / 登録済みendpoint | 400 / `{success:true}`と件数復帰 |
| `GET /uploads/storage` | 匿名 / 有効session | 401 / `limit_bytes`・`files`配列 |
| `POST /uploads` | fileName無し / 不正画像データ / 1x1 PNG | 400 / 400 / 保存された`id`とstorage一覧への反映 |
| `POST /uploads/prepare` | 空body / 有効入力 | 400 / `id`発行 |
| `PUT /uploads/:id` | 発行済みIDへ本体PUT | 2xx |
| `DELETE /uploads` | 空fileIds / 他人のkey / 自分のfile | 400 / 403 / `{success:true, deleted_count:1}` |
| `GET|POST /imposters`, `POST|PATCH|DELETE /imposters/:id/members/:memberId`, `DELETE /imposters/:id` | 匿名 / owner / 非owner | 401 / 作成・一覧・member追加・role変更・削除 / 4xx |
| `GET /verification-applications/me`, `POST /verification-applications` | 匿名 / 未申請 / 申請後 / 二重申請 | 401 / `application=null` / `assigned` / 400 |
| `GET /appeals/me`, `POST /appeals` | 匿名 / 非凍結 / 凍結中 / 空description / 二重提出 | 401 / 403 / `appeal=null` / 400 / 400 |

## 過去のServer観測

以前はMemoryで辞退が成功応答でもメンバーが残っていた。現行Serverの辞退ルートは `leaveGroupDm` を使い、上記の隔離Memory HTTPテストでは除外と再招待・受諾を確認した。他のアダプターの実行結果は未検証。

以前の実HTTP実行ではアカウント削除直後のセッション失効に疑義があったが、2026-10-30を含む直近実行では、削除アカウントの現行・追加セッションとも401となることを確認した。2分経過後の失効挙動は未計測。Serverソースは変更していない。

## 未実行・制約

全Server登録ルートの網羅ではなく、各APIの一部の実動作確認に限る。Authではprovider login/link、login approval、recovery、アカウント切替、imposter-auth、bot token、Turnstile、logout、期限切れsessionを未実施。管理系ではsession IP revoke、blocked IP success、admin moderation全操作、Reportsのupdate/resolve/trust-retractは未実施。Usersでは本人profile更新、follow/block、削除以外のaccount操作等は未実施。Verificationは `GET /verification-applications/me` と `POST /verification-applications` のみで、旧SDK互換のlist/get/updateは現行Serverルートが無いため未検証（実行すると404）。Appealsは凍結セッションでの状態取得・提出・二重提出拒否のみで、管理者側の解決操作は未検証。NyaitterAuthのstateful flowも未検証。Spacesではprivate/group visibility、ICEの非空設定などは未実施。Groupsではupdate成功、join request/response、member管理、各投稿操作などは未実施。Notificationsでは個別通知生成の許可ケースや不正ID、全レスポンスstatus/message variantsを未実施。Notesでは成功rating、re-evaluation/admin、sources/reasonsの境界を未実施。DMはE2E無効時の410、暗号化メッセージ、招待や脱退の詳細境界、Memory以外の辞退動作を未検証。Callsはstage作成・一覧・情報・owner更新・guest-session削除のみで、group/private/scheduled stage、guest-session発行/cookie、DM callは未検証。Pollsはpost添付pollの取得・投票・永続のみで、期限切れ/closed/複数選択/その他入力は未検証。Pushはconfig・購読登録・購読解除と入力拒否のみで、実通知配信・cross-origin拒否（Originヘッダ付き要求）・bot token拒否は未検証。URLカードは外部取得を固定応答に差し替えているため、実OGP取得・SSRF防御は未検証。Uploadsは1x1 PNGの直接/通常アップロードと削除のみで、quota超過・`as_user_id`代理・preview・置換は未検証。Impostersは作成から削除までの基本経路のみで、権限別の拒否詳細や上限は未検証。`test/other-server-contract.test.js` は登録メタデータの照合であり、実HTTP網羅率とはみなさない。Posts/DMの空content失敗statusは現状「非2xx」として検証し、具体値を固定していない。契約資料の登録数に対する実HTTP網羅率とはみなさない。
