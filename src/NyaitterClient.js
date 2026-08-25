/**
 * NyaitterClient - Nyaitter API を JavaScript から簡単に使うための統合クライアント
 *
 * Bot トークン (`bot_...`) または NyaitterAuth アクセストークン (`nyauth_...`) を指定して初期化します。
 *
 * @example
 * const client = new NyaitterClient({
 *   baseUrl: 'https://nyaitter.example.com',
 *   token: 'bot_xxxxxxxxxxxxxxxx',
 * });
 *
 * // 投稿する
 * await client.posts.create({ content: 'こんにちは！' });
 */

import { AuthAPI } from './api/AuthAPI.js';
import { PostsAPI } from './api/PostsAPI.js';
import { PollsAPI } from './api/PollsAPI.js';
import { UsersAPI } from './api/UsersAPI.js';
import { DmAPI } from './api/DmAPI.js';
import { NotificationsAPI } from './api/NotificationsAPI.js';
import { GroupsAPI } from './api/GroupsAPI.js';
import { UploadsAPI } from './api/UploadsAPI.js';
import { RankingAPI } from './api/RankingAPI.js';
import { ReportsAPI } from './api/ReportsAPI.js';
import { AppealsAPI } from './api/AppealsAPI.js';
import { VerificationAPI } from './api/VerificationAPI.js';
import { ImpostersAPI } from './api/ImpostersAPI.js';
import { PushAPI } from './api/PushAPI.js';
import { RulesAPI } from './api/RulesAPI.js';
import { UrlCardsAPI } from './api/UrlCardsAPI.js';
import { OEmbedAPI } from './api/OEmbedAPI.js';
import { UIAPI } from './api/UIAPI.js';
import { SystemAPI } from './api/SystemAPI.js';
import { NyaitterAuthAPI } from './api/NyaitterAuthAPI.js';
import { RealtimeClient } from './RealtimeClient.js';

export class NyaitterClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Nyaitter サーバーの URL（例: 'https://nyaitter.example.com'）
   * @param {string} [options.token] - Bot トークンまたはアクセストークン（`bot_...`, `nyauth_...`）
   * @param {typeof fetch} [options.fetch] - カスタム fetch 関数（省略時はグローバル fetch）
   * @param {any} [options.WebSocket] - カスタム WebSocket クラス（Node.js 環境用）
   */
  constructor({ baseUrl, token = null, fetch: customFetch = null, WebSocket: customWebSocket = null } = {}) {
    if (!baseUrl) throw new Error('baseUrl は必須です');

    this._baseUrl = baseUrl.replace(/\/+$/, '');
    this._token = token;
    this._fetch = customFetch || globalThis.fetch;
    this._WebSocket = customWebSocket || globalThis.WebSocket;

    if (typeof this._fetch !== 'function') {
      throw new Error('fetch 関数が見つかりません。Node.js 18+ または fetch ポリフィルが必要です。');
    }

    // 各 API カテゴリ
    this.auth = new AuthAPI(this);
    this.posts = new PostsAPI(this);
    this.polls = new PollsAPI(this);
    this.users = new UsersAPI(this);
    this.dm = new DmAPI(this);
    this.notifications = new NotificationsAPI(this);
    this.groups = new GroupsAPI(this);
    this.uploads = new UploadsAPI(this);
    this.ranking = new RankingAPI(this);
    this.reports = new ReportsAPI(this);
    this.appeals = new AppealsAPI(this);
    this.verification = new VerificationAPI(this);
    this.imposters = new ImpostersAPI(this);
    this.push = new PushAPI(this);
    this.rules = new RulesAPI(this);
    this.urlCards = new UrlCardsAPI(this);
    this.oembed = new OEmbedAPI(this);
    this.ui = new UIAPI(this);
    this.system = new SystemAPI(this);
    this.nyaitterAuth = new NyaitterAuthAPI(this);
  }

  /**
   * アクセストークン（Bot トークン）を設定します。
   * @param {string|null} token
   */
  setToken(token) {
    this._token = token;
  }

  /**
   * 現在のアクセストークン（Bot トークン）を取得します。
   * @returns {string|null}
   */
  getToken() {
    return this._token;
  }

  /**
   * 認証中のユーザー（Bot の所有者アカウント）の情報を取得します。
   * `client.users.getMe()` のエイリアスです。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this.users.getMe();
  }

  /**
   * ユーザーオブジェクトまたはユーザー ID から、適切なアカウントアイコン URL を返します。
   *
   * @param {object|number|string} user - ユーザーオブジェクトまたはユーザー ID
   * @returns {string} アイコンの URL
   */
  getUserIconUrl(user) {
    return this.users.getIconUrl(user);
  }

  /**
   * グループオブジェクトまたはアイコン文字列から、適切なグループアイコン URL を返します。
   *
   * @param {object|string} group - グループオブジェクトまたはアイコン文字列
   * @returns {string} グループアイコンの URL
   */
  getGroupIconUrl(group) {
    return this.groups.getIconUrl(group);
  }

  /**
   * リアルタイムイベントを受信するためのクライアントを作成します。
   *
   * @param {object} [options]
   * @param {boolean} [options.autoReconnect=true] - 切断時の自動再接続
   * @param {number} [options.reconnectDelayMs=3000] - 再接続待機時間（ミリ秒）
   * @returns {RealtimeClient}
   */
  realtime(options = {}) {
    return new RealtimeClient(this, options);
  }

  /**
   * API リクエストを送信する内部メソッド。
   *
   * @param {string} method - HTTP メソッド（'GET', 'POST', 'PUT', 'PATCH', 'DELETE'）
   * @param {string} path - エンドポイントのパス（例: '/posts'）
   * @param {object} [options]
   * @param {any} [options.body] - 送信する JSON ボディ
   * @param {object} [options.query] - URL クエリパラメータ
   * @param {Record<string, string>} [options.headers] - 追加ヘッダー
   * @returns {Promise<any>}
   */
  async request(method, path, { body, query, headers = {} } = {}) {
    const rawPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this._baseUrl}${rawPath}`);

    if (query && typeof query === 'object') {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(','));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this._token) {
      reqHeaders['Authorization'] = `Bearer ${this._token}`;
    }

    const fetchOptions = {
      method,
      headers: reqHeaders,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await this._fetch(url.toString(), fetchOptions);

    let data;
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && (data?.error || data?.message)) ||
        `HTTP ${response.status} ${response.statusText || ''}`.trim();
      throw new NyaitterError(message, response.status, data);
    }

    return data;
  }

  /** @internal */
  _get(path, query) {
    return this.request('GET', path, { query });
  }

  /** @internal */
  _post(path, body, query) {
    return this.request('POST', path, { body, query });
  }

  /** @internal */
  _put(path, body, query) {
    return this.request('PUT', path, { body, query });
  }

  /** @internal */
  _patch(path, body, query) {
    return this.request('PATCH', path, { body, query });
  }

  /** @internal */
  _delete(path, body, query) {
    return this.request('DELETE', path, { body, query });
  }
}

/**
 * Nyaitter API のエラーを表す例外クラスです。
 */
export class NyaitterError extends Error {
  /**
   * @param {string} message - エラーメッセージ
   * @param {number} status - HTTP ステータスコード
   * @param {any} data - サーバーからのレスポンスデータ
   */
  constructor(message, status, data) {
    super(message);
    this.name = 'NyaitterError';
    this.status = status;
    this.data = data;
  }
}
