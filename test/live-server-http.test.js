import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NyaitterClient, NyaitterError } from '../src/index.js';

// Server はこのリポジトリの隣にチェックアウトされている前提のレイアウトで解決する。
// 単独配置（CI等）では存在しないため、その場合はテストを skip する。
const serverRoot = fileURLToPath(new URL('../../Server', import.meta.url));
const serverAvailable = existsSync(serverRoot);
const scratchRoot = '/tmp/opencode/nyaitter-sdk-live-http';
const tokens = { alpha: 'sdk-live-alpha-token', beta: 'sdk-live-beta-token', outsider: 'sdk-live-outsider-token', admin: 'sdk-live-admin-token', alphaOther: 'sdk-live-alpha-other-token', outsiderOther: 'sdk-live-outsider-other-token' };

async function unusedPort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test('SDK calls isolated in-memory Server routes over HTTP (auth, permissions, validation, payloads)', async t => {
  if (!serverAvailable) { t.skip('Server repository (../Server) not found next to nyaitter.js'); return; }
  const bootstrapFor = port => `
    process.env.DB_ADAPTER = 'memory';
    process.env.STORAGE_ADAPTER = 'local';
    process.env.NYAITTER_OPERATOR_SOCKET = '${scratchRoot}/operator.sock';
    process.env.DEV_BYPASS_AUTH = 'false';
    process.env.DM_E2E_ENABLED = 'true';
    process.env.NOTE_EVALUATION_HMAC_SECRET = 'sdk-live-http-test-secret-at-least-32-bytes-long';
    // A generated VAPID pair enables the push service inside the isolated process
    // so that its routes can be exercised; no notification is ever sent.
    const vapid = require('web-push').generateVAPIDKeys();
    process.env.VAPID_SUBJECT = 'mailto:sdk-live-http@example.test';
    process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
    process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
    const fs = require('node:fs');
    const traceFile = '${scratchRoot}/post-trace.jsonl';
    const trace = (event, data = {}) => fs.appendFileSync(traceFile, JSON.stringify({ at: new Date().toISOString(), event, ...data }) + '\\n');
    fs.mkdirSync('${scratchRoot}', { recursive: true });
    fs.writeFileSync(traceFile, '');
    const pidFile = '${serverRoot}/data/server.pid';
    const writeFileSync = fs.writeFileSync.bind(fs);
    fs.writeFileSync = (file, ...args) => String(file) === pidFile ? undefined : writeFileSync(file, ...args);
    const unlinkSync = fs.unlinkSync.bind(fs);
    fs.unlinkSync = file => String(file) === pidFile ? undefined : unlinkSync(file);
    const config = require('./server/config');
    config.database.adapter = 'memory'; config.server.port = ${port}; config.server.listenHost = '127.0.0.1';
    config.server.maintenanceMode = false; config.sharePort = null; config.userFiles.port = null;
    config.storage.adapter = 'local'; config.storage.local.uploadDir = '${scratchRoot}/uploads';
    config.auth.methods.email.embeddedServer.enabled = false; config.autoMod.enabled = false;
    const DB = require('./server/adapters/database/InMemoryAdapter');
    for (const method of Object.getOwnPropertyNames(DB.prototype)) {
      const original = DB.prototype[method];
      if (method === 'constructor' || typeof original !== 'function' || !/^async /.test(Function.prototype.toString.call(original))) continue;
      DB.prototype[method] = async function(...args) {
        const start = Date.now();
        try { return await original.apply(this, args); }
        finally { const durationMs = Date.now() - start; if (durationMs >= 10) trace('db.slow', { method, durationMs }); }
      };
    }
    for (const method of ['createPost', 'getTimelinePostIds', 'getRecommendedPostIds']) {
      const original = DB.prototype[method];
      if (typeof original !== 'function') continue;
      DB.prototype[method] = async function(...args) {
        const details = method === 'createPost' ? { content: args[0]?.content, userId: args[0]?.userId } : { args: args[0] };
        trace('db.' + method + '.start', details);
        try {
          const result = await original.apply(this, args);
          trace('db.' + method + '.done', { ...details, result: method === 'createPost' ? { id: result?.id } : { ids: result?.ids } });
          return result;
        } catch (error) {
          trace('db.' + method + '.error', { ...details, error: error.stack || error.message });
          throw error;
        }
      };
    }
    const PostActionQueue = require('./server/services/PostActionQueue');
    const enqueue = PostActionQueue.prototype.enqueue;
    PostActionQueue.prototype.enqueue = function(type, run, policy) {
      const actionId = enqueue.call(this, type, run, policy);
      trace('queue.enqueued', { actionId, type, pending: this.pending, activeWorkers: this.activeWorkers });
      return actionId;
    };
    const runJob = PostActionQueue.prototype._runJob;
    PostActionQueue.prototype._runJob = async function(job) {
      trace('queue.start', { actionId: job.actionId, type: job.type, pending: this.pending, activeWorkers: this.activeWorkers });
      try { return await runJob.call(this, job); }
      finally { trace('queue.finish', { actionId: job.actionId, type: job.type, pending: this.pending, activeWorkers: this.activeWorkers }); }
    };
    const Session = require('./server/services/auth/SessionManager');
    const connect = DB.prototype.connect;
    DB.prototype.connect = async function() {
      await connect.call(this);
      const users = {};
      for (const name of ['Alpha', 'Beta', 'Outsider']) users[name.toLowerCase()] = await this.createUser({ name });
      users.admin = await this.createUser({ name: 'SDK Admin', admin: true });
      for (const [key, token] of Object.entries(${JSON.stringify(tokens)})) {
         const owner = key === 'alphaOther' ? 'alpha' : key === 'outsiderOther' ? 'outsider' : key;
        await this.createSession(users[owner].id, { token: Session.hashToken(token) });
      }
      fs.mkdirSync('${scratchRoot}', { recursive: true });
      fs.writeFileSync('${scratchRoot}/users.json', JSON.stringify(Object.fromEntries(Object.entries(users).map(([key, user]) => [key, user.id]))));
    };
    // URL cards normally fetch the public internet. The isolated test pins the
    // service to a deterministic non-network result so that only the SDK/Server
    // HTTP contract (query passing and response shape) is measured here.
    const urlCardService = require('./server/services/UrlCardService');
    urlCardService.getUrlCard = async url => (url ? {
      url,
      title: 'isolated fixture card',
      description: null,
      image: null,
      site_name: null,
      type: 'link',
    } : null);
     const keywordService = require('./server/services/PostKeywordService');
     const extractKeywords = keywordService.extractPostKeywords;
     keywordService.extractPostKeywords = async (...args) => {
       const startedAt = Date.now();
       trace('keywords.start', { content: args[0] });
       try { return await extractKeywords(...args); }
       finally { trace('keywords.done', { durationMs: Date.now() - startedAt }); }
     };
     // The first create lazily builds Kuromoji's local dictionary (hundreds of ms
     // to several seconds). Warm it before accepting test requests, so the queue
     // contract is not decided by cold filesystem/cache timing.
     keywordService.extractPostKeywords('isolated fixture warmup').then(
       () => require('./server/index.js'),
       error => { trace('fixture.warmup.error', { error: error.stack || error.message }); console.error(error); process.exitCode = 1; },
     );
  `;

  let exitPromise = Promise.resolve();
  const start = port => {
    serverPort = port;
    stderr = '';
    child = spawn(process.execPath, ['-e', bootstrapFor(port)], { cwd: serverRoot, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    exitPromise = once(child, 'exit').catch(() => {});
  };
  let child;
  let serverPort = 0;
  let stderr = '';
  const baseUrl = () => `http://127.0.0.1:${serverPort}/server`;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([once(child, 'exit'), sleep(5000)]);
    }
  });

  start(await unusedPort());

  // A port picked just before the spawn can still be taken (EADDRINUSE) by
  // another process, so a taken port is retried with a fresh one. Any other
  // failure is final: EPERM/EACCES in particular means the sandbox denies the
  // bind, and retrying would hide that denial instead of reporting it.
  let ready = false;
  for (let attempt = 0; attempt < 3 && !ready; attempt++) {
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) break;
      try {
        const response = await fetch(`${baseUrl()}/health`);
        if (response.ok) { ready = true; break; }
      } catch {}
      await sleep(100);
    }
    if (ready) break;
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([once(child, 'exit'), sleep(5000)]);
    }
    await exitPromise;
    if (!/EADDRINUSE/.test(stderr)) break;
    if (attempt === 2) break;
    start(await unusedPort());
  }
  assert.ok(ready, `isolated Server did not become ready: ${stderr}`);

  const alpha = new NyaitterClient({ baseUrl: baseUrl(), token: tokens.alpha });
  const beta = new NyaitterClient({ baseUrl: baseUrl(), token: tokens.beta });
  const outsider = new NyaitterClient({ baseUrl: baseUrl(), token: tokens.outsider });
  const anonymous = new NyaitterClient({ baseUrl: baseUrl() });
  const invalid = new NyaitterClient({ baseUrl: baseUrl(), token: 'not-a-valid-session' });
  const admin = new NyaitterClient({ baseUrl: baseUrl(), token: tokens.admin });

  await t.test('public system status and authenticated UI summary use live Server responses', async () => {
    const status = await anonymous.system.getStatus();
    assert.equal(status.server, 'ok');
    assert.ok(['connected', 'ok'].includes(status.database));
    assert.ok(Array.isArray(status.auth_methods));
    await assert.rejects(anonymous.system.getUiSummary(), e => e instanceof NyaitterError && e.status === 401);
    const summary = await alpha.system.getUiSummary();
    assert.equal(typeof summary.notification_unread_count, 'number');
    assert.equal(typeof summary.dm_unread_count, 'number');
  });

  await t.test('real authentication distinguishes anonymous, invalid, and valid sessions', async () => {
    await assert.rejects(anonymous.getMe(), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(invalid.getMe(), e => e instanceof NyaitterError && e.status === 401);
    const me = await alpha.getMe();
    assert.ok(me.user?.id);
    const status = await alpha.users.getStatus();
    assert.ok(status && typeof status === 'object');
    const providers = await anonymous.auth.getProviders();
    assert.ok(providers && typeof providers === 'object');
    await assert.rejects(anonymous.auth.getSessions(), e => e instanceof NyaitterError && e.status === 401);
    const sessions = await alpha.auth.getSessions();
    assert.ok(sessions.sessions.length >= 2);
    assert.ok(sessions.sessions.every(session => session.id && !('token' in session)));
    await assert.rejects(alpha.auth.revokeSession('does-not-exist'), e => e instanceof NyaitterError && e.status === 404);
    const blocked = await alpha.auth.getBlockedIps();
    assert.ok(Array.isArray(blocked.blocked_ips));
    await assert.rejects(alpha.auth.deleteBlockedIp('invalid-hash'), e => e instanceof NyaitterError && e.status === 400);
    assert.equal((await alpha.auth.trustCurrentIp()).success, true);
  });

  await t.test('user management routes separate regular users from admin and validate moderation input', async () => {
    const { alpha: alphaId, beta: betaId } = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/users.json`, 'utf8')));
    await assert.rejects(anonymous.users.getUserStatus(betaId), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.users.getUserStatus(betaId), e => e instanceof NyaitterError && e.status === 403);
    const status = await admin.users.getUserStatus(betaId);
    assert.ok(status.status && typeof status.status === 'object');
    await assert.rejects(alpha.users.updateUserStatus(betaId, { shadow: true }), e => e instanceof NyaitterError && e.status === 403);
    const changedStatus = await admin.users.updateUserStatus(betaId, { shadow: true });
    assert.equal(changedStatus.success, true);
    assert.equal(changedStatus.status.shadow, true);
    assert.equal((await admin.users.updateUserStatus(betaId, { shadow: false })).status.shadow, false);
    await assert.rejects(alpha.users.moderateTrust(betaId, { banned: true, reason: 'a' }), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(admin.users.moderateTrust(betaId, { banned: true, reason: 'short' }), e => e instanceof NyaitterError && e.status === 400);
    assert.equal((await admin.users.moderateTrust(betaId, { banned: true, reason: 'isolated HTTP moderation test' })).success, true);
    assert.equal((await admin.users.moderateTrust(betaId, { banned: false, reason: 'isolated HTTP moderation reset' })).success, true);
    await assert.rejects(admin.users.updateUser(0, { verify: true }), e => e instanceof NyaitterError && e.status === 404);
    const updated = await admin.users.updateUser(betaId, { verify: true, freeze: false, admin: false });
    assert.ok(updated.user?.id || updated.success);
    await assert.rejects(admin.users.retractNoteOutcome(betaId, { noteId: 987654321, reason: 'isolated nonexistent evidence' }), e => e instanceof NyaitterError && e.status === 404);
    assert.ok(alphaId > 0);
  });

  await t.test('reports routes permit user submissions and restrict moderation reads to admin', async () => {
    const { beta: betaId } = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/users.json`, 'utf8')));
    await assert.rejects(anonymous.reports.create({ targetKind: 'user', targetId: betaId, description: 'test' }), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.reports.create({ targetKind: 'invalid', targetId: betaId, description: 'test' }), e => e instanceof NyaitterError && e.status === 400);
    const submitted = await alpha.reports.create({ targetKind: 'user', targetId: betaId, description: 'isolated SDK integration test report' });
    assert.equal(submitted.success, true);
    assert.ok(submitted.report?.id);
    await assert.rejects(alpha.reports.list(), e => e instanceof NyaitterError && e.status === 403);
    const reports = await admin.reports.list();
    assert.ok(Array.isArray(reports.reports));
    const detail = await admin.reports.get(submitted.report.id);
    assert.equal(detail.report.id, submitted.report.id);
    const assigned = await admin.reports.listAssigned();
    assert.ok(Array.isArray(assigned.reports));
  });

  await t.test('post create/list/get return Server payloads and reject malformed input', async () => {
    await assert.rejects(anonymous.posts.create({ content: 'anonymous' }), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.posts.create({ content: '' }), e => e instanceof NyaitterError && e.status >= 400);
    const created = await alpha.posts.create({ content: 'SDK isolated live HTTP contract post' });
    assert.equal(created.queued, true);
    let post;
    const pollTrace = [];
    for (let i = 0; i < 30 && !post; i++) {
      const originalFetch = alpha._fetch;
      alpha._fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (String(args[0]).includes('/posts?')) pollTrace.push({ url: String(args[0]), status: response.status, body: await response.clone().text() });
        return response;
      };
      let result;
      try { result = await alpha.posts.list({ tab: 'all' }); }
      finally { alpha._fetch = originalFetch; }
      post = result.posts?.find(row => row.content === 'SDK isolated live HTTP contract post');
      if (!post) await sleep(50);
    }
    await import('node:fs/promises').then(fs => fs.writeFile(`${scratchRoot}/poll-trace.json`, JSON.stringify(pollTrace, null, 2)));
    assert.ok(post?.id, `queued test post should be processed and returned by list; Server stderr: ${stderr}; polls: ${JSON.stringify(pollTrace)}; server trace: ${await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/post-trace.jsonl`, 'utf8').catch(() => 'missing'))}`);
    const fetched = await alpha.posts.get(post.id);
    assert.equal(fetched.post.id, post.id);
    assert.equal(fetched.post.content, post.content);
  });

  await t.test('DM member authorization and message response are enforced by real routes', async () => {
    await assert.rejects(anonymous.dm.list(), e => e instanceof NyaitterError && e.status === 401);
    const { beta: betaId } = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/users.json`, 'utf8')));
    const created = await alpha.dm.create({ members: [betaId], title: 'isolated SDK contract' });
    assert.ok(created.dm?.id);
    const dmId = created.dm.id;
    assert.equal(created.created, true);
    assert.equal((await alpha.dm.find(betaId)).dm.id, dmId);
    const dm = await alpha.dm.get(dmId);
    assert.ok(dm.dm);
    await assert.rejects(outsider.dm.get(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(outsider.dm.accept(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(beta.dm.markAsRead(dmId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await beta.dm.accept(dmId)).success, true);
    await assert.rejects(beta.dm.updateRoom(dmId, { title: 'not host' }), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await alpha.dm.updateRoom(dmId, { title: 'renamed SDK DM' })).dm.title, 'renamed SDK DM');
    const sent = await alpha.dm.sendMessage(dmId, { content: 'live SDK message' });
    assert.equal(sent.message.content, 'live SDK message');
    await assert.rejects(alpha.dm.sendMessage(dmId, { content: '' }), e => e instanceof NyaitterError && e.status >= 400);
    const counts = await beta.dm.getUnreadCounts();
    assert.ok(counts.unread_by_dm[dmId] > 0);
    assert.equal((await beta.dm.getUnreadCount()).unread_count, counts.unread_total);
    await assert.rejects(beta.dm.editMessage(dmId, sent.message.id, { content: 'not author' }), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(alpha.dm.editMessage(dmId, sent.message.id, { content: '' }), e => e instanceof NyaitterError && e.status === 400);
    const edited = await alpha.dm.editMessage(dmId, sent.message.id, { content: 'edited SDK message' });
    assert.equal(edited.success, true);
    assert.equal(edited.message.content, 'edited SDK message');
    const unchanged = await beta.dm.get(dmId, { markRead: false });
    assert.equal(unchanged.dm[0].post.find(row => row.id === sent.message.id).content, 'edited SDK message');
    assert.equal((await beta.dm.getUnreadCounts()).unread_by_dm[dmId], counts.unread_by_dm[dmId]);
    await assert.rejects(outsider.dm.get(dmId, { markRead: true }), e => e instanceof NyaitterError && e.status === 403);
    const read = await beta.dm.get(dmId, { markRead: true });
    assert.equal(read.dm[0].unread_count, 0);
    assert.equal((await beta.dm.getUnreadCounts()).unread_by_dm[dmId], 0);
    assert.equal((await beta.dm.getUnreadCount()).unread_count, 0);
    await alpha.dm.sendMessage(dmId, { content: 'unread after get' });
    assert.ok((await beta.dm.getUnreadCounts()).unread_by_dm[dmId] > 0);
    await assert.rejects(outsider.dm.markAsRead(dmId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await beta.dm.markAsRead(dmId)).success, true);
    assert.equal((await beta.dm.getUnreadCounts()).unread_by_dm[dmId], 0);
    await assert.rejects(beta.dm.delete(dmId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await beta.dm.leave(dmId)).success, true);
    await assert.rejects(beta.dm.get(dmId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await alpha.dm.delete(dmId)).success, true);
    await assert.rejects(alpha.dm.get(dmId), e => e instanceof NyaitterError && e.status === 404);
  });

  await t.test('DM keys and invitation decline use isolated authenticated state', async () => {
    const { alpha: alphaId, beta: betaId, outsider: outsiderId } = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/users.json`, 'utf8')));
    await assert.rejects(anonymous.dm.getKeys([alphaId]), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(anonymous.dm.setKey('public-key-fixture'), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.dm.setKey('short'), e => e instanceof NyaitterError && e.status === 400);
    assert.deepEqual((await alpha.dm.getKeys([alphaId, betaId])).keys, {});
    assert.equal((await alpha.dm.setKey('public-key-fixture-alpha')).success, true);
    assert.equal((await beta.dm.setKey('public-key-fixture-beta')).success, true);
    assert.deepEqual((await outsider.dm.getKeys([alphaId, betaId])).keys, { [alphaId]: 'public-key-fixture-alpha', [betaId]: 'public-key-fixture-beta' });
    assert.equal((await alpha.dm.setKey('public-key-fixture-updated')).success, true);
    assert.deepEqual((await beta.dm.getKeys(String(alphaId))).keys, { [alphaId]: 'public-key-fixture-updated' });

    const dmId = (await alpha.dm.create({ members: [outsiderId], title: 'decline fixture' })).dm.id;
    assert.equal((await outsider.dm.get(dmId, { markRead: true })).dm[0].is_pending, true);
    await assert.rejects(anonymous.dm.decline(dmId), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(outsider.dm.decline('missing-dm'), e => e instanceof NyaitterError && e.status === 404);
    await assert.rejects(alpha.dm.decline(dmId), e => e instanceof NyaitterError && e.status === 400);
    assert.equal((await outsider.dm.decline(dmId)).success, true);
    assert.ok(!(await alpha.dm.get(dmId)).dm[0].member.includes(outsiderId));
    assert.ok(!(await outsider.dm.list()).dm.some(dm => dm.id === dmId));
    await assert.rejects(outsider.dm.get(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(outsider.dm.accept(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(outsider.dm.decline(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(outsider.dm.markAsRead(dmId), e => e instanceof NyaitterError && e.status === 403);
    await assert.rejects(outsider.dm.sendMessage(dmId, { content: 'excluded' }), e => e instanceof NyaitterError && e.status === 403);
    assert.ok((await alpha.dm.updateRoom(dmId, { members: [alphaId, outsiderId] })).dm.member.includes(outsiderId));
    assert.equal((await outsider.dm.get(dmId)).dm[0].is_pending, true);
    await assert.rejects(outsider.dm.markAsRead(dmId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await outsider.dm.accept(dmId)).success, true);
    assert.equal((await outsider.dm.get(dmId)).dm[0].is_pending, false);
    assert.equal((await outsider.dm.markAsRead(dmId)).success, true);
    await assert.rejects(outsider.dm.decline(dmId), e => e instanceof NyaitterError && e.status === 400);
    assert.equal((await alpha.dm.delete(dmId)).success, true);
  });

  await t.test('Spaces routes enforce owner/member permissions and persist channel messages', async () => {
    await assert.rejects(alpha.spaces.create({ name: '', visibility: 'public' }), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(anonymous.spaces.create({ name: 'anonymous', visibility: 'public' }), e => e instanceof NyaitterError && e.status === 401);
    const created = await alpha.spaces.create({ name: 'SDK live space', visibility: 'public' });
    const spaceId = created.space?.id;
    assert.ok(spaceId);
    assert.equal(created.space.name, 'SDK live space');
    assert.ok((await anonymous.spaces.list()).spaces.some(space => space.id === spaceId));
    assert.equal((await outsider.spaces.get(spaceId)).space.id, spaceId);
    assert.ok(Array.isArray((await outsider.spaces.getMembers(spaceId)).members));
    const mine = await alpha.spaces.getMine();
    assert.ok(mine.spaces.some(space => space.id === spaceId));
    const ice = await anonymous.spaces.getIceServers();
    assert.ok(Array.isArray(ice.ice_servers));
    await assert.rejects(outsider.spaces.update(spaceId, { name: 'not owner' }), e => e instanceof NyaitterError && e.status === 403);
    const joined = await beta.spaces.join(spaceId);
    assert.equal(joined.already, false);
    const channels = await alpha.spaces.getChannels(spaceId);
    assert.ok(channels.channels.length > 0, 'space creation initializes a default channel');
    const channelId = channels.channels[0].id;
    const extraChannel = await alpha.spaces.createChannel(spaceId, { name: 'sdk-http-extra', kind: 'text' });
    assert.ok(extraChannel.channel?.id);
    const updatedChannel = await alpha.spaces.updateChannel(spaceId, extraChannel.channel.id, { name: 'sdk-http-renamed', kind: 'text' });
    assert.equal(updatedChannel.channel.name, 'sdk-http-renamed');
    assert.deepEqual(await alpha.spaces.deleteChannel(spaceId, extraChannel.channel.id), { deleted: true });
    await assert.rejects(alpha.spaces.createChannel(spaceId, { name: '', kind: 'text' }), e => e instanceof NyaitterError && e.status === 400);
    const message = await beta.spaces.sendMessage(spaceId, channelId, { content: 'space message persisted' });
    assert.equal(message.message.content, 'space message persisted');
    const messages = await beta.spaces.getMessages(spaceId, channelId);
    assert.ok(messages.messages.some(row => row.id === message.message.id));
    await assert.rejects(outsider.spaces.sendMessage(spaceId, channelId, { content: 'denied' }), e => e instanceof NyaitterError && e.status === 403);
    assert.deepEqual(await beta.spaces.deleteMessage(spaceId, message.message.id), { deleted: true });
    assert.equal((await beta.spaces.leave(spaceId)).removed, true);
    await assert.rejects(alpha.spaces.leave(spaceId), e => e instanceof NyaitterError && e.status === 409);
    assert.equal((await beta.spaces.join(spaceId)).already, false);
    assert.equal((await beta.spaces.join(spaceId)).already, true);
    assert.deepEqual(await alpha.spaces.delete(spaceId), { deleted: true });
  });

  await t.test('Groups initialize roles, enforce owner permissions, and deliver invite notifications', async () => {
    await assert.rejects(alpha.groups.create({ name: '' }), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(anonymous.groups.create({ name: 'anonymous' }), e => e instanceof NyaitterError && e.status === 401);
    const created = await alpha.groups.create({ name: 'SDK live group', description: 'isolated' });
    const groupId = created.group?.id;
    assert.ok(groupId);
    assert.equal(created.group.name, 'SDK live group');
    assert.ok((await alpha.groups.list()).groups.some(group => group.id === groupId));
    assert.equal((await outsider.groups.get(groupId)).group.id, groupId);
    assert.ok((await alpha.groups.listMine()).groups.some(group => group.id === groupId));
    const roles = await alpha.groups.getRoles(groupId);
    assert.ok(roles.roles.some(role => role.is_system), 'group creation initializes system roles');
    const customRole = await alpha.groups.createRole(groupId, { name: 'HTTP test role', permissions: ['invite'], sortOrder: 25 });
    assert.equal(customRole.role.name, 'HTTP test role');
    const changedRole = await alpha.groups.updateRole(groupId, customRole.role.id, { name: 'HTTP renamed role', permissions: ['invite'], sortOrder: 26 });
    assert.equal(changedRole.role.name, 'HTTP renamed role');
    assert.equal((await alpha.groups.deleteRole(groupId, customRole.role.id)).success, true);
    const joined = await beta.groups.join(groupId);
    assert.equal(joined.joined, true);
    await assert.rejects(beta.groups.update(groupId, { description: 'not owner' }), e => e instanceof NyaitterError && e.status === 403);
    const invite = await alpha.groups.invite(groupId, (await outsider.getMe()).user.id);
    assert.ok(invite.invite?.id);
    const pendingInvites = await outsider.groups.getInvitesMine();
    assert.ok(pendingInvites.invites.some(row => row.invite?.id === invite.invite.id || row.id === invite.invite.id));
    const inviteResponse = await outsider.groups.respondInvite(invite.invite.id, 'accept');
    assert.equal(inviteResponse.success, true);
    const outsiderId = (await outsider.getMe()).user.id;
    assert.ok((await outsider.groups.getMembers(groupId)).members.some(row => Number(row.user?.id ?? row.membership?.user_id) === Number(outsiderId)));
    const outsiderNotifications = await outsider.notifications.list();
    const groupInvite = outsiderNotifications.notifications.find(row => row.type === 'group_invite');
    assert.ok(groupInvite, 'group invite should asynchronously create a recipient notification');
    assert.ok(outsiderNotifications.notification_unread_count >= 1);
    await assert.rejects(anonymous.notifications.list(), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.notifications.markAsRead(groupInvite.id), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await outsider.notifications.markAsRead(groupInvite.id)).success, true);
    const clicked = await outsider.notifications.markAsClicked(groupInvite.id);
    assert.equal(clicked.clicked, true);
    const unread = await outsider.notifications.getUnreadCount();
    assert.ok(typeof unread.unread_count === 'number');
    await assert.rejects(alpha.notifications.create({ recipientId: 0, type: 'unknown' }), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(alpha.notifications.create({ recipientId: (await outsider.getMe()).user.id, type: 'group_invite' }), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await outsider.notifications.markAllAsRead()).success, true);
    assert.equal((await outsider.notifications.markAllAsClicked()).success, true);
    assert.equal((await outsider.notifications.delete(groupInvite.id)).success, true);
    assert.equal((await alpha.groups.delete(groupId)).success, true);
  });

  await t.test('Notes create/list/reject/delete use persisted in-memory state and actual eligibility rules', async () => {
    await assert.rejects(anonymous.notes.getReasonTags(), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.notes.getReasonTags({ side: 'invalid' }), e => e instanceof NyaitterError && e.status === 400);
    const post = await alpha.posts.create({ content: 'SDK live note target post' });
    let postId;
    for (let i = 0; i < 30 && !postId; i++) {
      const result = await alpha.posts.list({ tab: 'all' });
      postId = result.posts?.find(row => row.content === 'SDK live note target post')?.id;
      if (!postId) await sleep(50);
    }
    assert.ok(postId, 'note target post must complete its asynchronous creation');
    const tags = await beta.notes.getReasonTags({ side: 'create' });
    assert.ok(Array.isArray(tags.tags));
    await assert.rejects(beta.notes.create(postId, { content: '' }), e => e instanceof NyaitterError && e.status === 400);
    const created = await beta.notes.create(postId, { content: 'A persisted community note', sources: ['https://example.test/source'] });
    const noteId = created.note?.id;
    assert.ok(noteId);
    assert.equal(created.note.content, 'A persisted community note');
    const listed = await beta.notes.list(postId);
    assert.ok(listed.notes.some(note => note.id === noteId));
    const bulk = await beta.notes.listForPosts([postId, 999999]);
    assert.ok(bulk.notes_by_post[postId]?.notes.some(note => note.id === noteId), 'bulk list returns the same note as the per-post list');
    assert.deepEqual(bulk.missing_post_ids, [999999]);
    await assert.rejects(anonymous.notes.listForPosts([postId]), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(beta.notes.listForPosts([]), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(beta.notes.rate(noteId, { helpful: true }), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(outsider.notes.delete(noteId), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await beta.notes.delete(noteId)).success, true);
  });

  await t.test('polls, ranking, rules, oEmbed, and URL cards run against real routes', async () => {
    const pollPost = await alpha.posts.create({
      content: 'SDK live poll post',
      attachments: [{ type: 'poll', title: 'SDK live poll', options: [{ text: 'first' }, { text: 'second' }] }],
    });
    assert.equal(pollPost.queued, true);
    let pollPostId;
    let poll;
    for (let i = 0; i < 40 && !poll; i++) {
      const result = await alpha.posts.list({ tab: 'all', limit: 50 });
      const row = result.posts?.find(post => post.content === 'SDK live poll post');
      pollPostId = row?.id;
      poll = row?.poll;
      if (!poll) await sleep(50);
    }
    assert.ok(pollPostId && poll?.id, 'queued poll post should expose its poll attachment');

    await assert.rejects(anonymous.polls.get('missing-poll-id'), e => e instanceof NyaitterError && e.status === 404);
    await assert.rejects(alpha.polls.get('invalid id!'), e => e instanceof NyaitterError && e.status === 400);
    const fetched = await anonymous.polls.get(poll.id);
    assert.equal(String(fetched.poll.id), String(poll.id));
    assert.equal(fetched.poll.options.length, 2);

    await assert.rejects(anonymous.polls.vote(poll.id, { optionIds: [1] }), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(alpha.polls.vote(poll.id, { optionIds: [] }), e => e instanceof NyaitterError && e.status === 400);
    const voted = await alpha.polls.vote(poll.id, { optionIds: [1] });
    assert.equal(voted.poll.total_votes, 1);
    assert.equal(voted.poll.has_voted, true);
    assert.deepEqual(voted.poll.my_votes, [1]);
    const reread = await alpha.polls.get(poll.id);
    assert.equal(reread.poll.options[0].votes_count, 1, 'vote is persisted in the in-memory poll state');
    await assert.rejects(alpha.polls.vote('missing-poll-id', { optionIds: [1] }), e => e instanceof NyaitterError && e.status === 400);

    await assert.rejects(anonymous.ranking.getMe(), e => e instanceof NyaitterError && e.status === 401);
    const myRanks = await alpha.ranking.getMe();
    for (const key of ['followers', 'posts', 'likes', 'stars']) assert.ok(myRanks[key] && typeof myRanks[key] === 'object');
    const followers = await anonymous.ranking.getFollowers({ limit: 5 });
    assert.ok(Array.isArray(followers.data));
    const posts = await anonymous.ranking.getPosts({ limit: 5 });
    assert.ok(Array.isArray(posts.data));
    const likes = await anonymous.ranking.getLikes({ limit: 5 });
    assert.ok(Array.isArray(likes.data));
    const stars = await anonymous.ranking.getStars({ limit: 5 });
    assert.ok(Array.isArray(stars.data));
    await assert.rejects(anonymous.ranking.get('unknown'), e => e instanceof NyaitterError && e.status === 400);

    const rules = await anonymous.rules.get();
    assert.equal(rules.success, true);
    assert.equal(typeof rules.rules, 'string');
    assert.equal(typeof rules.updated_at, 'string');
    assert.deepEqual(await anonymous.system.getRules(), rules);

    await assert.rejects(anonymous.oembed.get(''), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(anonymous.oembed.get('https://nyaitter.test/posts/987654321'), e => e instanceof NyaitterError && e.status === 404);
    const oembed = await anonymous.oembed.get(`https://nyaitter.test/posts/${pollPostId}`, { maxWidth: 320, maxHeight: 200 });
    assert.equal(oembed.type, 'rich');
    assert.equal(typeof oembed.html, 'string');
    assert.equal(oembed.provider_name, 'Nyaitter');

    assert.equal((await anonymous.urlCards.get('https://example.test/article')).card.title, 'isolated fixture card');
    assert.equal((await alpha.urlCards.get('')).card, null);
  });

  await t.test('push subscription routes require a session principal and validate same-origin input', async () => {
    await assert.rejects(anonymous.push.getConfig(), e => e instanceof NyaitterError && e.status === 401);
    const config = await alpha.push.getConfig();
    assert.equal(config.enabled, true);
    assert.equal(typeof config.vapid_public_key, 'string');
    assert.equal(typeof config.subscription_count, 'number');
    await assert.rejects(alpha.push.subscribe({ subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'short', auth: 'short' } } }),
      e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(alpha.push.unsubscribe('https://example.test/not-a-push-endpoint'),
      e => e instanceof NyaitterError && e.status === 400);
    const endpoint = `https://fcm.googleapis.com/fcm/send/sdk-live-${Date.now()}`;
    const subscription = {
      endpoint,
      expirationTime: null,
      keys: { p256dh: 'A'.repeat(64), auth: 'B'.repeat(24) },
    };
    assert.deepEqual(await alpha.push.subscribe({ subscription }), { success: true });
    const subscribed = await alpha.push.getConfig();
    assert.equal(subscribed.subscription_count, config.subscription_count + 1);
    assert.deepEqual(await alpha.push.unsubscribe(endpoint), { success: true });
    assert.equal((await alpha.push.getConfig()).subscription_count, config.subscription_count);
  });

  await t.test('uploads, imposters, verification, and appeals routes run against real routes', async () => {
    const { alpha: alphaId, beta: betaId } = JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(`${scratchRoot}/users.json`, 'utf8')));
    const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

    await assert.rejects(anonymous.uploads.getStorage(), e => e instanceof NyaitterError && e.status === 401);
    const storage = await alpha.uploads.getStorage();
    assert.equal(typeof storage.limit_bytes, 'number');
    assert.ok(Array.isArray(storage.files));
    await assert.rejects(alpha.uploads.prepare({}), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(alpha.uploads.upload({ file: pngBytes }), e => e instanceof NyaitterError && e.status === 400);
    const uploaded = await alpha.uploads.upload({ file: pngBytes, fileName: 'sdk-live.png', contentType: 'image/png' });
    assert.ok(uploaded.id, 'upload returns the stored file id');
    const afterUpload = await alpha.uploads.getStorage();
    assert.ok(afterUpload.files.some(file => file.id === uploaded.id), 'uploaded file appears in the storage inventory');
    assert.ok(afterUpload.used_bytes >= afterUpload.files.find(file => file.id === uploaded.id).size);
    const prepared = await alpha.uploads.prepare({ fileName: 'sdk-live-direct.png', contentType: 'image/png' });
    assert.ok(prepared.id);
    const direct = await alpha.uploads.uploadPartResponse(prepared.id, pngBytes, { contentType: 'image/png' });
    assert.equal(direct.ok, true);
    assert.deepEqual(await alpha.uploads.delete({ fileIds: [uploaded.id] }), { success: true, deleted_count: 1 });
    await assert.rejects(alpha.uploads.delete({ fileIds: [] }), e => e instanceof NyaitterError && e.status === 400);
    await assert.rejects(alpha.uploads.delete({ fileIds: ['attachments/1/not-own.png'] }), e => e instanceof NyaitterError && e.status === 403);

    await assert.rejects(anonymous.imposters.list(), e => e instanceof NyaitterError && e.status === 401);
    const imposterList = await alpha.imposters.list();
    assert.ok(Array.isArray(imposterList.imposters));
    const imposter = await alpha.imposters.create({ name: 'SDK live imposter' });
    assert.ok(imposter.imposter?.id);
    const imposterId = imposter.imposter.id;
    assert.ok((await alpha.imposters.list()).imposters.some(row => row.id === imposterId));
    const withMember = await alpha.imposters.addMember(imposterId, { userId: betaId, role: 'operator' });
    assert.ok(withMember.imposter);
    const promoted = await alpha.imposters.updateMemberRole(imposterId, betaId, { role: 'manager' });
    assert.ok(promoted.imposter);
    assert.ok((await alpha.imposters.removeMember(imposterId, betaId)).imposter);
    assert.equal((await alpha.imposters.delete(imposterId)).success, true);
    await assert.rejects(beta.imposters.delete(imposterId), e => e instanceof NyaitterError && e.status >= 400);
    assert.ok(alphaId > 0);

    await assert.rejects(anonymous.verification.getStatus(), e => e instanceof NyaitterError && e.status === 401);
    assert.equal((await outsider.verification.getStatus()).application, null);
    const application = await outsider.verification.apply();
    assert.equal(application.application.status, 'assigned');
    assert.equal((await outsider.verification.getStatus()).application.id, application.application.id);
    await assert.rejects(outsider.verification.apply(), e => e instanceof NyaitterError && e.status === 400);

    await assert.rejects(anonymous.appeals.getStatus(), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(beta.appeals.getStatus(), e => e instanceof NyaitterError && e.status === 403);
    assert.equal((await admin.users.updateUser(betaId, { freeze: true })).user.freeze !== undefined, true);
    const appealStatus = await beta.appeals.getStatus();
    assert.equal(appealStatus.appeal, null);
    await assert.rejects(beta.appeals.create({ description: '' }), e => e instanceof NyaitterError && e.status === 400);
    const appeal = await beta.appeals.create({ description: 'isolated HTTP freeze appeal' });
    assert.equal(appeal.appeal.status, 'assigned');
    assert.equal((await beta.appeals.getStatus()).appeal.id, appeal.appeal.id);
    await assert.rejects(beta.appeals.create({ description: 'duplicate isolated appeal' }), e => e instanceof NyaitterError && e.status === 400);
    await admin.users.updateUser(betaId, { freeze: false });
  });

  await t.test('call stage routes create, expose, and update real in-memory stage state', async () => {
    await assert.rejects(anonymous.calls.createStage({ name: 'anonymous stage' }), e => e instanceof NyaitterError && e.status === 401);
    const created = await alpha.calls.createStage({ name: 'SDK live call stage', allowGuestJoin: true });
    const stageId = created.stage?.id;
    assert.ok(stageId);
    assert.equal(created.stage.status, 'live');
    assert.ok((await anonymous.calls.listStages({ query: 'SDK live call stage' })).stages.some(row => row.id === stageId));
    const info = await anonymous.calls.getStage(stageId);
    assert.equal(info.stage.id, stageId);
    assert.equal(info.guest, true);
    assert.ok(Array.isArray(alpha.calls.getIceConfig(info).iceServers));
    await assert.rejects(beta.calls.updateStage(stageId, { status: 'ended' }), e => e instanceof NyaitterError && e.status === 403);
    const updated = await alpha.calls.updateStage(stageId, { status: 'ended' });
    assert.equal(updated.stage.status, 'ended');
    assert.equal((await anonymous.calls.deleteGuestSession()).ok, true);
  });

  await t.test('account deletion immediately invalidates every session for only that account', async () => {
    await assert.rejects(anonymous.users.prepareAccountDeletion(), e => e instanceof NyaitterError && e.status === 401);
    const prepared = await outsider.users.prepareAccountDeletion();
    assert.ok(prepared.confirmation_token);
    await assert.rejects(outsider.users.deleteAccount('invalid-confirmation'), e => e instanceof NyaitterError && e.status === 400);
    assert.ok((await outsider.getMe()).user?.id, 'failed deletion must not invalidate the account');
    assert.equal((await outsider.users.deleteAccount(prepared.confirmation_token)).success, true);
    await assert.rejects(outsider.getMe(), e => e instanceof NyaitterError && e.status === 401);
    await assert.rejects(new NyaitterClient({ baseUrl: baseUrl(), token: tokens.outsiderOther }).getMe(), e => e instanceof NyaitterError && e.status === 401);
    assert.ok((await beta.getMe()).user?.id, 'another account must remain authenticated');
  });
});
