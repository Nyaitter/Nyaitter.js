/**
 * NyaitterClient - NyaitterAPI を JavaScript から簡単に使うためのクライアント
 *
 * @example
 * const client = new NyaitterClient({ baseUrl: 'https://nyaitter.example.com' });
 * await client.auth.login({ username: 'nyanko', password: '...' });
 * await client.posts.create({ content: 'はじめての投稿！' });
 */

import { PostsAPI } from './api/PostsAPI.js';
import { UsersAPI } from './api/UsersAPI.js';
import { DmAPI } from './api/DmAPI.js';
import { NotificationsAPI } from './api/NotificationsAPI.js';
import { NyaitterAuthAPI } from './api/NyaitterAuthAPI.js';
import { AuthAPI } from './api/AuthAPI.js';

export class NyaitterClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Nyaitter サーバーの URL（例: 'https://nyaitter.example.com'）
   * @param {string} [options.token] - アクセストークン（取得済みの場合に指定）
   */
  constructor({ baseUrl, token = null } = {}) {
    if (!baseUrl) throw new Error('baseUrl は必須です');

    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._token = token;

    // 各 API カテゴリ
    this.auth = new AuthAPI(this);
    this.posts = new PostsAPI(this);
    this.users = new UsersAPI(this);
    this.dm = new DmAPI(this);
    this.notifications = new NotificationsAPI(this);
    this.nyaitterAuth = new NyaitterAuthAPI(this);
  }

  /**
   * アクセストークンを設定します。
   * ログイン後に自動で呼ばれるため、通常は直接呼ぶ必要はありません。
   * @param {string|null} token
   */
  setToken(token) {
    this._token = token;
  }

  /**
   * 現在のアクセストークンを返します。
   * @returns {string|null}
   */
  getToken() {
    return this._token;
  }

  /**
   * API リクエストを送信する内部メソッド。
   * @param {string} method - HTTP メソッド（'GET', 'POST', 'PUT', 'PATCH', 'DELETE'）
   * @param {string} path - エンドポイントのパス（例: '/server/api/posts'）
   * @param {object} [body] - 送信するデータ（POST/PUT/PATCH 時）
   * @param {object} [query] - URL クエリパラメータ
   * @returns {Promise<any>}
   */
  async request(method, path, { body, query } = {}) {
    const url = new URL(`${this._baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = (typeof data === 'object' && data?.error) || `HTTP ${response.status}`;
      throw new NyaitterError(message, response.status, data);
    }

    return data;
  }

  /** @internal */
  _get(path, query) {
    return this.request('GET', path, { query });
  }

  /** @internal */
  _post(path, body) {
    return this.request('POST', path, { body });
  }

  /** @internal */
  _put(path, body) {
    return this.request('PUT', path, { body });
  }

  /** @internal */
  _patch(path, body) {
    return this.request('PATCH', path, { body });
  }

  /** @internal */
  _delete(path) {
    return this.request('DELETE', path);
  }
}

/**
 * NyaitterAPI のエラーを表します。
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
