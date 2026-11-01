import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NyaitterClient } from '../src/NyaitterClient.js';

// Cross-checks the SDK against the real Server route registrations by
// reading the Server sources (the same style as
// content-server-contract.test.js). The fetch-mock tests in this folder
// only assert what the SDK sends; this file asserts that what it sends
// corresponds to routes the current Server actually registers, and that
// the legacy routes removed from the SDK in 0.2.0 really have no Server route.
// Skips when the Server repository is not checked out next to this one.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverRoot = path.join(repoRoot, '..', 'Server');
const serverAvailable = existsSync(path.join(serverRoot, 'server/routes/dm.js'));
const opts = serverAvailable ? {} : { skip: 'Server repository (../Server) not found next to nyaitter.js' };

function registrations(source) {
  const baseMatch = source.match(/basePath:\s*['"]([^'"]*)['"]/);
  const base = baseMatch ? baseMatch[1] : '';
  const rows = [];
  const re = /router\.(get|post|put|patch|delete)\(\s*\{([\s\S]*?)\}\s*,/g;
  for (const match of source.matchAll(re)) {
    const pathMatch = match[2].match(/\bpath\s*:\s*['"]([^'"]+)['"]/);
    if (!pathMatch) continue;
    const joined = base + (pathMatch[1] === '/' ? '' : pathMatch[1]);
    rows.push(`${match[1].toUpperCase()} ${(joined || '/').replace(/:[^/]+/g, ':param')}`);
  }
  return rows;
}

async function routesOf(name) {
  return registrations(await readFile(path.join(serverRoot, 'server/routes', name), 'utf8'));
}

test('DM: routes used by current SDK methods exist on Server; legacy-only routes do not', opts, async () => {
  const routes = await routesOf('dm.js');
  for (const route of [
    'GET /dm', 'GET /dm/unread', 'GET /dm/unread-counts', 'GET /dm/find',
    'GET /dm/keys', 'POST /dm/keys', 'POST /dm', 'GET /dm/:param',
    'PUT /dm/:param', 'DELETE /dm/:param',
    'PATCH /dm/:param/messages/:param', 'DELETE /dm/:param/messages/:param',
    'POST /dm/:param/messages', 'POST /dm/:param/accept',
    'POST /dm/:param/decline', 'POST /dm/:param/read', 'POST /dm/:param/leave',
  ]) assert.ok(routes.includes(route), `Server is missing DM route ${route}`);
  // The removed DmAPI.addMember/removeMember/addReaction/removeReaction targeted these.
  for (const route of [
    'POST /dm/:param/members', 'DELETE /dm/:param/members/:param',
    'POST /dm/:param/messages/:param/reactions',
    'DELETE /dm/:param/messages/:param/reactions',
  ]) assert.ok(!routes.includes(route), `Server unexpectedly has legacy DM route ${route}`);
});

test('Auth: current provider/session routes exist on Server; deprecated legacy routes do not', opts, async () => {
  const routes = await routesOf('auth.js');
  for (const route of [
    'GET /auth/providers', 'POST /auth/:param/initiate', 'POST /auth/:param/verify',
    'GET /auth/linked-providers', 'GET /auth/me', 'POST /auth/logout',
    'GET /auth/sessions', 'GET /auth/accounts',
  ]) assert.ok(routes.includes(route), `Server is missing auth route ${route}`);
  // The removed AuthAPI.login/register/checkScratch/linkScratch/linkAccount,
  // the 2FA trio and the external-auth trio targeted these.
  for (const route of [
    'POST /auth/login', 'POST /auth/register', 'POST /auth/check-scratch',
    'POST /auth/link-scratch', 'POST /auth/accounts/link',
    'POST /auth/2fa/setup', 'POST /auth/2fa/verify', 'POST /auth/2fa/disable',
    'POST /auth/external/start', 'POST /auth/external/confirm',
    'POST /auth/external/complete',
  ]) assert.ok(!routes.includes(route), `Server unexpectedly has legacy auth route ${route}`);
});

test('Notes: Server registers exactly the seven note routes NotesAPI uses', opts, async () => {
  const routes = await routesOf('notes.js');
  assert.deepEqual([...routes].sort(), [
    'DELETE /notes/:param', 'GET /notes/reason-tags', 'GET /posts/:param/notes',
    'POST /notes/:param/ratings', 'POST /notes/:param/re-evaluate',
    'POST /notes/bulk', 'POST /posts/:param/notes',
  ].sort());
  const api = await readFile(new URL('../src/api/NotesAPI.js', import.meta.url), 'utf8');
  for (const method of ['create(', 'list(', 'listForPosts(', 'getReasonTags(', 'rate(', 'delete(', 'reEvaluate(']) {
    assert.ok(api.includes(method), `NotesAPI is missing ${method}`);
  }
});

test('Verification: only the me/apply routes exist on Server; list/get/update routes do not', opts, async () => {
  const routes = await routesOf('verificationApplications.js');
  assert.deepEqual([...routes].sort(), [
    'GET /verification-applications/me', 'POST /verification-applications',
  ].sort());
});

test('Users pin: the read route exists on Server and pin write routes do not', opts, async () => {
  const routes = await routesOf('users.js');
  assert.ok(routes.includes('GET /users/:param/pin'), 'Server is missing GET /users/:id/pin');
  assert.ok(!routes.some((route) => route.includes('pinned-posts')), 'Server unexpectedly has a pin write route');
});

test('removed legacy compatibility methods are absent from the client surface (0.2.0)', async () => {
  const client = new NyaitterClient({
    baseUrl: 'https://example.invalid/api',
    fetch: async () => new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });
  const removed = {
    auth: ['login', 'register', 'checkScratch', 'linkScratch', 'linkAccount', 'setup2FA', 'verify2FA', 'disable2FA', 'startExternalAuth', 'confirmExternalAuth', 'completeExternalAuth', 'requestAccountDeletion', 'cancelAccountDeletion'],
    dm: ['addMember', 'removeMember', 'addReaction', 'removeReaction'],
    users: ['getReplies', 'pinPost', 'unpinPost', 'getBlocks', 'getMutes', 'mute', 'unmute'],
    verification: ['list', 'get', 'update'],
    posts: ['getByTag', 'getLiked', 'getStarred', 'getReactions', 'markAsRead'],
  };
  for (const [namespace, methods] of Object.entries(removed)) {
    for (const method of methods) {
      assert.equal(typeof client[namespace][method], 'undefined', `${namespace}.${method} must not exist`);
    }
  }
});
