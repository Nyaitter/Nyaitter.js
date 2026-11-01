import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient, NyaitterError } from '../src/index.js';

function mockClient(responses = []) {
  const calls = [];
  const client = new NyaitterClient({
    baseUrl: 'https://example.test/server',
    token: 'session-token',
    fetch: async (input, init = {}) => {
      const url = new URL(input);
      calls.push({ method: init.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers });
      const response = responses[calls.length - 1] ?? { status: 200, body: { success: true } };
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  return { client, calls };
}

test('DM SDK maps every currently registered Server route to its method, path, query and payload', async () => {
  const { client, calls } = mockClient();
  await client.dm.list();
  await client.dm.getUnreadCount();
  await client.dm.getUnreadCounts();
  await client.dm.find(7);
  await client.dm.getKeys([7, 8]);
  await client.dm.setKey('public-key-12345');
  await client.dm.create({ members: [7, 8], title: 'room' });
  await client.dm.get('dm/1', { limit: 12, offset: 4, markRead: true });
  await client.dm.updateRoom('dm/1', { title: 'renamed', members: [7, 8], hostId: 7, post: [{ id: 3 }] });
  await client.dm.delete('dm/1');
  await client.dm.editMessage('dm/1', 'm/2', { content: 'edited' });
  await client.dm.deleteMessage('dm/1', 'm/2');
  await client.dm.sendMessage('dm/1', { content: 'hello' });
  await client.dm.accept('dm/1');
  await client.dm.decline('dm/1');
  await client.dm.markAsRead('dm/1');
  await client.dm.leave('dm/1');

  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['GET', '/server/dm'], ['GET', '/server/dm/unread'], ['GET', '/server/dm/unread-counts'],
    ['GET', '/server/dm/find'], ['GET', '/server/dm/keys'], ['POST', '/server/dm/keys'],
    ['POST', '/server/dm'], ['GET', '/server/dm/dm%2F1'], ['PUT', '/server/dm/dm%2F1'],
    ['DELETE', '/server/dm/dm%2F1'], ['PATCH', '/server/dm/dm%2F1/messages/m%2F2'], ['DELETE', '/server/dm/dm%2F1/messages/m%2F2'],
    ['POST', '/server/dm/dm%2F1/messages'], ['POST', '/server/dm/dm%2F1/accept'],
    ['POST', '/server/dm/dm%2F1/decline'], ['POST', '/server/dm/dm%2F1/read'],
    ['POST', '/server/dm/dm%2F1/leave'],
  ]);
  assert.deepEqual(calls.map(({ query }) => query), [
    { limit: '50', offset: '0' }, {}, {}, { user_id: '7' }, { user_ids: '7,8' }, {}, {},
    { mark_read: '1' }, {}, {}, {}, {}, {}, {}, {}, {}, {},
  ]);
  assert.deepEqual(calls.map(({ body }) => body), [
    undefined, undefined, undefined, undefined, undefined, { public_key: 'public-key-12345' },
    { member: [7, 8], title: 'room' }, undefined,
    { title: 'renamed', member: [7, 8], host_id: 7, post: [{ id: 3 }] }, undefined,
    { content: 'edited' }, undefined, { message: { content: 'hello' } }, {}, {}, {}, {},
  ]);
  assert.ok(calls.every(({ headers }) => headers.Authorization === 'Bearer session-token'));
});

test('DM methods preserve the server error status and message', async () => {
  const { client } = mockClient([{ status: 403, body: { error: 'DM membership required' } }]);
  await assert.rejects(client.dm.get('private-room'), error =>
    error instanceof NyaitterError && error.status === 403 && error.message === 'DM membership required');
});

test('legacy DM methods without a registered Server route were removed in 0.2.0', async () => {
  const source = await import('node:fs/promises');
  const api = await source.readFile(new URL('../src/api/DmAPI.js', import.meta.url), 'utf8');
  for (const method of ['addMember', 'removeMember', 'addReaction', 'removeReaction']) {
    assert.equal(api.indexOf(`  ${method}(`), -1, `${method} must not be defined`);
  }
});
