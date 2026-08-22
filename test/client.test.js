import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NyaitterClient,
  NyaitterError,
  RealtimeClient,
  PostsAPI,
  UsersAPI,
  DmAPI,
  NotificationsAPI,
  GroupsAPI,
  UploadsAPI,
  RankingAPI,
  ReportsAPI,
  VerificationAPI,
  SystemAPI,
  NyaitterAuthAPI,
} from '../src/index.js';

function createMockClient(handler) {
  const customFetch = async (url, options = {}) => {
    return handler(url, options);
  };
  return new NyaitterClient({
    baseUrl: 'https://nyaitter.example.com',
    token: 'bot_test_token_123',
    fetch: customFetch,
  });
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

test('NyaitterClient initializes with all sub-APIs', () => {
  const client = new NyaitterClient({
    baseUrl: 'https://nyaitter.example.com',
    token: 'bot_123',
  });

  assert.equal(client.getToken(), 'bot_123');
  assert.ok(client.posts instanceof PostsAPI);
  assert.ok(client.users instanceof UsersAPI);
  assert.ok(client.dm instanceof DmAPI);
  assert.ok(client.notifications instanceof NotificationsAPI);
  assert.ok(client.groups instanceof GroupsAPI);
  assert.ok(client.uploads instanceof UploadsAPI);
  assert.ok(client.ranking instanceof RankingAPI);
  assert.ok(client.reports instanceof ReportsAPI);
  assert.ok(client.verification instanceof VerificationAPI);
  assert.ok(client.system instanceof SystemAPI);
  assert.ok(client.nyaitterAuth instanceof NyaitterAuthAPI);

  client.setToken('bot_456');
  assert.equal(client.getToken(), 'bot_456');
});

test('NyaitterError is thrown on non-200 responses', async () => {
  const client = createMockClient(() => jsonResponse({ error: 'Post not found' }, 404));

  await assert.rejects(
    async () => {
      await client.posts.get(999);
    },
    (err) => {
      assert.ok(err instanceof NyaitterError);
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Post not found');
      assert.deepEqual(err.data, { error: 'Post not found' });
      return true;
    },
  );
});

test('PostsAPI sends correct endpoints and parameters', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ success: true });
  });

  // create
  await client.posts.create({
    content: 'テスト投稿',
    replyToId: 10,
    quoteId: 20,
    mask: true,
    lock: true,
    groupId: 'group-1',
  });
  assert.equal(recorded.options.method, 'POST');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts');
  const createBody = JSON.parse(recorded.options.body);
  assert.equal(createBody.content, 'テスト投稿');
  assert.equal(createBody.reply_to, 10);
  assert.equal(createBody.repost_to, 20);
  assert.equal(createBody.mask, true);
  assert.equal(createBody.lock, true);
  assert.equal(createBody.group_id, 'group-1');
  assert.equal(recorded.options.headers.Authorization, 'Bearer bot_test_token_123');

  // getTimeline
  await client.posts.getTimeline({ tab: 'following', limit: 15 });
  assert.equal(recorded.options.method, 'GET');
  assert.ok(recorded.url.includes('/server/api/posts/page'));
  assert.ok(recorded.url.includes('mode=timeline'));
  assert.ok(recorded.url.includes('tab=following'));
  assert.ok(recorded.url.includes('limit=15'));

  // getTrending
  await client.posts.getTrending({ limit: 5 });
  assert.ok(recorded.url.includes('/server/api/posts/trending'));
  assert.ok(recorded.url.includes('limit=5'));

  // getTrendingHashtags
  await client.posts.getTrendingHashtags({ limit: 8 });
  assert.ok(recorded.url.includes('/server/api/posts/trending-hashtags'));
  assert.ok(recorded.url.includes('limit=8'));

  // search
  await client.posts.search({ query: 'ねこ', limit: 25 });
  assert.ok(recorded.url.includes('/server/api/posts/search'));
  assert.ok(recorded.url.includes('q=%E3%81%AD%E3%81%93'));

  // get
  await client.posts.get(123);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123');

  // getThread
  await client.posts.getThread(123, { limit: 10 });
  assert.ok(recorded.url.includes('/server/api/posts/123/thread'));
  assert.ok(recorded.url.includes('limit=10'));

  // update / edit
  await client.posts.update(123, { content: '更新テキスト', mask: false });
  assert.equal(recorded.options.method, 'PUT');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    content: '更新テキスト',
    mask: false,
  });

  // delete
  await client.posts.delete(123);
  assert.equal(recorded.options.method, 'DELETE');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123');

  // like, star, repost, pin
  await client.posts.like(123);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123/like');
  await client.posts.star(123);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123/star');
  await client.posts.repost(123);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123/repost');
  await client.posts.pin(123);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/123/pin');

  // hydrate & metrics
  await client.posts.hydrate([1, 2, 3]);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/hydrate');
  assert.deepEqual(JSON.parse(recorded.options.body), { post_ids: [1, 2, 3] });

  await client.posts.getMetrics([1, 2, 3]);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/posts/metrics');
  assert.deepEqual(JSON.parse(recorded.options.body), { post_ids: [1, 2, 3] });
});

