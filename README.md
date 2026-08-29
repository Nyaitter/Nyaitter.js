# Nyaitter.js

**Nyaitter.js** は、[Nyaitter](https://github.com/Nyaitter/Server) の API を JavaScript / TypeScript から手軽に使える公式クライアントライブラリです。  
Bot トークン、NyaitterAuth アクセストークン、またはセッショントークンを使用して、Nyaitter の機能をシンプルなコードで呼び出せます。

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

- **Node.js 18 以上**
- **Nyaitter サーバーの URL**
- **Bot トークン**

---

## インストール

```bash
npm install nyaitter.js
```

## Node.js とブラウザ CDN

Node.js では ES Modules の `import` と CommonJS の `require` の両方を使えます。

```js
import { NyaitterClient } from 'nyaitter.js';
// CommonJS: const { NyaitterClient } = require('nyaitter.js');
```

ブラウザでは CDN の script を読み込むと `Nyaitter` から同じ API を使えます。

```html
<script src="https://cdn.jsdelivr.net/npm/nyaitter.js/dist/nyaitter.js"></script>
<script>
  const client = new Nyaitter.NyaitterClient({
    baseUrl: 'https://nyaitter.example.com',
    token: 'bot_xxxxxxxxxxxxxxxx',
  });
</script>
```

CDN で ES Modules として読み込む場合は、次のように `src/index.js` を指定できます。

```html
<script type="module">
  import { NyaitterClient } from 'https://cdn.jsdelivr.net/npm/nyaitter.js/src/index.js';
</script>
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

// 投稿を検索 / ハッシュタグで取得
const { posts: searchResults } = await client.posts.search({ query: 'ねこ', limit: 20 });
const { posts: tagPosts } = await client.posts.getByTag('猫');

// 投稿の詳細・リプライ・スレッド・リアクション・引用を取得
const { post } = await client.posts.get(123);
const { replies } = await client.posts.getReplies(123);
const thread = await client.posts.getThread(123);
const { reactions } = await client.posts.getReactions(123);
const { quotes } = await client.posts.getQuotes(123);

// 新規投稿
await client.posts.create({
  content: 'はじめての投稿！',
  mask: false, // CW
  lock: false, // フォロワー限定
});

// リプライ
await client.posts.create({ content: '返信です', replyToId: 123 });

// 引用リポスト
await client.posts.create({ content: '引用コメント', quoteId: 123 });

// 投稿の編集・更新
await client.posts.update(123, { content: '編集後の本文' });

// 投稿の削除
await client.posts.delete(123);

// いいね / いいね解除
await client.posts.like(123);
await client.posts.unlike(123);

// スター/ 解除
await client.posts.star(123);
await client.posts.unstar(123);

// リポスト / 解除
await client.posts.repost(123);

// 投稿の既読送信
await client.posts.markAsRead([123, 124]);
```

---

### 2. 投票 (`client.polls`)

投稿に添付された投票の取得と投票実行を行います。

```js
// 投票データを取得
const { poll } = await client.polls.get('poll_id');

// 投票する
await client.polls.vote('poll_id', {
  optionIds: [0], // 投票する選択肢インデックス
});
```

---

### 3. ユーザー (`client.users`)

ユーザー情報の取得、検索、プロフィール更新、フォロー/解除、ブロック/解除、ミュート/解除、固定投稿管理などを行います。

```js
// 自分のアカウント情報を取得
const { user: me } = await client.users.getMe();

// ユーザー ID またはハンドルで取得
const { user } = await client.users.get(12);
const { user: byHandle } = await client.users.getByHandle('nyanko');

// ユーザーの投稿・リプライ・メディア・いいね・スター一覧
const { posts } = await client.users.getPosts(12);
const { replies } = await client.users.getReplies(12);
const { media_items } = await client.users.getMedia(12);
const { posts: likedPosts } = await client.users.getLikes(12);
const { posts: starredPosts } = await client.users.getStars(12);

// フォロワー・フォロー中一覧
const { followers } = await client.users.getFollowers(12);
const { following } = await client.users.getFollowing(12);

// フォロー / フォロー解除
await client.users.follow(12);
await client.users.unfollow(12);

// ブロック / ブロック解除
await client.users.block(12);
await client.users.unblock(12);

// ミュート / ミュート解除
await client.users.mute(12);
await client.users.unmute(12);

// 固定投稿の取得・固定・解除
const { pinned_posts } = await client.users.getPinnedPosts(12);
await client.users.pinPost(12, 123);
await client.users.unpinPost(12, 123);

// プロフィールの更新
await client.users.updateProfile({
  name: '新しい表示名',
  me: '自己紹介文です🐾',
});
```

---

### 4. ダイレクトメッセージ (`client.dm`)

DM グループの作成、一覧取得、メッセージ送受信、リアクション、既読管理などを行います。

```js
// DM グループ一覧を取得
const { dm: rooms, unread_total } = await client.dm.list();

// DM のメッセージ一覧を取得
const { dm: messages } = await client.dm.get('dm_group_id');

// 新しい DM グループを作成
const { dm: newRoom } = await client.dm.create({
  members: [12, 34],
  title: '企画チャット',
});

// メッセージを送信
await client.dm.sendMessage('dm_group_id', {
  content: 'こんにちは！',
});

// メッセージを編集・削除
await client.dm.editMessage('dm_group_id', 'msg_id', { content: '修正本文' });
await client.dm.deleteMessage('dm_group_id', 'msg_id');

// メッセージにリアクションを追加・削除
await client.dm.addReaction('dm_group_id', 'msg_id', '👍');
await client.dm.removeReaction('dm_group_id', 'msg_id', '👍');

// 既読にする
await client.dm.markAsRead('dm_group_id');

// グループから退出
await client.dm.leave('dm_group_id');
```

---

### 5. グループ (`client.groups`)

グループの作成、詳細取得、投稿一覧、メンバー管理、ロール設定、招待状管理などを行います。

```js
// 公開グループ一覧を検索
const { groups } = await client.groups.list({ query: 'ゲーム' });

// 所属グループ一覧を取得
const { groups: myGroups } = await client.groups.listMine();

// グループ詳細とグループ内投稿一覧を取得
const { group } = await client.groups.get('group_id');
const { posts } = await client.groups.getPosts('group_id');

// グループを作成
const { group: created } = await client.groups.create({
  name: 'Scratch 開発部',
  description: 'Scratch 作品を共有するグループです。',
});

// グループ内投稿
await client.groups.createPost('group_id', {
  content: 'グループへの投稿です！',
});

// グループに参加 / 脱退
await client.groups.join('group_id');
await client.groups.leave('group_id');
```

---

### 6. 通知 (`client.notifications`)

通知一覧の取得、未読件数確認、既読化、通知作成などを行います。

```js
// 通知一覧を取得
const { notifications, notification_unread_count } = await client.notifications.list();

// 未読件数を取得
const { unread_count } = await client.notifications.getUnreadCount();

// 通知を既読にする
await client.notifications.markAsRead(1);
await client.notifications.markAllAsRead();

// 通知を削除
await client.notifications.delete(1);
```

---

### 7. アップロード (`client.uploads`)

画像や添付ファイルのアップロード、ストレージ使用状況の確認、ファイル削除を行います。

```js
// 画像ファイルをアップロード
const result = await client.uploads.upload({
  file: base64Data, // または Buffer, Uint8Array, Blob
  fileName: 'photo.png',
  contentType: 'image/png',
});
console.log('画像 URL:', result.url);

// ストレージ使用状況を確認
const storage = await client.uploads.getStorage();
console.log(`使用量: ${storage.used_percent}%`);

// ファイルを削除
await client.uploads.delete(['attachments/12/photo.png']);
```

---

### 8. ランキング (`client.ranking`)

フォロワー数、投稿数、いいね数、スター数のランキングを取得します。

```js
// 自分の順位を取得
const myRank = await client.ranking.getMe();

// 各項目のランキング上位を取得
const { data: topFollowers } = await client.ranking.getFollowers({ limit: 10 });
const { data: topPosts } = await client.ranking.getPosts({ limit: 10 });
const { data: topLikes } = await client.ranking.getLikes({ limit: 10 });
const { data: topStars } = await client.ranking.getStars({ limit: 10 });
```

---

### 9. 報告・通報 (`client.reports`) & 異議申し立て (`client.appeals`)

不適切な投稿・ユーザーの通報や、凍結アカウントに対する異議申し立てを行います。

```js
// 投稿またはユーザーを通報
await client.reports.create({
  targetKind: 'post',
  targetId: 123,
  description: 'スパム投稿です。',
});

// 凍結に対する異議申し立ての確認・提出
const { appeal } = await client.appeals.getStatus();
await client.appeals.create({
  description: '凍結解除の申請です。',
});
```

---

### 10. 認証バッジ申請 (`client.verification`)

アカウントの公式認証バッジの申請および審査状況の確認を行います。

```js
// 申請状況を確認
const { application } = await client.verification.getStatus();

// 認証バッジを申請
await client.verification.apply();
```

---

### 11. インポスター (`client.imposters`)

サブアカウント・代理運用の作成、一覧取得、共同運用メンバーの追加・権限管理・削除を行います。

```js
// 利用可能なインポスター一覧
const { imposters } = await client.imposters.list();

// 新しいインポスターを作成
const { imposter } = await client.imposters.create({ name: '広報アカウント' });

// 共同運用者を追加
await client.imposters.addMember(imposter.id, { userId: 34, role: 'operator' });
```

---

### 12. Web Push 通知 (`client.push`)

Web Push の設定取得、購読登録、購読解除を行います。

```js
// VAPID 公開鍵を取得
const config = await client.push.getConfig();

// 購読情報を登録
await client.push.subscribe({ subscription: pushSubscription });
```

---

### 13. ルール・URLカード・oEmbed・UI集計 (`client.rules`, `client.urlCards`, `client.oembed`, `client.ui`, `client.system`)

```js
// 利用規約・コミュニティルールを取得
const { rules } = await client.rules.get();

// URL の OGP カード情報を取得
const { card } = await client.urlCards.get('https://example.com');

// oEmbed 埋め込みメタデータを取得
const embed = await client.oembed.get('https://nyaitter.example.com/posts/123');

// ナビゲーション用サマリー
const summary = await client.ui.getSummary();

// サーバーの稼働状態・ヘルスチェック
const status = await client.system.getStatus();
const health = await client.system.getHealth();
```

---

### 14. リアルタイム WebSocket 受信 (`client.realtime()`)

WebSocket を通じて新着投稿・DM・通知・未読カウントの変化をリアルタイムに受信します。

```js
const realtime = client.realtime({
  autoReconnect: true,     // 切断時に自動再接続
  reconnectDelayMs: 3000,  // 再接続待機時間
});

// 新着通知イベント
realtime.on('notification', (notification) => {
  console.log('新着通知を受信:', notification);
});

// DM 新着メッセージ
realtime.on('dm', ({ dmId, message, sender }) => {
  console.log(`[DM ${dmId}] ${sender?.name || message.userid}: ${message.content}`);
});

// 接続を開始
await realtime.connect();
```

---

### 15. 他のユーザーとの連携

自分の Web サービスやアプリに他の Nyaitter ユーザーをログイン・連携させます。

```js
// 1. 認証 URL を生成
const { auth_url } = await client.nyaitterAuth.initiate({
  appId: 'my_app',
  redirectUri: 'https://example.com/callback',
  scopes: ['profile:read', 'posts:write', 'continuous_access'],
  name: '私のWebサービス',
});

// 2. コールバックで渡された code をアクセストークンと交換
const { user, access_token } = await client.nyaitterAuth.exchangeToken({
  appId: 'my_app',
  code: callbackCode,
});

// 3. 発行されたアクセストークンで別クライアントを作成し、連携ユーザーとして操作
const userClient = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: access_token,
});
await userClient.posts.create({ content: '連携アカウントから投稿！' });
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
