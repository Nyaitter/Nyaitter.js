/**
 * RealtimeClient - WebSocket でサーバーからのリアルタイムイベントを受け取ります。
 *
 * @example
 * const realtime = client.realtime();
 *
 * realtime.on('notification', (notification) => {
 *   console.log('新着通知:', notification);
 * });
 *
 * realtime.on('dm', ({ dmId, message }) => {
 *   console.log(`DM (${dmId}):`, message.content);
 * });
 *
 * realtime.on('timelinePost', ({ postId }) => {
 *   console.log('フォロー中タイムラインに新着:', postId);
 * });
 *
 * await realtime.connect();
 * // 切断するときは realtime.disconnect()
 */

/**
 * サーバーの `call:*` メッセージ種別をクライアント側イベント名へ変換します。
 * @type {Record<string, string>}
 */
const CALL_EVENTS = {
  'call:joined': 'callJoined',
  'call:watching': 'callWatching',
  'call:roster': 'callRoster',
  'call:signal': 'callSignal',
  'call:state': 'callState',
  'call:moderated': 'callModerated',
  'call:kicked': 'callKicked',
  'call:screen': 'callScreen',
  'call:ended': 'callEnded',
  'call:stage': 'callStage',
  'call:error': 'callError',
  'call:chat': 'callChat',
  'call:transcript': 'callTranscript',
};

export class RealtimeClient {
  /**
   * @param {import('./NyaitterClient.js').NyaitterClient} client
   */
  constructor(client) {
    this._client = client;
    this._ws = null;
    this._listeners = new Map();
    this._pingInterval = null;
    this._reconnectTimer = null;
    this._shouldReconnect = false;
    this._callRoom = null;
  }