test('UsersAPI sends correct endpoints and parameters', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({
      user: { id: 12, name: 'nyanko', scid: 'nyanko', block: [] },
      users: [{ id: 12, name: 'nyanko', scid: 'nyanko' }],
    });
  });

  // get & getMe
  await client.users.get(12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/12');

  await client.users.getMe();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/auth/me');

  // getByHandle
  const handleRes = await client.users.getByHandle('nyanko');
  assert.equal(handleRes.user.id, 12);

  // search & getRecommended & getBatch
  await client.users.search({ query: 'nyan', limit: 10 });
  assert.ok(recorded.url.includes('/server/api/users/search'));
  assert.ok(recorded.url.includes('q=nyan'));

  await client.users.getRecommended({ limit: 5 });
  assert.ok(recorded.url.includes('/server/api/users/recommended'));

  await client.users.getBatch([1, 2, 3]);
  assert.ok(recorded.url.includes('/server/api/users?ids=1%2C2%2C3'));

  // counts, media, isLocked, pin
  await client.users.getCounts(12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/12/counts');

  await client.users.getMedia(12);
  assert.ok(recorded.url.includes('/server/api/users/12/media'));

  await client.users.isLocked(12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/12/is-lock');

  await client.users.getPinnedPost(12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/12/pin');

  // getPosts, getLikes, getStars, getFollowers, getFollowing
  await client.users.getPosts(12, { mode: 'posts' });
  assert.ok(recorded.url.includes('/server/api/users/12/posts'));
  assert.ok(recorded.url.includes('mode=posts'));

  await client.users.getLikes(12);
  assert.ok(recorded.url.includes('/server/api/users/12/likes'));

  await client.users.getStars(12);
  assert.ok(recorded.url.includes('/server/api/users/12/stars'));

  await client.users.getFollowers(12);
  assert.ok(recorded.url.includes('/server/api/users/12/followers'));

  await client.users.getFollowing(12);
  assert.ok(recorded.url.includes('/server/api/users/12/following'));

  // icon url
  assert.equal(client.users.getIconUrl(12), 'https://nyaitter.example.com/server/api/users/12/icon');

  // follow / unfollow
  await client.users.follow(12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/12/follow');

  // updateProfile
  await client.users.updateProfile({ name: '新名', bio: '自己紹介' });
  assert.equal(recorded.options.method, 'PUT');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/users/me');
  assert.equal(JSON.parse(recorded.options.body).name, '新名');

  // block / unblock
  await client.users.block(99);
  assert.equal(recorded.options.method, 'PUT');

  // getLogs
  await client.users.getLogs({ limit: 10 });
  assert.ok(recorded.url.includes('/server/api/users/logs'));
});

test('DmAPI sends correct endpoints and parameters', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ dm: [{ id: 'dm-1', member: [1, 2] }], unread_count: 0 });
  });

  // list & unread
  await client.dm.list();
  assert.ok(recorded.url.includes('/server/api/dm'));

  await client.dm.getUnreadCount();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/unread');

  await client.dm.getUnreadCounts();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/unread-counts');

  // find
  await client.dm.find({ userId: 12 });
  assert.ok(recorded.url.includes('/server/api/dm/find?user_id=12'));

  // get & create & send
  await client.dm.get('dm-1');
  assert.ok(recorded.url.includes('/server/api/dm/dm-1'));

  await client.dm.create({ members: [12, 34], title: 'DMグループ' });
  assert.equal(recorded.options.method, 'POST');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm');
  assert.deepEqual(JSON.parse(recorded.options.body), { member: [12, 34], title: 'DMグループ' });

  await client.dm.send('dm-1', { content: 'ハロー' });
  assert.equal(recorded.options.method, 'POST');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/dm-1/messages');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    message: { content: 'ハロー' },
  });

  // accept, decline, leave, markAsRead
  await client.dm.accept('dm-1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/dm-1/accept');

  await client.dm.decline('dm-1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/dm-1/decline');

  await client.dm.leave('dm-1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/dm-1/leave');

  await client.dm.markAsRead('dm-1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/dm-1/read');

  // keys
  await client.dm.getKeys([1, 2]);
  assert.ok(recorded.url.includes('/server/api/dm/keys?user_ids=1%2C2'));

  await client.dm.setKeys('pubkey_123');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/dm/keys');
  assert.deepEqual(JSON.parse(recorded.options.body), { public_key: 'pubkey_123' });
});

