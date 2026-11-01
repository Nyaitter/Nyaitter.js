# Nyaitter.js

Nyaitter の API を JavaScript / TypeScript から呼ぶクライアントです。

## 使い始める

### インストール

```bash
npm install nyaitter.js
```

```js
import { NyaitterClient } from 'nyaitter.js';
// CommonJS: const { NyaitterClient } = require('nyaitter.js');
```

ブラウザでは CDN から読み込むと `Nyaitter` で同じ API を使えます。

```html
<script src="https://cdn.jsdelivr.net/npm/nyaitter.js/dist/nyaitter.js"></script>
<script>
  const client = new Nyaitter.NyaitterClient({
    baseUrl: 'https://nyaitter.example.com/server',
    token: 'bot_xxxxxxxxxxxxxxxx',
  });
</script>
```

### 初期化

```js
const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com/server',
  token: 'bot_xxxxxxxxxxxxxxxx',
  fetch: customFetch,       // 省略可
  WebSocket: customWebSocket, // 省略可
});
```

既定のサーバーでは `baseUrl` に `/server` まで指定します。サーバー側で別のパスを設定している場合は、そのパスを使ってください。

`token` には Bot トークン、NyaitterAuth アクセストークン、またはセッショントークンを指定します。Node.js 18 以上なら `fetch` の指定は不要です。トークンは `client.setToken(...)` / `client.getToken()` で変更・取得できます。

### クイックスタート

```js
const { posts } = await client.posts.getTimeline();
const { post } = await client.posts.create({ content: 'Nyaitter.js からこんにちは！' });
await client.posts.like(post.id);
```

### リアルタイム

```js
const realtime = client.realtime({ autoReconnect: true, reconnectDelayMs: 3000 });
realtime.on('notification', (n) => console.log('新着通知:', n));
realtime.on('dm', ({ dmId, message }) => console.log(`[DM ${dmId}]`, message.content));
realtime.on('spaceMessage', ({ spaceId, message }) => console.log(`[スペース ${spaceId}]`, message.content));
await realtime.connect();
realtime.subscribeSpace(spaceId);
```

### DM履歴の更新

履歴の取得後に別の変更があった場合の上書きを防ぐには、取得した `state_version` をそのまま渡します。

```js
const { dm: [room] } = await client.dm.get(dmId);
await client.dm.updateRoom(dmId, {
  post: room.post.filter(message => message.id !== messageId),
  stateVersion: room.state_version,
});
```

履歴の更新には `stateVersion` が必要です。409 が返った場合は履歴を取得し直し、内容を確認してください。古いサーバーは世代の比較に対応していないため、更新前に対応を確認してください。

### NyaitterAuth

自サービスのユーザーを Nyaitter アカウントでログイン・連携させます。

```js
const { auth_url } = await client.nyaitterAuth.initiate({
  appId: 'my_app',
  redirectUri: 'https://example.com/callback',
  scopes: ['profile:read', 'posts:write', 'continuous_access'],
  name: '私のWebサービス',
});

const { user, access_token } = await client.nyaitterAuth.exchangeToken({
  appId: 'my_app',
  code: callbackCode,
});

const userClient = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com/server',
  token: access_token,
});
```

### 拡張 API（サーバー間連携）

拡張キーで認証する `/internal/extensions` 配下の NyaitterAuth フローは `client.extensions` から使えます。拡張キーはクライアント初期化時の `extensionKey` オプションか、メソッドごとに渡します。

```js
const serverClient = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com/server',
  extensionKey: '<拡張キー>',
});
const { auth_url } = await serverClient.extensions.initiate({
  redirectUri: 'https://example.com/callback',
  scopes: ['profile:read', 'continuous_access'],
});
const { access_token } = await serverClient.extensions.exchangeToken({ code: callbackCode });
const { user } = await serverClient.extensions.getUserInfo({ accessToken: access_token });
```

## API リファレンス

すべてのメソッドは Promise を返し、サーバーのレスポンスをそのまま返します（例: `{ posts }`、`{ user }`）。

### 投稿 `client.posts`