  /**
   * イベントリスナーを登録します。
   *
   * イベント一覧：
   * - `'notification'`  — 新着通知 `(notification: object) => void`
   * - `'notificationUnreadCount'` — 通知未読数の更新 `(count: number) => void`
   * - `'dm'`            — DM 新着メッセージ `({ dmId, message, sender }) => void`
   * - `'dmUnreadCount'` — DM 未読数の更新 `(count: number) => void`
   * - `'timelinePost'`  — フォロー中タイムラインの新着 `({ postId, authorId }) => void`
   * - `'call'`          — 通話系イベント全般（サーバーの `call:*` 生ペイロード） `(payload: object) => void`
   * - `'callJoined'`    — 通話に参加した `({ room, role, roster, owner_id, request_id }) => void`
   * - `'callWatching'`  — 予約ステージの待機に入った `({ room }) => void`
   * - `'callRoster'`    — 参加者一覧の更新 `({ room, roster }) => void`
   * - `'callSignal'`    — WebRTC シグナル `({ room, from, data }) => void`
   * - `'callState'`     — 通話状態の変化 `(payload) => void`
   * - `'callModerated'` — ホストによる操作を受けた `({ room, action }) => void`
   * - `'callKicked'`    — ステージから追放された `({ room, message }) => void`
   * - `'callScreen'`    — 画面共有の開始・終了 `({ room, user_id, active, stream_id, label }) => void`
   * - `'callEnded'`     — 通話が終了・退出になった `({ room, message }) => void`
   * - `'callStage'`     — ステージ状態の更新 `({ room, status }) => void`
   * - `'callError'`     — 通話操作のエラー `({ request_id, message }) => void`
   * - `'callChat'`      — 通話チャット `({ room, user_id, name, text, at }) => void`
   * - `'callTranscript'`— 文字起こし `({ room, user_id, name, text, at }) => void`
   * - `'open'`          — 接続完了 `() => void`
   * - `'close'`         — 切断 `() => void`
   * - `'error'`         — エラー `(error: Event) => void`
   *
   * @param {string} event - イベント名
   * @param {Function} handler - コールバック関数
   * @returns {this} メソッドチェーン可
   *
   * @example
   * realtime.on('notification', (n) => console.log(n));
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  /**
   * イベントリスナーを解除します。
   *
   * @param {string} event - イベント名
   * @param {Function} handler - 登録時と同じコールバック関数
   * @returns {this}
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    return this;
  }

  /** @internal */
  _emit(event, data) {
    for (const handler of this._listeners.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[NyaitterRealtime] '${event}' ハンドラーでエラー:`, err);
      }
    }
  }

  /**
   * WebSocket に接続します。
   * 接続が確立すると `'open'` イベントが発火します。
   *
   * @param {object} [options]
   * @param {boolean} [options.autoReconnect=true] - 切断時に自動再接続するか
   * @param {number}  [options.reconnectDelayMs=3000] - 再接続までの待機時間
   * @returns {Promise<void>} 接続完了で resolve
   */
  connect({ autoReconnect = true, reconnectDelayMs = 3000 } = {}) {
    this._shouldReconnect = autoReconnect;
    this._reconnectDelayMs = reconnectDelayMs;
    return this._connect();
  }

  /** @internal */
  _connect() {
    return new Promise((resolve, reject) => {
      const base = this._client._baseUrl.replace(/^http/, 'ws');
      const token = this._client.getToken();
      const url = `${base}/realtime`;

      const WSClass = this._client._WebSocket || globalThis.WebSocket;
      if (!WSClass) {
        throw new Error('WebSocket 実装が見つかりません。globalThis.WebSocket または client オプションに WebSocket を渡してください。');
      }

      // ブラウザ標準WebSocketの第2引数はプロトコル配列であり、Node.js wsの
      // headersオプションは受け付けない。ブラウザではCookie認証を利用する。
      const isBrowserWebSocket = typeof globalThis.WebSocket === 'function'
        && WSClass === globalThis.WebSocket;
      const wsOptions = token && !isBrowserWebSocket
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;
      const ws = wsOptions ? new WSClass(url, wsOptions) : new WSClass(url);
      this._ws = ws;

      const onOpen = () => {
        this._startPing();
        this._emit('open');
        resolve();
      };

      const onMessage = (event) => {
        const raw = typeof event === 'string' ? event : (event?.data ?? event);
        this._handleMessage(raw);
      };

      const onClose = () => {
        this._stopPing();
        this._emit('close');
        if (this._shouldReconnect) {
          this._reconnectTimer = setTimeout(() => this._connect(), this._reconnectDelayMs);
        }
      };

      const onError = (err) => {
        this._emit('error', err);
        reject(err);
      };

      if (typeof ws.addEventListener === 'function') {
        ws.addEventListener('open', onOpen);
        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
        ws.addEventListener('error', onError);
      } else if (typeof ws.on === 'function') {
        ws.on('open', onOpen);
        ws.on('message', (data) => onMessage({ data: data.toString() }));
        ws.on('close', onClose);
        ws.on('error', onError);
      }
    });
  }

  /** @internal */
  _handleMessage(raw) {
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString());
    } catch {
      return;
    }

    this._emit('raw', data);

    // call:* は種別ごとのイベントと汎用 'call' の両方へ流す
    if (typeof data?.type === 'string' && data.type.startsWith('call:')) {
      const event = CALL_EVENTS[data.type];
      if (event) this._emit(event, data);
      this._emit('call', data);
      return;
    }

    switch (data.type) {
      case 'notification_new':
        this._emit('notification', data.notification);
        this._emit('notificationUnreadCount', data.unread_count);
        break;

      case 'notification_unread_count':
        this._emit('notificationUnreadCount', data.unread_count);
        break;

      case 'dm_message':
        this._emit('dm', {
          dmId: data.dm_id,
          message: data.message,
          sender: data.sender ?? null,
        });
        break;

      case 'dm_unread_count':
        this._emit('dmUnreadCount', data.unread_count);
        break;

      case 'timeline_post':
        this._emit('timelinePost', {
          postId: data.post_id,
          authorId: data.author_id,
        });
        break;

      // pong はライブラリが内部で処理するだけ
      case 'pong':
        break;
    }
  }

  /** @internal */
  _startPing() {
    this._pingInterval = setInterval(() => {
      if (this._ws?.readyState === 1) {
        this._ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  /** @internal */
  _stopPing() {
    clearInterval(this._pingInterval);
    this._pingInterval = null;
  }

  /**
   * WebSocket を切断します。
   * 自動再接続も停止します。
   */
  disconnect() {
    this._shouldReconnect = false;
    clearTimeout(this._reconnectTimer);
    this._stopPing();
    this._ws?.close();
    this._ws = null;
  }

  /**
   * 現在接続中かどうかを返します。
   * @returns {boolean}
   */
  get connected() {
    return this._ws?.readyState === 1;
  }

  /**
   * 現在参加中の通話ルームを返します。未参加のときは `null` です。
   * @returns {{ kind: string, id: string|number }|null}
   */
  get callRoom() {
    return this._callRoom;
  }

  /**
   * WebSocket へ生の JSON メッセージを送信します。
   * 通話プロトコル（`call:*`）もこれで送信できます。
   *
   * @param {object} message - `type` を含むメッセージ
   * @throws {Error} 未接続のとき
   *
   * @example
   * realtime.send({ type: 'call:leave' });
   */
  send(message) {
    if (!this.connected) throw new Error('WebSocket が接続されていません。');
    this._ws.send(JSON.stringify(message));
  }

  /** @internal */
  _resolveCallRoom({ kind, id } = {}) {
    const resolvedKind = kind ?? this._callRoom?.kind;
    const resolvedId = id ?? this._callRoom?.id;
    if (!resolvedKind || resolvedId === undefined || resolvedId === null) {
      throw new Error('通話ルームが指定されていません。先に joinCall() などを呼び出してください。');
    }
    return { kind: resolvedKind, id: resolvedId };
  }

  /**
   * 通話（ステージまたは DM）に参加します。
   * 以後の操作はこのルームが既定の対象になります。
   *
   * @param {object} params
   * @param {'stage'|'dm'} params.kind - 通話の種類
   * @param {string|number} params.id - ステージ ID または DM グループ ID
   * @param {string} [params.requestId] - 応答を対応付ける任意の ID
   * @param {boolean} [params.muted] - 初期ミュート状態
   * @param {boolean} [params.camera] - 初期カメラ状態
   *
   * @example
   * realtime.joinCall({ kind: 'dm', id: 'dm_group_id' });
   */
  joinCall({ kind, id, requestId, muted, camera } = {}) {
    if (!kind || id === undefined || id === null) throw new Error('kind と id は必須です。');
    this._callRoom = { kind, id };
    this.send({ type: 'call:join', kind, id, request_id: requestId, muted, camera });
  }

  /**
   * 予約済み（開始前）のステージを待機入りします。
   * ステージが `live` になると自動的に参加扱いになります。
   *
   * @param {string} id - ステージ ID
   * @param {object} [options]
   * @param {string} [options.requestId] - 応答を対応付ける任意の ID
   */
  watchStage(id, { requestId } = {}) {
    this._callRoom = { kind: 'stage', id };
    this.send({ type: 'call:watch', kind: 'stage', id, request_id: requestId });
  }

  /**
   * 通話から退出します。
   */
  leaveCall() {
    this._callRoom = null;
    this.send({ type: 'call:leave' });
  }

  /**
   * 特定の参加者へ WebRTC シグナル（SDP / ICE）を送信します。
   *
   * @param {object} params
   * @param {string|number} params.to - 送信先のユーザー ID
   * @param {object} params.data - `{ description }` または `{ candidate }`
   * @param {string|number} [params.kind] - 対象ルームの種類（既定は参加中のルーム）
   * @param {string|number} [params.id] - 対象ルームの ID（既定は参加中のルーム）
   */
  sendCallSignal({ to, data, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({ type: 'call:signal', ...room, to, data });
  }

  /**
   * 自分のマイク・カメラ・文字起こしの状態を通知します。
   *
   * @param {object} [params]
   * @param {boolean} [params.muted]
   * @param {boolean} [params.camera]
   * @param {boolean} [params.transcriptionEnabled]
   * @param {string|number} [params.kind]
   * @param {string|number} [params.id]
   */
  setCallState({ muted, camera, transcriptionEnabled, transcription_enabled, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({
      type: 'call:state',
      ...room,
      muted,
      camera,
      transcription_enabled: transcriptionEnabled ?? transcription_enabled,
    });
  }

  /**
   * ステージのホストとして参加者を操作します。
   *
   * @param {object} params
   * @param {string|number} params.target - 対象ユーザー ID
   * @param {'mute'|'camera'|'chat'|'kick'|'pin'|'promote'|'demote'} params.action - 操作
   * @param {string|number} [params.kind]
   * @param {string|number} [params.id]
   */
  moderateCall({ target, action, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({ type: 'call:moderate', ...room, target, action });
  }

  /**
   * 画面共有の開始・終了を通知します。
   *
   * @param {object} params
   * @param {boolean} params.active - 共有中かどうか
   * @param {string} [params.streamId] - 共有ストリーム ID（開始時は必須）
   * @param {string|number} [params.kind]
   * @param {string|number} [params.id]
   */
  setCallScreen({ active, streamId, stream_id, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({ type: 'call:screen', ...room, active, stream_id: streamId ?? stream_id });
  }

  /**
   * 通話チャットを送信します。
   *
   * @param {object} params
   * @param {string} params.text - 本文（最大2000文字）
   * @param {string|number} [params.kind]
   * @param {string|number} [params.id]
   */
  sendCallChat({ text, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({ type: 'call:chat', ...room, text });
  }

  /**
   * 文字起こしを送信します（スピーカー・ミュート解除中のみ）。
   *
   * @param {object} params
   * @param {string} params.text - 本文（最大2000文字）
   * @param {string|number} [params.kind]
   * @param {string|number} [params.id]
   */
  sendCallTranscript({ text, kind, id } = {}) {
    const room = this._resolveCallRoom({ kind, id });
    this.send({ type: 'call:transcript', ...room, text });
  }
}
