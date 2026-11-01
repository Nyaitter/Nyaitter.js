import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { NyaitterClient, NyaitterError } from '../src/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const expectedCounts = { posts: 25, groups: 23, notes: 7 };

function registrations(source) {
  const rows = [];
  const re = /router\.(get|post|put|patch|delete)\(\s*\{([\s\S]*?)\}\s*,/g;
  for (const match of source.matchAll(re)) {
    const pathMatch = match[2].match(/\bpath\s*:\s*['"]([^'"]+)['"]/);
    const authMatch = match[2].match(/\bauth\s*:\s*['"]([^'"]+)['"]/);
    assert.ok(pathMatch, `registered ${match[1]} route has a path`);
    assert.ok(authMatch, `registered ${pathMatch[1]} route declares auth`);
    rows.push(`${match[1].toUpperCase()} ${pathMatch[1]} ${authMatch[1]}`);
  }
  return rows;
}

test('content SDK contract documents exactly every current Server registration', async (t) => {
  if (!existsSync(path.join(root, 'Server/server/routes/posts.js'))) { t.skip('Server repository (../Server) not found next to nyaitter.js'); return; }
  const doc = await readFile(new URL('./content-server-contract.md', import.meta.url), 'utf8');
  for (const [name, count] of Object.entries(expectedCounts)) {
    const source = await readFile(path.join(root, 'Server/server/routes', `${name}.js`), 'utf8');
    const routes = registrations(source);
    assert.equal(routes.length, count, `${name} route count changed; update contract table`);
    for (const registration of routes) {
      const [method, route] = registration.split(' ');
      assert.ok(doc.includes(`| ${method} \`${route}\` (${name},`), `contract table missing ${name}: ${registration}`);
    }
    const api = await readFile(new URL(`../src/api/${name === 'posts' ? 'PostsAPI' : name === 'groups' ? 'GroupsAPI' : 'NotesAPI'}.js`, import.meta.url), 'utf8');
    assert.ok(api.length > 0);
    assert.ok(doc.includes(`(${name},`), `contract table must enumerate ${name}`);
  }
});

test('SDK methods use the documented wire paths, query/body conversion and bearer auth', async () => {
  const calls = [];
  const client = new NyaitterClient({
    baseUrl: 'https://example.test/api', token: 'contract-token',
    fetch: async (input, init = {}) => {
      const url = new URL(input);
      calls.push({ method: init.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  await client.posts.create({ content: 'hello', replyToId: 4, groupId: 'g' });
  await client.posts.getPage({ mode: 'profile', userId: 7, ids: [1, 2], cursor: 'c' });
  await client.groups.create({ name: 'group', iconData: 'data:image/png,x' });
  await client.groups.respondJoinRequest('g', 'r', 'approve');
  await client.notes.create(9, { content: 'reason', reasons: ['spam'] });
  await client.notes.getReasonTags({ side: 'create' });
  await client.notes.listForPosts([9, 9, 10, -1, 'x']);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['POST', '/api/posts'], ['GET', '/api/posts/page'], ['POST', '/api/groups'],
    ['POST', '/api/groups/g/join-requests/r/respond'], ['POST', '/api/posts/9/notes'], ['GET', '/api/notes/reason-tags'],
    ['POST', '/api/notes/bulk'],
  ]);
  assert.deepEqual(calls[6].body, { post_ids: [9, 10] });
  assert.deepEqual(calls[0].body, { content: 'hello', reply_to: 4, mask: false, lock: false, announcement: false, group_id: 'g', group_announcement: false, reply_control: 'everyone' });
  assert.deepEqual(calls[1].query, { mode: 'profile', tab: 'foryou', user_id: '7', sub_type: 'all', ids: '1,2', limit: '30', offset: '0', cursor: 'c' });
  assert.equal(calls[2].body.icon_data, 'data:image/png,x');
  assert.deepEqual(calls[3].body, { decision: 'approve' });
  assert.deepEqual(calls[4].body, { content: 'reason', reasons: ['spam'] });
  assert.deepEqual(calls[5].query, { side: 'create' });
  assert.ok(calls.every(call => call.headers.Authorization === 'Bearer contract-token'));
});

test('SDK propagates Server-shaped error status and message', async () => {
  const client = new NyaitterClient({ baseUrl: 'https://example.test', fetch: async () => new Response(JSON.stringify({ error: 'Not allowed' }), { status: 403 }) });
  await assert.rejects(client.notes.list(1), error => error instanceof NyaitterError && error.status === 403 && error.message === 'Not allowed');
});