test('NotificationsAPI sends correct endpoints and parameters', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ success: true, notification_unread_count: 0 });
  });

  await client.notifications.list({ limit: 10 });
  assert.ok(recorded.url.includes('/server/api/notifications'));
  assert.ok(recorded.url.includes('limit=10'));

  await client.notifications.getUnreadCount();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/unread');

  await client.notifications.create({
    recipientId: 12,
    type: 'mention',
    target: { kind: 'post', id: 100 },
  });
  assert.equal(recorded.options.method, 'POST');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    recipient_id: 12,
    type: 'mention',
    target: { kind: 'post', id: 100 },
  });

  await client.notifications.markAsRead(55);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/55/read');

  await client.notifications.markAsClicked(55);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/55/clicked');

  await client.notifications.markAllAsRead();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/read-all');

  await client.notifications.markAllAsClicked();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/click-all');

  await client.notifications.delete(55);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/notifications/55');
});

test('GroupsAPI sends correct endpoints and parameters', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ groups: [], group: { id: 'g1' }, success: true });
  });

  await client.groups.list({ query: 'test' });
  assert.ok(recorded.url.includes('/server/api/groups?q=test'));

  await client.groups.create({ name: '新規グループ', visibility: 'open' });
  assert.equal(recorded.options.method, 'POST');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups');

  await client.groups.listMine();
  assert.ok(recorded.url.includes('/server/api/groups/mine'));

  await client.groups.getInvitesMine();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/invites/mine');

  await client.groups.respondInvite('inv-1', 'accept');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/invites/inv-1/respond');

  await client.groups.get('g1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1');

  await client.groups.update('g1', { name: '更新グループ名' });
  assert.equal(recorded.options.method, 'PATCH');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1');

  await client.groups.transferOwner('g1', 99);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/transfer-owner');

  await client.groups.delete('g1');
  assert.equal(recorded.options.method, 'DELETE');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1');

  await client.groups.join('g1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/join');

  await client.groups.leave('g1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/leave');

  await client.groups.invite('g1', 50);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/invites');

  await client.groups.getJoinRequests('g1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/join-requests');

  await client.groups.respondJoinRequest('g1', 'req-1', 'accept');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/join-requests/req-1/respond');

  await client.groups.getRoles('g1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/roles');

  await client.groups.createRole('g1', { name: 'モデレーター', permissions: ['post', 'invite'] });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/roles');

  await client.groups.updateRole('g1', 'r1', { name: '副管理者' });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/roles/r1');

  await client.groups.deleteRole('g1', 'r1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/roles/r1');

  await client.groups.getMembers('g1', { status: 'active' });
  assert.ok(recorded.url.includes('/server/api/groups/g1/members'));

  await client.groups.updateMember('g1', 12, 'r1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/members/12');

  await client.groups.banMember('g1', 12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/members/12/ban');

  await client.groups.unbanMember('g1', 12);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/groups/g1/members/12/unban');

  await client.groups.getPosts('g1', { limit: 20 });
  assert.ok(recorded.url.includes('/server/api/groups/g1/posts'));
});

test('UploadsAPI handles Base64 and Buffer uploads', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ id: 'attachments/12/photo.png', url: '/uploads/photo.png' });
  });

  // Base64
  await client.uploads.upload({
    file: 'aGVsbG8=',
    fileName: 'test.png',
    contentType: 'image/png',
  });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/uploads');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    file: 'aGVsbG8=',
    fileName: 'test.png',
    contentType: 'image/png',
  });

  // Buffer / Uint8Array
  const buf = Buffer.from('hello world');
  await client.uploads.upload({
    file: buf,
    fileName: 'buf.txt',
    contentType: 'text/plain',
  });
  assert.equal(JSON.parse(recorded.options.body).file, buf.toString('base64'));

  // getStorage
  await client.uploads.getStorage();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/uploads/storage');

  // delete
  await client.uploads.delete(['attachments/12/test.png']);
  assert.equal(recorded.options.method, 'DELETE');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    fileIds: ['attachments/12/test.png'],
  });

  // getPreviewUrl
  assert.equal(
    client.uploads.getPreviewUrl('attachments/12/test.png'),
    'https://nyaitter.example.com/server/api/uploads/preview?file_id=attachments%2F12%2Ftest.png',
  );
});