| メソッド | できること |
|---|---|
| `getTimeline({ tab, limit })` | タイムライン取得（`recommended` / `following` など） |
| `getRecommended()` / `getPage()` / `getIds()` | おすすめ、ページ分割、ID 一覧 |
| `getTrending({ limit })` / `getTrendingHashtags({ limit })` | トレンド投稿・ハッシュタグ |
| `search({ query, limit })` | 検索（タグ検索は検索クエリで指定） |
| `get(id)` / `getReplies(id)` / `getThread(id)` | 詳細、返信、スレッド |
| `getQuotes(id)` / `getReposts(id)` / `getLikes(id)` | 引用、リポスト、いいね一覧 |
| `getMetrics(ids)` | 指標を一括取得（自分のいいね・スター済み一覧は `client.users.getLikes(id)` / `getStars(id)`） |
| `create({ content, replyToId, quoteId, mask, lock })` | 投稿・返信・引用を作成（`mask` は CW、`lock` はフォロワー限定） |
| `update(id, { content })` / `edit(id, { content })` / `delete(id)` | 編集・削除 |
| `like(id)` / `unlike(id)` / `star(id)` / `unstar(id)` | いいね・スター |
| `repost(id)` / `unrepost(id)` / `pin(id)` | リポスト、ピン留め |
| `hydrate(ids)` | 複数投稿をまとめて取得 |

### ユーザー `client.users`

| メソッド | できること |
|---|---|
| `getMe()` / `get(id)` / `getByHandle(handle)` / `search(query)` | 自分、指定ユーザー、検索 |
| `getBatch(ids)` / `getUsers(ids)` / `getCounts(id)` | 複数取得、件数取得 |
| `getPosts(id, { mode })` / `getLikes(id)` / `getStars(id)` / `getMedia(id)` | ユーザーごとの投稿一覧（返信は `mode: 'replies'`） |
| `getFollowers(id)` / `getFollowing(id)` / `getPinnedPosts(id)` | フォロワー、固定投稿 |
| `follow(id)` / `unfollow(id)` / `toggleBlock(id)` / `block(id)` / `unblock(id)` | フォロー、ブロック |
| `updateProfile({ name, me, ... })` | プロフィール更新 |
| `getLogs(id)` / `isLocked(id)` / `getRecommended()` | その他の取得 |

### コミュニティノート `client.notes`

ログイン中のユーザーが閲覧できるノートを取得・評価できます。

| メソッド | できること |
|---|---|
| `create(postId, { content, sources, reasons })` | ノート作成（本文1〜1000文字、出典は HTTPS） |
| `list(postId)` | `{ notes, eligible }` を取得 |
| `listForPosts(postIds)` | 複数投稿分を一括取得（最大50件）→ `{ notes_by_post, missing_post_ids }` |
| `getReasonTags({ side })` | 作成・評価理由を取得（`create` / `positive` / `negative`、省略時はすべて） |
| `rate(noteId, { helpful, reasons })` | 評価を登録・変更。件数、`myRating`、保存した理由コードを取得 |
| `delete(noteId)` | 自分のノートを削除（管理者も可能） |
| `reEvaluate(noteId)` | 管理者による再判定 |

```js
const { tags } = await client.notes.getReasonTags({ side: 'create' });
const { note } = await client.notes.create(postId, {
  content: '投稿の補足です。',
  sources: [{ url: 'https://example.com/source', title: '出典' }],
  reasons: tags.slice(0, 1).map(tag => tag.code),
});
const { notes } = await client.notes.list(postId);
```

理由は取得したコードから最大3件指定します。評価は `helpful: true` が「参考になる」、`false` が「参考にならない」です。評価の取消 API はありません。`myRating: null` は未評価を表します。

### 利用状態とランク表示

`client.users.getStatus()` で自分の実ランクと利用できる機能の説明を確認できます。実スコアは返しません。`trust` が実ランク、`display_ranks` が表示用ランク、`display_rank_options` が選べる表示用ランクです。公開ユーザーの `display_ranks` は表示用であり、実ランクの判定には使わないでください。

```js
const status = await client.users.getStatus();
await client.users.updateProfile({
  settings: {
    show_ranks: true,
    display_ranks: { trust: status.display_rank_options.trust[0] ?? null },
  },
});
```

表示ランクは現在より低い候補だけ指定できます。各項目の `null` は指定解除、省略は現在の設定を保持します。プロフィール更新は `PUT /users/me` に送信します。

管理者は `client.users.moderateTrust(userId, { banned, reason })` で利用制限を指定・解除し、`client.users.retractNoteOutcome(userId, { noteId, reason })` で削除済みノートの実績を取り消せます。理由は10文字以上必要です。

`client.system.getStatus()` はサーバー設定・制限値を返す既存 API です。個人の利用状態とは別です。機能別の利用可否はサーバーが判定し、利用できない操作は `NyaitterError` になります。

