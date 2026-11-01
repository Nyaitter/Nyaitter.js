import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient } from '../src/NyaitterClient.js';

function mockClient() {
  const calls = [];
  const fetch = async (input, init = {}) => {
    const url = new URL(input);
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { client: new NyaitterClient({ baseUrl: 'http://127.0.0.1:0/server', fetch }), calls };
}

test('current Auth, users, reports and account-deletion helpers use Server paths and payload names', async () => {
  const { client, calls } = mockClient();
  await client.auth.initiateProvider('scratch', { username: 'cat' });
  await client.auth.verifyProvider('scratch', { username: 'cat', code: '123' });
  await client.auth.logout();
  await client.users.getPosts(7, { mode: 'replies' });
  await client.users.prepareAccountDeletion();
  await client.users.deleteAccount('confirm');
  await client.reports.create({ targetKind: 'post', targetId: 9, description: 'spam' });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ['POST', '/server/auth/scratch/initiate', { username: 'cat' }],
    ['POST', '/server/auth/scratch/verify', { username: 'cat', code: '123' }],
    ['POST', '/server/auth/logout', {}],
    ['GET', '/server/users/7/posts', undefined],
    ['POST', '/server/users/me/account/delete/prepare', {}],
    ['DELETE', '/server/users/me/account', { confirmation_token: 'confirm' }],
    ['POST', '/server/reports', { target_kind: 'post', target_id: 9, description: 'spam' }],
  ]);
});

test('recommended endpoint does not send ignored pagination; removed legacy APIs are absent', async () => {
  const { client, calls } = mockClient();
  await client.users.getRecommended({ limit: 1, offset: 99 });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ['GET', '/server/users/recommended', {}],
  ]);
  // 0.2.0 で旧互換メソッドは削除した（現行Serverに対応ルートがないため）。
  for (const method of ['login', 'register', 'checkScratch', 'linkScratch', 'linkAccount', 'setup2FA', 'verify2FA', 'disable2FA', 'startExternalAuth', 'confirmExternalAuth', 'completeExternalAuth', 'requestAccountDeletion', 'cancelAccountDeletion']) {
    assert.equal(typeof client.auth[method], 'undefined', `client.auth.${method} must not exist`);
  }
  for (const method of ['list', 'get', 'update']) {
    assert.equal(typeof client.verification[method], 'undefined', `client.verification.${method} must not exist`);
  }
  for (const method of ['getReplies', 'pinPost', 'unpinPost', 'getBlocks', 'getMutes', 'mute', 'unmute']) {
    assert.equal(typeof client.users[method], 'undefined', `client.users.${method} must not exist`);
  }
  for (const method of ['getByTag', 'getLiked', 'getStarred', 'getReactions', 'markAsRead']) {
    assert.equal(typeof client.posts[method], 'undefined', `client.posts.${method} must not exist`);
  }
});

test('profile update preserves both bio aliases and their explicitly supplied falsy values', async () => {
  const { client, calls } = mockClient();

  await client.users.updateProfile({ me: 'legacy bio', bio: 'canonical bio' });
  await client.users.updateProfile({ me: '' });
  await client.users.updateProfile({ bio: null, me: false });

  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ['PUT', '/server/users/me', { me: 'legacy bio', bio: 'canonical bio' }],
    ['PUT', '/server/users/me', { me: '' }],
    ['PUT', '/server/users/me', { me: false, bio: null }],
  ]);
});
