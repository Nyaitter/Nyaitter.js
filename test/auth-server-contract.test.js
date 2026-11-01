import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient } from '../src/NyaitterClient.js';

function harness({ status = 200, payload = { success: true } } = {}) {
  const requests = [];
  const client = new NyaitterClient({
    baseUrl: 'http://127.0.0.1:43210/server',
    token: 'user-token',
    fetch: async (input, init = {}) => {
      const url = new URL(input);
      requests.push({
        method: init.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        body: init.body ? JSON.parse(init.body) : undefined,
        authorization: new Headers(init.headers).get('authorization'),
      });
      return new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  return { client, requests };
}

test('verification, appeals and reports SDK requests match current Server routes', async () => {
  const { client, requests } = harness();
  await client.verification.getStatus();
  await client.verification.apply();
  await client.appeals.getStatus();
  await client.appeals.create({ description: 'Please review this freeze.' });
  await client.reports.create({ targetKind: 'post', targetId: 17, description: 'spam', postAsUserId: 4 });
  await client.reports.list({ status: 'assigned', limit: 12, offset: 3 });
  await client.reports.listAssigned({ status: 'assigned', limit: 12, offset: 3 });
  await client.reports.get(9);
  await client.reports.update(9, { status: 'reviewed', note: 'checked', action: 'none' });
  await client.reports.resolve(9, { actions: { freeze: true } });
  await client.reports.retractTrust(9, { reason: 'Incorrect prior action' });

  assert.deepEqual(requests, [
    { method: 'GET', path: '/server/verification-applications/me', query: {}, body: undefined, authorization: 'Bearer user-token' },
    { method: 'POST', path: '/server/verification-applications', query: {}, body: {}, authorization: 'Bearer user-token' },
    { method: 'GET', path: '/server/appeals/me', query: {}, body: undefined, authorization: 'Bearer user-token' },
    { method: 'POST', path: '/server/appeals', query: {}, body: { description: 'Please review this freeze.' }, authorization: 'Bearer user-token' },
    { method: 'POST', path: '/server/reports', query: {}, body: { target_kind: 'post', target_id: 17, description: 'spam', post_as_user_id: 4 }, authorization: 'Bearer user-token' },
    { method: 'GET', path: '/server/reports', query: { status: 'assigned', limit: '12', offset: '3' }, body: undefined, authorization: 'Bearer user-token' },
    { method: 'GET', path: '/server/reports/assigned', query: { status: 'assigned', limit: '12', offset: '3' }, body: undefined, authorization: 'Bearer user-token' },
    { method: 'GET', path: '/server/reports/9', query: {}, body: undefined, authorization: 'Bearer user-token' },
    { method: 'PATCH', path: '/server/reports/9', query: {}, body: { status: 'reviewed', note: 'checked', action: 'none' }, authorization: 'Bearer user-token' },
    { method: 'POST', path: '/server/reports/9/resolve', query: {}, body: { actions: { freeze: true } }, authorization: 'Bearer user-token' },
    { method: 'POST', path: '/server/reports/9/trust-retract', query: {}, body: { reason: 'Incorrect prior action' }, authorization: 'Bearer user-token' },
  ]);
});

test('SDK returns successful Server response payloads unchanged', async () => {
  const payload = { application: { id: 2, status: 'assigned', assigned_at: null, created_at: 'now' } };
  const { client } = harness({ payload });
  assert.deepEqual(await client.verification.getStatus(), payload);
});

test('SDK preserves Server auth and validation failures as NyaitterError', async () => {
  for (const [status, error] of [[401, 'Authentication required'], [403, 'Only frozen accounts can submit appeals'], [400, 'target_kind must be post or user']]) {
    const { client } = harness({ status, payload: { error } });
    await assert.rejects(client.appeals.create({ description: 'test' }), (e) => e.status === status && e.message === error && e.data.error === error);
  }
});

test('NyaitterAuth maps all 11 current registered route paths and payload names', async () => {
  const { client, requests } = harness();
  await client.nyaitterAuth.initiate({ appId: 'app', redirectUri: 'https://example.test/cb', scopes: ['profile:read'], name: 'App', iconUrl: 'https://example.test/i.png', state: 'csrf' });
  await client.nyaitterAuth.getRequest('r/1');
  await client.nyaitterAuth.approve({ request_id: 'r', granted_scopes: ['profile:read'] });
  await client.nyaitterAuth.autoPass('r');
  await client.nyaitterAuth.checkGrant({ app_id: 'app', api_token: 'secret' });
  await client.nyaitterAuth.deny({ request_id: 'r' });
  await client.nyaitterAuth.exchangeToken({ appId: 'app', code: 'c' });
  await client.nyaitterAuth.getUserInfo();
  await client.nyaitterAuth.getAuthorizedApps();
  await client.nyaitterAuth.updateAuthorizedApp('app auth', ['profile:read']);
  await client.nyaitterAuth.revokeAuthorizedApp('app auth');
  assert.deepEqual(requests.map(({ method, path, query, body }) => [method, path, query, body]), [
    ['POST', '/server/nyaitter-auth/initiate', {}, { app_id: 'app', api_token: 'user-token', redirect_uri: 'https://example.test/cb', scopes: ['profile:read'], name: 'App', icon_url: 'https://example.test/i.png', state: 'csrf' }],
    ['GET', '/server/nyaitter-auth/requests/r%2F1', {}, undefined],
    ['POST', '/server/nyaitter-auth/approve', {}, { request_id: 'r', granted_scopes: ['profile:read'] }],
    ['POST', '/server/nyaitter-auth/auto-pass', {}, { request_id: 'r' }],
    ['GET', '/server/nyaitter-auth/check-grant', { app_id: 'app', api_token: 'secret' }, undefined],
    ['POST', '/server/nyaitter-auth/deny', {}, { request_id: 'r' }],
    ['POST', '/server/nyaitter-auth/token', {}, { app_id: 'app', api_token: 'user-token', code: 'c' }],
    ['GET', '/server/nyaitter-auth/userinfo', {}, undefined],
    ['GET', '/server/nyaitter-auth/authorized-apps', {}, undefined],
    ['PATCH', '/server/nyaitter-auth/authorized-apps/app%20auth', {}, { scopes: ['profile:read'] }],
    ['DELETE', '/server/nyaitter-auth/authorized-apps/app%20auth', {}, undefined],
  ]);
});

test('the six selected user-management SDK calls match registered methods, paths and body fields', async () => {
  const { client, requests } = harness();
  await client.users.getStatus();
  await client.users.moderateTrust(5, { banned: true, reason: 'Repeated abusive behavior' });
  await client.users.retractNoteOutcome(5, { noteId: 8, reason: 'Evidence was incorrect' });
  await client.users.getUserStatus(5);
  await client.users.updateUserStatus(5, { shadow: true });
  await client.users.updateUser(5, { verify: true, freeze: false, admin: false });
  assert.deepEqual(requests.map(({ method, path, body }) => [method, path, body]), [
    ['GET', '/server/users/me/status', undefined],
    ['POST', '/server/users/5/trust-moderation', { banned: true, reason: 'Repeated abusive behavior' }],
    ['POST', '/server/users/5/note-outcome-retract', { noteId: 8, reason: 'Evidence was incorrect' }],
    ['GET', '/server/users/5/status', undefined],
    ['PUT', '/server/users/5/status', { shadow: true }],
    ['PUT', '/server/users/5', { verify: true, freeze: false, admin: false }],
  ]);
});

test('AuthAPI current provider, login-approval, recovery and session calls map registered paths', async () => {
  const { client, requests } = harness();
  await client.auth.getProviders();
  await client.auth.initiateProvider('scratch', { username: 'cat' });
  await client.auth.verifyProvider('scratch', { username: 'cat', code: '123' });
  await client.auth.generateScratchResponse('cat');
  await client.auth.getLinkedProviders();
  await client.auth.initiateProviderLink('google', { redirect_uri: 'https://example.test' });
  await client.auth.verifyProviderLink('google', { code: 'abc' });
  await client.auth.unlinkProvider('google', 'provider-id');
  await client.auth.pollLoginApproval('approval-1', 'poll-token');
  await client.auth.getLoginApproval('approval-1');
  await client.auth.decideLoginApproval('approval-1', 'approve');
  await client.auth.startAccountRecovery({ approvalId: 'approval-1', approvalToken: 'token' });
  await client.auth.pollAccountRecovery('recovery-1', 'token');
  await client.auth.getAccountRecovery('recovery-1');
  await client.auth.decideAccountRecovery('recovery-1', 'approve');
  await client.auth.getBlockedIps();
  await client.auth.deleteBlockedIp('a'.repeat(64));
  await client.auth.trustCurrentIp();
  await client.auth.getSessions();
  await client.auth.revokeSession('session-1');
  await client.auth.revokeSessionIp('session-1');
  await client.auth.getMe();
  await client.auth.initiateNyaitterResponse({ code: 'external-code' });
  await client.auth.getAccounts();
  await client.auth.switchAccount({ accountId: 7 });
  await client.auth.unlinkAccount(7);
  await client.auth.switchImposter(8);
  await client.auth.logout();
  await client.auth.verifyTurnstile('turnstile');
  await client.auth.testProtected();
  await client.auth.devLogin('cat');
  await client.auth.createBotToken('bot');
  await client.auth.getBotTokens();
  await client.auth.deleteBotToken('token-1');
  const paths = requests.map(({ method, path }) => `${method} ${path}`);
  assert.equal(paths.length, 34, 'expected one SDK request for each current auth registration');
  assert.deepEqual(paths, [
    'GET /server/auth/providers', 'POST /server/auth/scratch/initiate', 'POST /server/auth/scratch/verify',
    'POST /server/auth/scratch/generate',
    'GET /server/auth/linked-providers', 'POST /server/auth/link/google/initiate', 'POST /server/auth/link/google/verify',
    'DELETE /server/auth/link/google', 'POST /server/auth/login-approvals/approval-1/poll',
    'GET /server/auth/login-approvals/approval-1', 'POST /server/auth/login-approvals/approval-1/decision',
    'POST /server/auth/account-recovery/start', 'POST /server/auth/account-recovery/recovery-1/poll',
    'GET /server/auth/account-recovery/recovery-1', 'POST /server/auth/account-recovery/recovery-1/decision',
    'GET /server/auth/blocked-ips', 'DELETE /server/auth/blocked-ips/' + 'a'.repeat(64),
    'POST /server/auth/login-security/trust-current-ip', 'GET /server/auth/sessions',
    'DELETE /server/auth/sessions/session-1', 'POST /server/auth/sessions/session-1/revoke-ip',
    'GET /server/auth/me', 'POST /server/auth/nyaitter/initiate', 'GET /server/auth/accounts', 'POST /server/auth/accounts/switch',
    'DELETE /server/auth/accounts/7', 'POST /server/auth/imposters/8/switch', 'POST /server/auth/logout',
    'POST /server/auth/turnstile/verify', 'GET /server/auth/test-protected', 'POST /server/auth/dev-login',
    'POST /server/auth/bot-tokens', 'GET /server/auth/bot-tokens', 'DELETE /server/auth/bot-tokens/token-1',
  ]);
});
