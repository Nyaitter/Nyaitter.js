import test from 'node:test';
import assert from 'node:assert/strict';
import { NyaitterClient } from '../src/NyaitterClient.js';

function makeRealtime() {
  const client = new NyaitterClient({
    baseUrl: 'https://example.invalid/api',
    fetch: async () => new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });
  const realtime = client.realtime();
  const sent = [];
  realtime._ws = { readyState: 1, send: (payload) => sent.push(JSON.parse(payload)) };
  return { realtime, sent };
}

test('space sending methods produce the exact Server WS message shapes', () => {
  const { realtime, sent } = makeRealtime();
  realtime.subscribeSpace(42);
  realtime.joinSpaceVoice({ spaceId: 42, channelId: 'ch-1', muted: true });
  realtime.setSpaceVoiceState({ spaceId: 42, channelId: 'ch-1', deafened: true });
  realtime.sendSpaceSignal({ spaceId: 42, channelId: 'ch-1', toUserId: '7', data: { candidate: 'x' } });
  realtime.leaveSpaceVoice({ spaceId: 42, channelId: 'ch-1' });
  realtime.unsubscribeSpace(42);
  assert.deepEqual(sent, [
    { type: 'space:subscribe', spaceId: '42' },
    { type: 'space:join_voice', spaceId: '42', channelId: 'ch-1', muted: true, deafened: false },
    { type: 'space:voice_state', spaceId: '42', channelId: 'ch-1', deafened: true },
    { type: 'space:signal', spaceId: '42', channelId: 'ch-1', toUserId: 7, data: { candidate: 'x' } },
    { type: 'space:leave_voice', spaceId: '42', channelId: 'ch-1' },
    { type: 'space:unsubscribe', spaceId: '42' },
  ]);
  assert.deepEqual(realtime.spaceSubscriptions, []);
});

test('space inbound events are normalized and also emitted on the generic space channel', () => {
  const { realtime } = makeRealtime();
  const seen = [];
  realtime.on('spaceMessage', (e) => seen.push(['spaceMessage', e]));
  realtime.on('spaceMessageDeleted', (e) => seen.push(['spaceMessageDeleted', e]));
  realtime.on('spaceDeleted', (e) => seen.push(['spaceDeleted', e]));
  realtime.on('spaceMemberLeft', (e) => seen.push(['spaceMemberLeft', e]));
  realtime.on('spaceSignal', (e) => seen.push(['spaceSignal', e]));
  realtime.on('spaceVoiceRoster', (e) => seen.push(['spaceVoiceRoster', e]));
  realtime.on('space', (e) => seen.push(['space', e.type]));

  realtime._handleMessage(JSON.stringify({ type: 'space_message', space_id: 42, channel_id: 5, message: { id: 1, content: 'hi' }, user: { id: 7 } }));
  realtime._handleMessage(JSON.stringify({ type: 'space_message_deleted', space_id: 42, channel_id: 5, message_id: 9 }));
  realtime._handleMessage(JSON.stringify({ type: 'space_deleted', space_id: 42 }));
  realtime._handleMessage(JSON.stringify({ type: 'space_member_left', space_id: 42, user_id: 7 }));
  realtime._handleMessage(JSON.stringify({ type: 'space_signal', space_id: 42, channel_id: 5, from_user_id: 7, data: { description: 'sdp' } }));
  realtime._handleMessage(JSON.stringify({ type: 'space_voice_roster', space_id: 42, channel_id: 5, roster: [{ user_id: 7, muted: false, deafened: false, joined_at: 't' }], joined_user_id: 7 }));

  assert.deepEqual(seen.filter(([name]) => name !== 'space'), [
    ['spaceMessage', { spaceId: 42, channelId: 5, message: { id: 1, content: 'hi' }, user: { id: 7 } }],
    ['spaceMessageDeleted', { spaceId: 42, channelId: 5, messageId: 9 }],
    ['spaceDeleted', { spaceId: 42 }],
    ['spaceMemberLeft', { spaceId: 42, userId: 7 }],
    ['spaceSignal', { spaceId: 42, channelId: 5, fromUserId: 7, data: { description: 'sdp' } }],
    ['spaceVoiceRoster', { spaceId: 42, channelId: 5, roster: [{ user_id: 7, muted: false, deafened: false, joined_at: 't' }], joinedUserId: 7, leftUserId: null }],
  ]);
  assert.equal(seen.filter(([name]) => name === 'space').length, 6);
});

test('dm_read and poll_updated dispatch to typed events', () => {
  const { realtime } = makeRealtime();
  const seen = [];
  realtime.on('dmRead', (e) => seen.push(['dmRead', e]));
  realtime.on('pollUpdated', (e) => seen.push(['pollUpdated', e]));
  realtime._handleMessage(JSON.stringify({ type: 'dm_read', dm_id: 'dm-1', reader_id: 7 }));
  realtime._handleMessage(JSON.stringify({ type: 'poll_updated', poll_id: 3, post_id: 11, poll: { id: 3 } }));
  assert.deepEqual(seen, [
    ['dmRead', { dmId: 'dm-1', readerId: 7 }],
    ['pollUpdated', { pollId: 3, postId: 11, poll: { id: 3 } }],
  ]);
});

test('call chat delete/clear have typed events and sending methods', () => {
  const { realtime, sent } = makeRealtime();
  const seen = [];
  realtime.on('callChatDelete', (e) => seen.push(['callChatDelete', e.id]));
  realtime.on('callChatClear', (e) => seen.push(['callChatClear', e.type]));
  realtime.on('call', (e) => seen.push(['call', e.type]));

  realtime.joinCall({ kind: 'stage', id: 'stage-1' });
  realtime.deleteCallChatMessage({ messageId: 'msg-9' });
  realtime.clearCallChat();
  assert.deepEqual(sent.slice(1), [
    { type: 'call:chat-delete', kind: 'stage', id: 'stage-1', message_id: 'msg-9' },
    { type: 'call:chat-clear', kind: 'stage', id: 'stage-1' },
  ]);

  realtime._handleMessage(JSON.stringify({ type: 'call:chat-delete', room: 'stage:stage-1', id: 'msg-9' }));
  realtime._handleMessage(JSON.stringify({ type: 'call:chat-clear', room: 'stage:stage-1' }));
  assert.deepEqual(seen, [
    ['callChatDelete', 'msg-9'], ['call', 'call:chat-delete'],
    ['callChatClear', 'call:chat-clear'], ['call', 'call:chat-clear'],
  ]);
});