型は既存と同じ JSDoc 形式です。`src/index.js` から `CommunityNote`、`NoteRatingSummary`、`NoteReasonTag`、`UserStatus`、`DisplayRanks`、`DisplayRankOverrides`、`UserSettings`、`User`、`ServerStatus` などを型として参照できます。

### ダイレクトメッセージ `client.dm`

| メソッド | できること |
|---|---|
| `list()` / `getRooms()` / `find(query)` | ルーム一覧、検索 |
| `get(id)` / `getRoom(id)` | ルームとメッセージを取得 |
| `create({ members, title })` / `updateRoom(id, { title })` | ルーム作成・編集 |
| `sendMessage(id, { content })` / `editMessage(id, msgId, { content })` / `deleteMessage(id, msgId)` | メッセージの送信・編集・削除 |
| `markAsRead(id)` / `leave(id)` | 既読、退出（メンバー追加は `updateRoom(id, { member })`） |
| `getUnreadCount()` / `getUnreadCounts()` | 未読件数 |

### グループ `client.groups`

| メソッド | できること |
|---|---|
| `list({ query })` / `listMine()` / `get(id)` | 検索、所属一覧、詳細 |
| `create({ name, description })` / `update(id, ...)` / `delete(id)` | 作成・編集・削除 |
| `join(id)` / `leave(id)` / `transferOwner(id, userId)` | 参加、退出、オーナー移譲 |
| `getPosts(id)` | グループ内の投稿一覧（投稿は `client.posts.create({ content, groupId })`） |
| `invite(id, userId)` / `getInvitesMine()` / `respondInvite(id, accept)` | 招待、招待への返答 |
| `getJoinRequests(id)` / `respondJoinRequest(id, requestId, accept)` | 参加申請の承認・却下 |
| `getRoles(id)` / `createRole(...)` / `updateRole(...)` / `deleteRole(...)` | ロール管理 |
| `getMembers(id)` / `updateMember(...)` / `banMember(...)` / `unbanMember(...)` | メンバー管理 |
| `getIconUrl(group)` | グループアイコンの URL |

### スペース `client.spaces`

| メソッド | できること |
|---|---|
| `list()` / `getMine()` / `get(id)` | 公開・参加中のスペースと詳細を取得 |
| `create(...)` / `update(id, ...)` / `delete(id)` | 作成・更新・削除 |
| `join(id)` / `leave(id)` / `getMembers(id)` | 参加・退出・メンバー取得 |
| `getChannels(id)` / `createChannel(...)` / `updateChannel(...)` / `deleteChannel(...)` | チャンネル管理 |
| `getMessages(...)` / `sendMessage(...)` / `deleteMessage(...)` | メッセージ取得・送信・削除 |
| `getIceServers()` | 音声通話の接続設定 |

### ステージ・通話 `client.calls`

音声・映像は `client.realtime()` の `call:*` メッセージ（WebRTC シグナリング）でやり取りします。

| メソッド | できること |
|---|---|
| `listStages({ query, offset })` | 参加できるステージを検索 |
| `createStage({ name, description, visibility, allow_guest_join, scheduled_at })` | ステージ作成・予約 |
| `getStage(id)` | 参加情報と ICE 設定を取得 |
| `updateStage(id, { status, speaker_ids, allow_guest_join })` | 状態、スピーカー、ゲスト参加を更新 |
| `createGuestSession(id)` / `deleteGuestSession()` | ゲスト参加セッションの発行・終了 |
| `getDmCall(dmId)` | DM 通話の参加情報と ICE 設定を取得 |
| `getIceConfig(info)` | `RTCPeerConnection` 用の ICE 設定を取り出す |

### 通知 `client.notifications`

| メソッド | できること |
|---|---|
| `list()` | 通知一覧 |
| `getUnreadCount()` | 未読件数 |
| `markAsRead(id)` / `markAllAsRead()` / `markAsClicked(id)` / `markAllAsClicked()` | 既読化、クリック記録 |
| `create(...)` / `delete(id)` | 作成・削除 |

### アップロード `client.uploads`

| メソッド | できること |
|---|---|
| `upload({ file, fileName, contentType })` | アップロード（`Buffer`、`Uint8Array`、`Blob`、base64 に対応） |
| `getStorage()` | ストレージ使用状況 |
| `delete(paths)` | ファイル削除 |
| `getPreviewUrl(path)` | プレビュー URL を取得 |