test('Ranking, Reports, Verification, and System APIs work properly', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ success: true, data: [] });
  });

  // Ranking
  await client.ranking.getMe();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/ranking/me');

  await client.ranking.get('followers', { limit: 10 });
  assert.ok(recorded.url.includes('/server/api/ranking/followers?limit=10'));

  // Reports
  await client.reports.create({ targetKind: 'post', targetId: 100, description: 'スパム' });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/reports');
  assert.deepEqual(JSON.parse(recorded.options.body), {
    target_kind: 'post',
    target_id: 100,
    description: 'スパム',
  });

  // Verification
  await client.verification.getStatus();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/verification-applications/me');

  await client.verification.apply();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/verification-applications');

  // System
  await client.system.getStatus();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/status');

  await client.system.getRules();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/rules');

  await client.system.getUrlCard('https://example.com');
  assert.ok(recorded.url.includes('/server/api/url-cards?url=https%3A%2F%2Fexample.com'));

  await client.system.getOembed('https://example.com/posts/123');
  assert.ok(recorded.url.includes('/server/api/oembed?url=https%3A%2F%2Fexample.com%2Fposts%2F123'));

  await client.system.getUiSummary();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/ui/summary');
});

test('NyaitterAuthAPI works properly', async () => {
  let recorded = null;
  const client = createMockClient((url, options) => {
    recorded = { url, options };
    return jsonResponse({ success: true });
  });

  await client.nyaitterAuth.initiate({
    appId: 'app_1',
    redirectUri: 'https://app.example.com/cb',
    scopes: ['profile:read', 'posts:write'],
  });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/initiate');

  await client.nyaitterAuth.exchangeToken({ appId: 'app_1', code: 'auth_code_123' });
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/token');

  await client.nyaitterAuth.getUserInfo();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/userinfo');

  await client.nyaitterAuth.getAuthorizedApps();
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/authorized-apps');

  await client.nyaitterAuth.updateAuthorizedApp('app_auth_1', ['profile:read']);
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/authorized-apps/app_auth_1');

  await client.nyaitterAuth.revokeAuthorizedApp('app_auth_1');
  assert.equal(recorded.url, 'https://nyaitter.example.com/server/api/nyaitter-auth/authorized-apps/app_auth_1');
});

test('RealtimeClient registers and emits events', async () => {
  class MockWebSocket {
    static OPEN = 1;
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.readyState = 1;
      this.listeners = {};
      setTimeout(() => this.emit('open'), 5);
    }
    addEventListener(event, fn) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(fn);
    }
    emit(event, data) {
      for (const fn of this.listeners[event] || []) {
        fn(data);
      }
    }
    send() {}
    close() {
      this.readyState = 3;
      this.emit('close');
    }
  }

  const client = new NyaitterClient({
    baseUrl: 'https://nyaitter.example.com',
    token: 'bot_test',
    WebSocket: MockWebSocket,
  });

  const realtime = client.realtime({ autoReconnect: false });
  const received = [];

  realtime.on('notification', (n) => received.push({ type: 'notification', n }));
  realtime.on('dm', (d) => received.push({ type: 'dm', d }));
  realtime.on('timelinePost', (t) => received.push({ type: 'timelinePost', t }));

  await realtime.connect();
  assert.equal(realtime.connected, true);

  // Simulate server sending notification message
  realtime._handleMessage(JSON.stringify({
    type: 'notification_new',
    notification: { id: 10, type: 'like' },
    unread_count: 3,
  }));

  // Simulate server sending DM message
  realtime._handleMessage(JSON.stringify({
    type: 'dm_message',
    dm_id: 'dm-123',
    message: { content: 'こんにちは' },
  }));

  // Simulate server sending timeline post
  realtime._handleMessage(JSON.stringify({
    type: 'timeline_post',
    post_id: 50,
    author_id: 1,
  }));

  assert.equal(received.length, 3);
  assert.equal(received[0].type, 'notification');
  assert.equal(received[0].n.id, 10);
  assert.equal(received[1].type, 'dm');
  assert.equal(received[1].d.dmId, 'dm-123');
  assert.equal(received[2].type, 'timelinePost');
  assert.equal(received[2].t.postId, 50);

  realtime.disconnect();
});
