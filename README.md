# Nyaitter.js

**Nyaitter.js** は、[Nyaitter](https://github.com/Nyaitter/Server) の API を JavaScript / TypeScript から手軽に使える公式クライアントライブラリです。  
Bot トークン（`bot_...`）または NyaitterAuth アクセストークン（`nyauth_...`）を使用して、Nyaitter のすべての機能（投稿、ユーザー、DM、グループ、通知、アップロード、ランキング、通報、認証バッジ申請、システム情報、リアルタイム WebSocket 受信など）をシンプルなコードで呼び出せます。

```js
import { NyaitterClient } from 'nyaitter.js';

const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'bot_xxxxxxxxxxxxxxxx', // 設定画面で発行した Bot トークン
});

// 投稿する
await client.posts.create({ content: 'Nyaitter.js からこんにちは！🐾' });
```

---

## 必要な環境

- **Node.js 18 以上**（または `fetch` / `WebSocket` が動作するブラウザ・Runtime）
- **Nyaitter サーバーの URL**
- **Bot トークン**（Nyaitter の設定画面 → 「API キー」から即座に発行可能）

---

## インストール

```bash
npm install nyaitter.js
```

---

## 初期化

```js
import { NyaitterClient } from 'nyaitter.js';

const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'bot_xxxxxxxxxxxxxxxx',
});
```

---

## 機能一覧と API リファレンス

### 1. 投稿 (`client.posts`)

投稿の作成、取得、編集、削除、いいね、スター、リポスト、ピン留め、スレッド取得、検索、トレンド取得などを行います。

```js
// おすすめタイムラインを取得
const { posts } = await client.posts.getTimeline();

// フォロー中タイムラインを取得
const { posts } = await client.posts.getTimeline({ tab: 'following', limit: 20 });

// トレンド投稿・トレンドハッシュタグを取得
const { posts: trendingPosts } = await client.posts.getTrending({ limit: 10 });
const { trends } = await client.posts.getTrendingHashtags({ limit: 10 });

// 投稿を検索
const { posts: searchResults } = await client.posts.search({ query: 'ねこ', limit: 20 });

// 投稿の詳細・リプライ・スレッド（ツリー階層）を取得
const { post } = await client.posts.get(123);
const { replies } = await client.posts.getReplies(123);
const thread = await client.posts.getThread(123);

// 新規投稿（返信・引用・画像添付・閲覧注意CW・鍵垢限定など）
await client.posts.create({
  content: 'はじめての投稿！',
  mask: false, // CW（閲覧注意）
  lock: false, // フォロワー限定
});

// リプライ（返信）
await client.posts.create({ content: '返信です', replyToId: 123 });

// 引用リポスト
await client.posts.create({ content: '引用コメント', quoteId: 123 });

// 投稿の編集・更新
await client.posts.update(123, { content: '編集後の本文' });

// 投稿の削除
await client.posts.delete(123);

// いいね / いいね解除（トグル）
await client.posts.like(123);
await client.posts.unlike(123);

// スター（ブックマーク）/ 解除（トグル）
await client.posts.star(123);
await client.posts.unstar(123);

// 単純リポスト / 取り消し
await client.posts.repost(123);
await client.posts.unrepost(repostPostId);

// プロフィールへのピン留め / 解除（トグル）
await client.posts.pin(123);

// 複数投稿のハイドレーション（一括取得）
const { posts: hydrated } = await client.posts.hydrate([123, 124, 125]);

// 複数投稿のメトリクス（いいね数・スター数・リプライ数・リポスト数）取得
const { metrics } = await client.posts.getMetrics([123, 124]);
```

---

### 2. ユーザー (`client.users`)

ユーザープロフィール、自分の情報、フォロー・フォロワー、いいね一覧、メディア一覧、プロフィール更新などを操作します。

```js
// 自分のアカウント情報（Bot 所有者）を取得
const me = await client.users.getMe();
console.log(`ログイン中: ${me.user.name} (@${me.user.nyaitter_id})`);

// ユーザー ID または ハンドルでプロフィールを取得
const { user } = await client.users.get(12);
const { user: userByHandle } = await client.users.getByHandle('nyanko');

// ユーザー検索・おすすめユーザー
const { users } = await client.users.search({ query: 'nyanko' });
const { users: recommended } = await client.users.getRecommended({ limit: 10 });

// 複数ユーザーの一括取得
const { users: batch } = await client.users.getBatch([12, 34, 56]);

// ユーザーの投稿一覧（通常投稿のみ / リプライのみ / すべて）
const { posts } = await client.users.getPosts(12, { mode: 'posts', limit: 20 });

// カウント情報（投稿数・メディア数・フォロワー数・フォロー数）
const counts = await client.users.getCounts(12);

// 投稿メディア（画像等）一覧
const { media_items } = await client.users.getMedia(12);

// ユーザーのいいね・スター・フォロワー・フォロー中一覧
const { posts: likedPosts } = await client.users.getLikes(12);
const { posts: starredPosts } = await client.users.getStars(12);
const { followers } = await client.users.getFollowers(12);
const { following } = await client.users.getFollowing(12);

// アイコン画像 URL の取得
const iconUrl = client.users.getIconUrl(12);

// フォロー / フォロー解除（トグル）
await client.users.follow(12);
await client.users.unfollow(12);

// プロフィール更新
await client.users.updateProfile({
  name: '新しいBot名',
  me: 'Botの自己紹介文です',
});

// ブロック / ブロック解除
await client.users.block(99);
await client.users.unblock(99);

// ログイン履歴ログ
const { logs } = await client.users.getLogs({ limit: 20 });
```

---

### 3. ダイレクトメッセージ (`client.dm`)

グループ DM の作成・取得・メッセージ送受信・未読管理・鍵管理などを行います。

```js
// DM グループ一覧を取得
const { dm, unread_total } = await client.dm.list();

// DM 全体・グループごとの未読件数
const { unread_count } = await client.dm.getUnreadCount();
const unreadSummary = await client.dm.getUnreadCounts();

// 特定ユーザーとの 1対1 DM を検索
const { dm: directDm } = await client.dm.find({ userId: 12 });

// 新しい DM グループを作成
const { dm: newDm } = await client.dm.create({
  members: [12, 34],
  title: 'プロジェクト開発グループ',
});

// DM グループの詳細（メッセージ一覧）を取得
const dmDetail = await client.dm.get('dm-group-id', { limit: 50 });

// メッセージを送信
await client.dm.send('dm-group-id', {
  content: 'こんにちは！新着情報です。',
});

// メンバーの追加・削除（ホストのみ）
await client.dm.addMember('dm-group-id', 56);
await client.dm.removeMember('dm-group-id', 56);

// DM を既読にする
await client.dm.markAsRead('dm-group-id');

// メッセージリクエストの承認・拒否
await client.dm.accept('dm-group-id');
await client.dm.decline('dm-group-id');

// グループから退出・グループ解散
await client.dm.leave('dm-group-id');
await client.dm.delete('dm-group-id'); // ホストのみ

// E2E 暗号化公開鍵の取得と登録
const { keys } = await client.dm.getKeys([12, 34]);
await client.dm.setKeys('my_public_key_string');
```

---

### 4. 通知 (`client.notifications`)

新着通知の一覧取得、未読カウント、既読処理、クリック処理、通知作成、通知削除を行います。

```js
// 通知一覧を取得
const { notifications, notification_unread_count } = await client.notifications.list({ limit: 50 });

// 未読件数のみ取得
const { unread_count } = await client.notifications.getUnreadCount();

// 通知を送信する（mention, repost, dm_invite など）
await client.notifications.create({
  recipientId: 12,
  type: 'mention',
  target: { kind: 'post', id: 123 },
});

// 既読化・クリック済みにする
await client.notifications.markAsRead(1001);
await client.notifications.markAsClicked(1001);

// すべて既読化 / すべてクリック済みにする
await client.notifications.markAllAsRead();
await client.notifications.markAllAsClicked();

// 通知を削除
await client.notifications.delete(1001);
```

---

### 5. グループ (`client.groups`)

Nyaitter のグループコミュニティの作成、検索、参加、ロール・権限管理、招待、参加申請、グループ投稿取得を行います。

```js
// 公開グループを検索・一覧取得
const { groups } = await client.groups.list({ query: 'プログラミング', limit: 20 });

// 自分が所属しているグループ一覧
const { groups: myGroups } = await client.groups.listMine();

// 新しいグループを作成
const { group } = await client.groups.create({
  name: 'Nyaitter開発部',
  description: 'NyaitterのBotやWebアプリを作るコミュニティです',
  visibility: 'open', // 'open' | 'open_invite' | 'approval' | 'closed'
});

// グループ詳細の取得・設定更新
const { group: detail } = await client.groups.get('group-id');
await client.groups.update('group-id', { description: '更新された説明文' });

// グループアイコン画像 URL の取得
const groupIconUrl = client.groups.getIconUrl(detail);

// グループに参加 / 退出
await client.groups.join('group-id');
await client.groups.leave('group-id');

// ユーザーをグループに招待 / 自分宛ての招待一覧確認・応答
await client.groups.invite('group-id', 12);
const { invites } = await client.groups.getInvitesMine();
await client.groups.respondInvite('invite-id', 'accept'); // 'accept' | 'decline'

// 参加申請の確認と承認（管理者のみ）
const { requests } = await client.groups.getJoinRequests('group-id');
await client.groups.respondJoinRequest('group-id', 'request-id', 'accept');

// ロール（役職・権限）管理
const { roles } = await client.groups.getRoles('group-id');
const { role } = await client.groups.createRole('group-id', {
  name: 'モデレーター',
  permissions: ['post', 'invite', 'manage_posts'],
});
await client.groups.updateMember('group-id', 12, role.id); // ロール付与

// メンバー一覧取得・BAN / BAN解除
const { members } = await client.groups.getMembers('group-id', { status: 'active' });
await client.groups.banMember('group-id', 99);
await client.groups.unbanMember('group-id', 99);

// グループ内タイムラインの取得
const { posts: groupPosts } = await client.groups.getPosts('group-id', { limit: 30 });
```

---

### 6. アップロード / ストレージ (`client.uploads`)

画像ファイルのアップロード（Base64, Buffer, Uint8Array, Blob 対応）、ストレージ容量確認、ファイル削除を行います。

```js
import fs from 'node:fs';

// 1. ファイルをアップロード（Buffer / Uint8Array / Base64 / Blob 対応）
const imageBuffer = fs.readFileSync('./photo.png');
const uploadRes = await client.uploads.upload({
  file: imageBuffer,
  fileName: 'photo.png',
  contentType: 'image/png',
});

console.log('アップロード完了 URL:', uploadRes.url);
console.log('添付ファイル ID:', uploadRes.id);

// 2. 投稿に添付する
await client.posts.create({
  content: '画像を添付しました！',
  attachments: [{ id: uploadRes.id }],
});

// 3. ストレージ容量とファイル一覧を確認
const storage = await client.uploads.getStorage();
console.log(`ストレージ使用量: ${storage.used_percent.toFixed(1)}% (${storage.used_bytes} / ${storage.limit_bytes} bytes)`);

// 4. ファイルを削除
await client.uploads.delete([uploadRes.id]);
```

---

### 7. ランキング (`client.ranking`)

フォロワー数・投稿数・いいね数・スター数のユーザーランキングを取得します。

```js
// 自分の順位を取得
const myRanks = await client.ranking.getMe();
console.log(`フォロワー順位: ${myRanks.followers.rank} 位 (${myRanks.followers.follower_count} 人)`);

// フォロワー数ランキング上位
const { data: topFollowers } = await client.ranking.getFollowers({ limit: 10 });
topFollowers.forEach((entry) => console.log(`${entry.rank}位: ${entry.name} (@${entry.scid || entry.id})`));

// いいね数・投稿数・スター数のランキング
const { data: topLikes } = await client.ranking.getLikes({ limit: 10 });
const { data: topPosts } = await client.ranking.getPosts({ limit: 10 });
const { data: topStars } = await client.ranking.getStars({ limit: 10 });
```

---

### 8. 通報・報告 (`client.reports`)

不適切な投稿やユーザーの通報を行います。

```js
// 投稿を通報
await client.reports.create({
  targetKind: 'post',
  targetId: 123,
  description: 'スパム投稿です。',
});

// ユーザーを通報
await client.reports.create({
  targetKind: 'user',
  targetId: 99,
  description: 'なりすましアカウントです。',
});
```

---

### 9. 認証バッジ申請 (`client.verification`)

アカウントの公式認証バッジマークの申請と審査ステータス確認を行います。

```js
// 審査状況を確認
const { application } = await client.verification.getStatus();
if (application) {
  console.log(`申請状態: ${application.status}`);
}

// 認証バッジを申請
await client.verification.apply();
```

---

### 10. システム / ユーティリティ (`client.system`)

サーバー状態、コミュニティルール、URL カード展開、oEmbed 埋め込みデータ、未読サマリーを取得します。

```js
// サーバー稼働状態・制限設定を取得
const status = await client.system.getStatus();
console.log('サーバー状態:', status.server, status.database);

// コミュニティルール・規約を取得
const { rules } = await client.system.getRules();

// URL カード（OGP）を展開
const { card } = await client.system.getUrlCard('https://example.com');
console.log('カードタイトル:', card.title);

// oEmbed 埋め込みデータを取得
const oembed = await client.system.getOembed('https://nyaitter.example.com/posts/123');

// ナビゲーション未読サマリー
const summary = await client.system.getUiSummary();
console.log(`未読通知: ${summary.notification_unread_count} 件, 未読DM: ${summary.dm_unread_count} 件`);
```

---

### 11. リアルタイム WebSocket イベント受信 (`client.realtime()`)

WebSocket 接続を通じて、新着通知、DM メッセージ、タイムライン投稿、未読数の変化などをリアルタイムに受信します。

```js
import WebSocket from 'ws'; // Node.js 環境の場合
import { NyaitterClient } from 'nyaitter.js';

const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'bot_xxxxxxxxxxxxxxxx',
  WebSocket, // Node.js 環境では ws 等のクラスを渡します（ブラウザでは省略可）
});

const realtime = client.realtime({
  autoReconnect: true,     // 切断時に自動再接続
  reconnectDelayMs: 3000,  // 再接続待機時間
});

// 新着通知イベント
realtime.on('notification', (notification) => {
  console.log('新着通知を受信:', notification.type, notification);
});

// 通知未読数の変化
realtime.on('notificationUnreadCount', (count) => {
  console.log(`通知未読数: ${count} 件`);
});

// DM 新着メッセージ
realtime.on('dm', ({ dmId, message, sender }) => {
  console.log(`[DM ${dmId}] ${sender?.name || message.userid}: ${message.content}`);

  // 自動返信 Bot の例
  if (message.content === '!ping') {
    client.dm.send(dmId, { content: 'pong! 🏓' });
  }
});

// DM 未読数の変化
realtime.on('dmUnreadCount', (count) => {
  console.log(`DM 未読数: ${count} 件`);
});

// フォロー中タイムラインへの新規投稿
realtime.on('timelinePost', ({ postId, authorId }) => {
  console.log(`ユーザー ${authorId} が投稿しました (ID: ${postId})`);
});

// 接続完了イベント
realtime.on('open', () => {
  console.log('WebSocket リアルタイム接続が確立しました。');
});

// 切断イベント
realtime.on('close', () => {
  console.log('WebSocket が切断されました。');
});

// 接続を開始
await realtime.connect();

// 切断する場合:
// realtime.disconnect();
```

---

### 12. 他のユーザーとの連携（NyaitterAuth）

自分の Web サービスやアプリに他の Nyaitter ユーザーをログイン・連携させたい場合は `client.nyaitterAuth` を使用します。

```js
// 1. 認証 URL を生成
const { auth_url } = await client.nyaitterAuth.initiate({
  appId: 'my_app',
  redirectUri: 'https://example.com/callback',
  scopes: ['profile:read', 'posts:write', 'continuous_access'],
  name: '私のWebサービス',
});

// 2. ユーザーを auth_url へリダイレクト
// window.location.href = auth_url;

// 3. コールバックで渡された code をアクセストークンと交換
const { user, access_token } = await client.nyaitterAuth.exchangeToken({
  appId: 'my_app',
  code: callbackCode,
});

// 4. 発行されたアクセストークンで別クライアントを作成し、ユーザーとして操作
const userClient = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: access_token,
});

await userClient.posts.create({ content: 'ユーザーとして連携投稿！' });
```

---

## エラーハンドリング

API リクエストが失敗した場合、`NyaitterError` 例外がスローされます。

```js
import { NyaitterClient, NyaitterError } from 'nyaitter.js';

try {
  await client.posts.create({ content: '' });
} catch (error) {
  if (error instanceof NyaitterError) {
    console.error(`API エラー [HTTP ${error.status}]: ${error.message}`);
    console.error('詳細レスポンス:', error.data);
  } else {
    console.error('通信エラー:', error);
  }
}
```

---

## ライセンス

MIT License
