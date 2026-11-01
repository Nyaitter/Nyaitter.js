import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient } from '../src/NyaitterClient.js';

function mockClient(options = {}) {
  const calls = [];
  const client = new NyaitterClient({
    baseUrl: 'https://example.test/server',
    fetch: async (input, init = {}) => {
      const url = new URL(input);
      calls.push({
        method: init.method,
        path: url.pathname,
        headers: init.headers,
        body: init.body ? JSON.parse(init.body) : undefined,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
    ...options,
  });
  return { client, calls };
}

test('extensions methods call the internal routes with the extension key header', async () => {
  const { client, calls } = mockClient();
  await client.extensions.initiate({ extensionKey: 'ext-key-1', redirectUri: 'https://app.example.test/callback', state: 's1', scopes: ['profile:read'] });
  await client.extensions.exchangeToken({ extensionKey: 'ext-key-1', code: 'code-1' });
  await client.extensions.getUserInfo({ extensionKey: 'ext-key-1', accessToken: 'user-token-1' });

  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['POST', '/server/internal/extensions/nyaitter-auth/initiate'],
    ['POST', '/server/internal/extensions/nyaitter-auth/token'],
    ['POST', '/server/internal/extensions/nyaitter-auth/userinfo'],
  ]);
  assert.ok(calls.every((call) => call.headers['x-nyaitter-extension-key'] === 'ext-key-1'));
  assert.deepEqual(calls[0].body, { redirect_uri: 'https://app.example.test/callback', state: 's1', scopes: ['profile:read'] });
  assert.deepEqual(calls[1].body, { code: 'code-1' });
  assert.equal(calls[2].headers.Authorization, 'Bearer user-token-1');
});

test('extension key can be set on the client and is required otherwise', async () => {
  const { client, calls } = mockClient({ extensionKey: 'ext-key-2' });
  await client.extensions.exchangeToken({ code: 'code-2' });
  assert.equal(calls[0].headers['x-nyaitter-extension-key'], 'ext-key-2');

  client.setExtensionKey(null);
  assert.throws(() => client.extensions.exchangeToken({ code: 'code-3' }), /拡張キーが必要です/);
});
