import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient } from '../src/NyaitterClient.js';

function makeClient() {
  const requests = [];
  const client = new NyaitterClient({
    baseUrl: 'https://example.invalid/api',
    fetch: async (url, options) => {
      requests.push({ url: new URL(url), options });
      const body = options.body ? JSON.parse(options.body) : null;
      const status = options.method === 'PUT' ? 202 : 200;
      const payload = options.method === 'PUT'
        ? { success: true, queued: true, action_id: 'test-action' }
        : { success: true, body };
      return new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  return { client, requests };
}

test('group routes use server decision values and supported pagination', async () => {
  const { client, requests } = makeClient();

  await client.groups.respondJoinRequest('group-id', 'request-id', 'approve');
  await client.groups.list({ query: 'cats', limit: 7, offset: 3 });
  await client.groups.getMembers('group-id', { status: 'active', limit: 5, offset: 2 });
  await client.groups.listMine();

  assert.deepEqual(requests[0].options && JSON.parse(requests[0].options.body), { decision: 'approve' });
  assert.equal(requests[0].url.pathname, '/api/groups/group-id/join-requests/request-id/respond');
  assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), { query: 'cats', limit: '7', offset: '3' });
  assert.deepEqual(Object.fromEntries(requests[2].url.searchParams), { status: 'active', offset: '2' });
  assert.equal(requests[3].url.searchParams.get('limit'), '50');
  assert.equal(requests[3].url.searchParams.has('post_as_user_id'), false);
});

test('post update declares and passes through the queued 202 response; quote offset is not sent', async () => {
  const { client, requests } = makeClient();
  const response = await client.posts.update(42, { content: 'edited' });
  await client.posts.getQuotes(42, { limit: 12, offset: 24 });

  assert.deepEqual(response, { success: true, queued: true, action_id: 'test-action' });
  assert.equal(requests[0].options.method, 'PUT');
  assert.deepEqual(JSON.parse(requests[0].options.body), { content: 'edited' });
  assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), { limit: '12' });
});

test('DM single delete uses the registered route; removed legacy DM operations are absent', async () => {
  const { client, requests } = makeClient();

  await client.dm.deleteMessage('dm-id', 'message-id');

  assert.deepEqual(requests.map(({ options }) => options.method), ['DELETE']);
  assert.deepEqual(requests.map(({ url }) => url.pathname), ['/api/dm/dm-id/messages/message-id']);
  // 0.2.0 で旧互換メソッドは削除した（現行Serverに対応ルートがないため）。
  for (const method of ['addMember', 'removeMember', 'addReaction', 'removeReaction']) {
    assert.equal(typeof client.dm[method], 'undefined', `client.dm.${method} must not exist`);
  }
});
