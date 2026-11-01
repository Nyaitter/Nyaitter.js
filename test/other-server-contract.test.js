import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const serverAvailable = existsSync(new URL('../../Server/server/index.js', import.meta.url));
if (!serverAvailable) {
  test('other SDK contract inventory matches currently registered Server routes', (t) => {
    t.skip('Server repository (../Server) not found next to nyaitter.js');
  });
} else {

// Server route modules only register Express routes here; no app, DB adapter,
// listener, or persistent store is created. This checks Server's own registry,
// not the separate SDK fetch-mock wire-contract tests.
const requireServer = createRequire(new URL('../../Server/server/index.js', import.meta.url));
const api = requireServer('./utils/ApiRegistry');
const routes = [
  'spaces', 'notifications', 'calls', 'polls', 'push', 'imposters', 'ranking',
  'rules', 'ui', 'oembed', 'urlCards', 'status',
];

const expected = [
  'GET /spaces/ice-servers', 'GET /spaces', 'POST /spaces', 'GET /spaces/mine',
  'GET /spaces/:spaceId', 'PATCH /spaces/:spaceId', 'DELETE /spaces/:spaceId',
  'POST /spaces/:spaceId/join', 'POST /spaces/:spaceId/leave', 'GET /spaces/:spaceId/members',
  'GET /spaces/:spaceId/channels', 'POST /spaces/:spaceId/channels',
  'PATCH /spaces/:spaceId/channels/:channelId', 'DELETE /spaces/:spaceId/channels/:channelId',
  'GET /spaces/:spaceId/channels/:channelId/messages', 'POST /spaces/:spaceId/channels/:channelId/messages',
  'DELETE /spaces/:spaceId/messages/:messageId',
  'POST /notifications', 'GET /notifications', 'GET /notifications/unread',
  'PUT /notifications/:id/read', 'PUT /notifications/:id/clicked', 'DELETE /notifications/:id',
  'PUT /notifications/read-all', 'PUT /notifications/click-all',
  'GET /calls/stages', 'POST /calls/stages', 'GET /calls/stages/:id',
  'POST /calls/stages/:id/guest-session', 'DELETE /calls/stages/guest-session',
  'PATCH /calls/stages/:id', 'GET /calls/dm/:id',
  'GET /polls/:pollId', 'POST /polls/:pollId/vote',
  'GET /push/config', 'POST /push/subscriptions', 'DELETE /push/subscriptions',
  'GET /imposters', 'POST /imposters', 'POST /imposters/:imposterId/members',
  'PATCH /imposters/:imposterId/members/:memberId', 'DELETE /imposters/:imposterId/members/:memberId',
  'DELETE /imposters/:imposterId', 'GET /ranking/me', 'GET /ranking/:type', 'GET /rules',
  'GET /ui/summary', 'GET /oembed', 'GET /url-cards', 'GET /status',
];

test('other SDK contract inventory matches currently registered Server routes', () => {
  // This test file runs in its own node:test process: import each real route
  // module once, then compare only the specified families. Requiring modules
  // registers paths but does not invoke handlers or start the Server.
  for (const route of routes) requireServer(`./routes/${route}`);
  const actual = api.getEndpoints()
    .filter(({ tag }) => ['spaces', 'notifications', 'calls', 'polls', 'push', 'imposters', 'ranking', 'rules', 'ui', 'oembed', 'url-cards', 'system'].includes(tag))
    .map(({ method, fullPath }) => `${method.toUpperCase()} ${fullPath}`)
    .sort();
  assert.deepEqual(actual, [...expected].sort());
});
}
