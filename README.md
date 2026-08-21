# Nyaitter.js

**Nyaitter.js** は、[Nyaitter](https://github.com/Nyaitter/Server) の API を JavaScript から手軽に使えるライブラリです。  
投稿の取得・作成・いいね、ユーザーのフォロー、DM の送受信、通知の管理など、Nyaitter のさまざまな機能をシンプルなコードで呼び出せます。

```js
import { NyaitterClient } from 'nyaitter.js';

const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'nyauth_...', // NyaitterAuth で取得したトークン
});

await client.posts.create({ content: 'はじめての投稿！' });
```

---

## 必要なもの

- **Node.js 18 以上**（または `fetch` が使えるブラウザ・環境）
- **Nyaitter サーバーの URL**（接続先のサーバー URL）
- **アクセストークン**（後述の NyaitterAuth で取得します）

---

## インストール

```bash
npm install nyaitter.js
```

---

## アクセストークンの取得（NyaitterAuth）

API を使うには、**NyaitterAuth** でユーザーにアプリの利用を許可してもらい、アクセストークンを取得する必要があります。

### 連携の流れ

```js
// ステップ 1: 認証ページの URL を生成する
const { auth_url } = await client.nyaitterAuth.initiate({
  appId: 'my_app',          // Nyaitter サーバーに登録したアプリ ID
  apiToken: 'secret_token', // 同じく登録したシークレット
  redirectUri: 'https://example.com/callback', // 許可後にリダイレクトされる URL
  scopes: ['profile:read', 'posts:write', 'continuous_access'],
  name: '私のアプリ',        // 認証画面に表示されるアプリ名
});

// ステップ 2: ユーザーを auth_url に案内する
window.location.href = auth_url;

// ステップ 3: ユーザーが「許可」を押すと redirectUri に ?code=... が届く
const code = new URLSearchParams(window.location.search).get('code');

// ステップ 4: code をアクセストークンと交換する
//   ※ トークンは exchangeToken() 後に client へ自動保存されます
const { user } = await client.nyaitterAuth.exchangeToken({
  appId: 'my_app',
  apiToken: 'secret_token',
  code,
});

// ステップ 5: 以降はそのまま API を呼び出せる
const { posts } = await client.posts.getTimeline();
```

取得したトークン（`nyauth_...`）は次回以降、コンストラクタに渡すだけで使えます。

```js
const client = new NyaitterClient({
  baseUrl: 'https://nyaitter.example.com',
  token: 'nyauth_0123456789abcdef...', // 保存しておいたトークン
});
```

### 使えるスコープ（権限）一覧

| スコープ | 内容 |
|---|---|
| `profile:read` | ユーザー名・アイコンなどの基本情報を見る（必須） |
| `posts:read` | タイムラインや投稿を見る |
| `posts:write` | 投稿・いいね・リポストを行う |
| `dm:read` | DM を読む |
| `dm:write` | DM を送る |
| `notifications:read` | 通知を確認する |
| `continuous_access` | バックグラウンドでも続けて API を使えるトークンを発行する |

---

## 主な機能

### 投稿 (`client.posts`)

```js
// タイムラインを取得（おすすめ）
const { posts } = await client.posts.getTimeline();

// フォロー中のタイムラインを取得
const { posts } = await client.posts.getTimeline({ tab: 'following' });

// 投稿を検索
const { posts } = await client.posts.search({ query: 'ねこ' });

// 投稿を作成
const { post } = await client.posts.create({ content: 'はじめての投稿！' });

// 返信
const { post } = await client.posts.create({ content: '返信です', replyToId: 123 });

// いいね / 取り消し
await client.posts.like(123);
await client.posts.unlike(123);

// リポスト / 取り消し
await client.posts.repost(123);
await client.posts.unrepost(123);

// 投稿を削除
await client.posts.delete(123);
```

### ユーザー (`client.users`)

```js
// プロフィールを取得
const { user } = await client.users.get(12);

// ハンドル（ユーザー名）で取得
const { user } = await client.users.getByHandle('nyanko');

// フォロー / 解除
await client.users.follow(12);
await client.users.unfollow(12);

// プロフィールを更新
await client.users.updateProfile({ name: '新しい名前', me: '自己紹介です' });
```

### DM (`client.dm`)

```js
// DM 一覧を取得
const { dm, unread_total } = await client.dm.list();

// メッセージを送信
await client.dm.send('dm-group-id', { content: 'こんにちは！' });

// 新しい DM グループを作成
const { dm } = await client.dm.create({ members: [12, 34] });
```

### 通知 (`client.notifications`)

```js
// 通知一覧を取得
const { notifications, notification_unread_count } = await client.notifications.list();

// 未読件数だけ取得
const { unread_count } = await client.notifications.getUnreadCount();

// すべて既読にする
await client.notifications.markAllAsRead();
```

---

## エラーの処理

API の呼び出しに失敗すると `NyaitterError` が投げられます。

```js
import { NyaitterClient, NyaitterError } from 'nyaitter.js';

try {
  await client.posts.create({ content: '' });
} catch (error) {
  if (error instanceof NyaitterError) {
    console.error(`エラー (${error.status}): ${error.message}`);
  }
}
```

| プロパティ | 内容 |
|---|---|
| `error.message` | エラーメッセージ |
| `error.status` | HTTP ステータスコード（403, 404 など） |
| `error.data` | サーバーからの詳細データ |

---

## ライセンス

MIT