### その他

| ネームスペース | メソッド |
|---|---|
| `client.polls` | `get(pollId)` / `vote(pollId, { optionIds })` |
| `client.ranking` | `getMe()` / `get(kind, opts)` / `getFollowers({ limit })` / `getPosts({ limit })` / `getLikes({ limit })` / `getStars({ limit })` |
| `client.reports` | `create({ targetKind, targetId, description })` / `list()` / `get(id)` / `update(id, ...)` |
| `client.appeals` | `getStatus()` / `create({ description })` |
| `client.verification` | `getStatus()` / `apply()` |
| `client.extensions` | `initiate({ extensionKey, redirectUri })` / `exchangeToken({ extensionKey, code })` / `getUserInfo({ extensionKey, accessToken })`（拡張キーで認証するサーバー間連携） |
| `client.imposters` | `list()` / `create({ name })` / `addMember(id, { userId, role })` / `updateMemberRole(...)` / `removeMember(...)` / `delete(id)` |
| `client.push` | `getConfig()` / `subscribe({ subscription })` / `unsubscribe(...)` |
| `client.rules` | `get()` |
| `client.urlCards` | `get(url)` |
| `client.oembed` | `get(url)` |
| `client.ui` | `getSummary()` |
| `client.system` | `getStatus()` / `getHealth()` / `getReady()` / `getRules()` / `getUrlCard(...)` / `getOembed(...)` / `getUiSummary()` / `getOpenApiSpec()` / `getApiSpecResponse()` / `getDocsResponse()` / `getDocResponse(docId)` |

### 0.2.0 の破壊的変更（旧メソッドの削除）

0.2.0 で、現行サーバーに対応ルートがない旧互換メソッドを削除しました。旧バージョンが必要な場合は、利用側で `nyaitter.js` のバージョンを `0.1.x` に指定してください。

- 投稿: `getByTag`、`getLiked`、`getStarred`、`getReactions`、`markAsRead`
- ユーザー: `getReplies`、`pinPost`、`unpinPost`、`getBlocks`、`getMutes`、`mute`、`unmute`
- DM: `addMember`、`removeMember`、`addReaction`、`removeReaction`
- 認証: `login`、`register`、`checkScratch`、`linkScratch`、`linkAccount`、`setup2FA`、`verify2FA`、`disable2FA`、`startExternalAuth`、`confirmExternalAuth`、`completeExternalAuth`、`requestAccountDeletion`、`cancelAccountDeletion`
- 認証申請: `list`、`get`、`update`

移行先: 認証はプロバイダー別の initiate / verify、アカウント削除は `client.users.prepareAccountDeletion()` と `client.users.deleteAccount()`、返信一覧は `client.users.getPosts(id, { mode: 'replies' })`、自分のいいね・スター済み一覧は `client.users.getLikes(id)` / `getStars(id)`、DM のメンバー追加は `client.dm.updateRoom(id, { member })` を使います。フォローとブロックはサーバー側で状態を反転します。`unfollow`、`block`、`unblock` も反転操作であり、現在の状態によっては名前と逆の操作になります。

### ログイン・アカウント `client.auth`

| メソッド | できること |
|---|---|
| `getProviders()` / `initiateProvider(provider, body)` / `verifyProvider(provider, body)` | プロバイダー認証（Scratch、メール、パスキー、Google、Microsoft 等）の開始・検証 |
| `getLinkedProviders()` / `initiateProviderLink(...)` / `verifyProviderLink(...)` / `unlinkProvider(...)` | プロバイダー連携の確認・追加・解除 |
| `logout()` / `getMe()` | ログアウト、ログイン中ユーザー |
| `pollLoginApproval(id, token)` / `getLoginApproval(id)` / `decideLoginApproval(id, decision)` | ログイン承認フロー |
| `startAccountRecovery(...)` / `pollAccountRecovery(...)` / `getAccountRecovery(id)` / `decideAccountRecovery(...)` | アカウント復旧フロー |
| `getAccounts()` / `switchAccount({ accountId })` / `unlinkAccount(accountId)` | アカウント切り替え、記憶済みアカウントの解除 |
| `getSessions()` / `revokeSession(id)` / `revokeSessionIp(id)` | セッション一覧、失効、IP 失効 |
| `getBlockedIps()` / `deleteBlockedIp(hash)` / `trustCurrentIp()` | ログインセキュリティ |
| `createBotToken(name)` / `getBotTokens()` / `deleteBotToken(id)` | Bot トークン管理 |
| `verifyTurnstile(token)` / `devLogin(username)` / `testProtected()` | その他 |

