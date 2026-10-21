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
    baseUrl: 'https://nyaitter.example.com',
    token: 'bot_xxxxxxxxxxxxxxxx',
  });
</script>
```

### 初期化

```js
const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'bot_xxxxxxxxxxxxxxxx',
  fetch: customFetch,       // 省略可
  WebSocket: customWebSocket, // 省略可
});
```

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
await realtime.connect();
```

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
  baseUrl: 'https://nyaitter.example.com',
  token: access_token,
});
```

## API リファレンス

すべてのメソッドは Promise を返し、サーバーのレスポンスをそのまま返します（例: `{ posts }`、`{ user }`）。

### 投稿 `client.posts`

| メソッド | できること |
|---|---|
| `getTimeline({ tab, limit })` | タイムライン取得（`recommended` / `following` など） |
| `getRecommended()` / `getPage()` / `getIds()` | おすすめ、ページ分割、ID 一覧 |
| `getTrending({ limit })` / `getTrendingHashtags({ limit })` | トレンド投稿・ハッシュタグ |
| `search({ query, limit })` / `getByTag(tag)` | 検索、タグ別取得 |
| `get(id)` / `getReplies(id)` / `getThread(id)` | 詳細、返信、スレッド |
| `getReactions(id)` / `getQuotes(id)` / `getReposts(id)` | リアクション、引用、リポスト一覧 |
| `getLiked()` / `getStarred()` / `getMetrics(id)` | いいね、スター、指標 |
| `create({ content, replyToId, quoteId, mask, lock })` | 投稿・返信・引用を作成（`mask` は CW、`lock` はフォロワー限定） |
| `update(id, { content })` / `edit(id, { content })` / `delete(id)` | 編集・削除 |
| `like(id)` / `unlike(id)` / `star(id)` / `unstar(id)` | いいね・スター |
| `repost(id)` / `unrepost(id)` / `pin(id)` / `markAsRead(ids)` | リポスト、ピン留め、既読送信 |
| `hydrate(ids)` | 複数投稿をまとめて取得 |

### ユーザー `client.users`

| メソッド | できること |
|---|---|
| `getMe()` / `get(id)` / `getByHandle(handle)` / `search(query)` | 自分、指定ユーザー、検索 |
| `getBatch(ids)` / `getUsers(ids)` / `getCounts(id)` | 複数取得、件数取得 |
| `getPosts(id)` / `getReplies(id)` / `getLikes(id)` / `getStars(id)` / `getMedia(id)` | ユーザーごとの投稿一覧 |
| `getFollowers(id)` / `getFollowing(id)` / `getPinnedPosts(id)` | フォロワー、固定投稿 |
| `follow(id)` / `unfollow(id)` / `toggleBlock(id)` / `block(id)` / `unblock(id)` | フォロー、ブロック |
| `mute(id)` / `unmute(id)` / `getMutes()` / `getBlocks()` | ミュート、ブロック一覧 |
| `pinPost(userId, postId)` / `unpinPost(userId, postId)` | 固定投稿の設定・解除 |
| `updateProfile({ name, me, ... })` | プロフィール更新 |
| `getLogs(id)` / `isLocked(id)` / `getRecommended()` | その他の取得 |

### ダイレクトメッセージ `client.dm`

| メソッド | できること |
|---|---|
| `list()` / `getRooms()` / `find(query)` | ルーム一覧、検索 |
| `get(id)` / `getRoom(id)` | ルームとメッセージを取得 |
| `create({ members, title })` / `updateRoom(id, { title })` | ルーム作成・編集 |
| `sendMessage(id, { content })` / `editMessage(id, msgId, { content })` / `deleteMessage(id, msgId)` | メッセージの送信・編集・削除 |
| `addReaction(id, msgId, emoji)` / `removeReaction(id, msgId, emoji)` | リアクション |
| `markAsRead(id)` / `leave(id)` / `addMember(id, userId)` / `removeMember(id, userId)` | 既読、退出、メンバー管理 |
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
| `client.verification` | `getStatus()` / `apply()` / `list()` / `get(id)` / `update(id, ...)` |
| `client.imposters` | `list()` / `create({ name })` / `addMember(id, { userId, role })` / `updateMemberRole(...)` / `removeMember(...)` / `delete(id)` |
| `client.push` | `getConfig()` / `subscribe({ subscription })` / `unsubscribe(...)` |
| `client.rules` | `get()` |
| `client.urlCards` | `get(url)` |
| `client.oembed` | `get(url)` |
| `client.ui` | `getSummary()` |
| `client.system` | `getStatus()` / `getHealth()` / `getReady()` / `getRules()` / `getUrlCard(...)` / `getOembed(...)` / `getUiSummary()` / `getApiSpecResponse()` / `getDocsResponse()` / `getDocResponse(docId)` |

### ログイン・アカウント `client.auth`

| メソッド | できること |
|---|---|
| `login({ username, password, token2fa })` / `logout()` / `getMe()` | パスワード・2FA ログイン、ログアウト |
| `register({ scratchId, password, username, email })` | 新規登録 |
| `checkScratch(id)` / `linkScratch({ scratchId, code })` | Scratch アカウントの確認・連携 |
| `getAccounts()` / `switchAccount({ accountId, password })` | アカウント切り替え |
| `linkAccount(...)` / `unlinkAccount(...)` | 連携アカウントの追加・解除 |
| `setup2FA(...)` / `verify2FA(...)` / `disable2FA(...)` | 二段階認証 |
| `getSessions()` / `revokeSession(id)` | セッション一覧、失効 |
| `startExternalAuth(...)` / `confirmExternalAuth(...)` / `completeExternalAuth(...)` | 外部サービス連携ログイン |
| `requestAccountDeletion(...)` / `cancelAccountDeletion()` | アカウント削除申請 |

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
| `moderateCall({ target, action })` | ホストが参加者を操作（`mute` など） |

受信イベント: `notification`、`dm`、`callJoined`、`callSignal`、`callRoster`、`callChat`、`callTranscript`、`callState`、`callScreen`、`callStage`、`callWatching`、`callModerated`、`callKicked`、`callEnded`、`callError`

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

## ライセンス

MIT License
