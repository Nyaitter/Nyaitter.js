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
   * @param {number}  [options.reconnectDelayMs=3000] - 再接続までの待機時間（ミリ秒）
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
      const url = `${base}/server/api/realtime`;

      const ws = new WebSocket(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      this._ws = ws;

      ws.addEventListener('open', () => {
        this._startPing();
        this._emit('open');
        resolve();
      });

      ws.addEventListener('message', (event) => {
        this._handleMessage(event.data);
      });

      ws.addEventListener('close', () => {
        this._stopPing();
        this._emit('close');
        if (this._shouldReconnect) {
          this._reconnectTimer = setTimeout(() => this._connect(), this._reconnectDelayMs);
        }
      });

      ws.addEventListener('error', (err) => {
        this._emit('error', err);
        reject(err);
      });
    });
  }

  /** @internal */
  _handleMessage(raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
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

      // pong はライブラリが内部で処理するだけ（ユーザーには公開しない）
      case 'pong':
        break;
    }
  }

  /** @internal */
  _startPing() {
    this._pingInterval = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
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
    return this._ws?.readyState === WebSocket.OPEN;
  }
}