アカウント削除は `client.users.prepareAccountDeletion()` と `client.users.deleteAccount(confirmationToken)` を使います。

### NyaitterAuth `client.nyaitterAuth`

| メソッド | できること |
|---|---|
| `initiate({ appId, redirectUri, scopes, name })` | 認可 URL を生成 |
| `exchangeToken({ appId, code })` | コードをトークンに交換 |
| `getUserInfo()` | トークンのユーザー情報を取得 |
| `getAuthorizedApps()` / `updateAuthorizedApp(id, ...)` / `revokeAuthorizedApp(id)` | 連携アプリの一覧、権限変更、解除 |
| `getRequestResponse(id)` / `approveResponse(body)` / `denyResponse(body)` | 認可リクエストの確認・承認・拒否 |

### リアルタイム `client.realtime()`

| メソッド | できること |
|---|---|
| `on(event, handler)` / `off(event, handler)` | イベントの購読・解除 |
| `connect({ autoReconnect, reconnectDelayMs })` / `disconnect()` | 接続・切断 |
| `send(message)` | 任意のメッセージを送信 |
| `joinCall({ kind, id, muted, camera })` / `leaveCall()` | 通話・ステージに参加・退出 |
| `watchStage(id)` | 予約ステージの開始を待つ |
| `sendCallSignal({ to, data })` | WebRTC シグナルを送信 |
| `setCallState({ muted, camera })` / `setCallScreen({ active, streamId })` | 音声・映像・画面共有の状態を通知 |
| `sendCallChat({ text })` / `sendCallTranscript({ text })` | 通話チャット・文字起こしを送信 |
| `deleteCallChatMessage({ messageId })` / `clearCallChat()` | 通話チャットの削除（ホストは全員分可）・全消去（ホストのみ） |
| `moderateCall({ target, action })` | ホストが参加者を操作（`mute` など） |
| `subscribeSpace(spaceId)` / `unsubscribeSpace(spaceId)` | スペースのテキストメッセージを購読・解除 |
| `joinSpaceVoice({ spaceId, channelId, muted, deafened })` / `leaveSpaceVoice({ spaceId, channelId })` | スペースボイスへの参加・退出 |
| `setSpaceVoiceState({ spaceId, channelId, muted, deafened })` | スペースボイスの状態を通知 |
| `sendSpaceSignal({ spaceId, channelId, toUserId, data })` | スペースボイスの WebRTC シグナルを送信 |

受信イベント: `notification`、`dm`、`dmEdited`、`dmUnreadCount`、`dmRead`、`timelinePost`、`pollUpdated`、`callJoined`、`callSignal`、`callRoster`、`callChat`、`callChatDelete`、`callChatClear`、`callTranscript`、`callState`、`callScreen`、`callStage`、`callWatching`、`callModerated`、`callKicked`、`callEnded`、`callError`、`spaceMessage`、`spaceMessageDeleted`、`spaceDeleted`、`spaceMemberLeft`、`spaceSignal`、`spaceVoiceRoster`（汎用の `call` / `space` / `raw` でも受けられます）

## エラー処理

API が失敗すると `NyaitterError` がスローされます。`status` に HTTP ステータス、`data` にレスポンス本体が入ります。

```js
import { NyaitterClient, NyaitterError } from 'nyaitter.js';

try {
  await client.posts.create({ content: '' });
} catch (error) {
  if (error instanceof NyaitterError) {
    console.error(`API エラー [HTTP ${error.status}]: ${error.message}`, error.data);
  } else {
    console.error('通信エラー:', error);
  }
}
```

## 開発者向けメモ（ビルドとコミット）

- `npm run build` は `dist/`（ESM / CJS / ブラウザ向け）と型定義 `dist/types/` / `dist/types-cjs/` を生成します。`package.json` の `types` はこの型定義を参照するため、コミット時は `dist/types/` と `dist/types-cjs/` と `scripts/` を dist 本体と一緒に含めてください（`.gitignore` では除外していません。拾い漏れると型が解決できないパッケージになります）。
- `build:types` には TypeScript が必要です。`node_modules` に TypeScript が入っていない作業ツリーでは、先に `npm install` を実行してからビルドしてください。
- `scripts/` はビルド専用（`build:types` の後段）のため、公開パッケージの `files` には含めていません。

## ライセンス

MIT License
