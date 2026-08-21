/**
 * NyaitterAuth API
 * 外部アプリが Nyaitter アカウントと連携するための OAuth 的な仕組みです。
 *
 * ## 使い方の流れ
 * 1. `initiate()` で認証セッションを開始し、`auth_url` を取得
 * 2. ユーザーを `auth_url` にリダイレクト
 * 3. ユーザーが許可すると、あなたの `redirect_uri` に `code` が届く
 * 4. `exchangeToken()` で `code` をアクセストークンと交換
 * 5. 以降は `getMe()` でユーザー情報を取得可能
 */
export class NyaitterAuthAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 認証セッションを開始します。
   * 返ってきた `auth_url` にユーザーをリダイレクトしてください。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.apiToken - API トークン（アプリシークレット）
   * @param {string} params.redirectUri - 認証後にリダイレクトされる URL
   * @param {string[]} params.scopes - 要求する権限のリスト
   * @param {string} [params.name] - アプリ名（認証画面に表示されます）
   * @param {string} [params.iconUrl] - アプリアイコンの URL
   * @param {string} [params.state] - CSRF 対策用のランダム文字列
   * @returns {Promise<{ request_id: string, auth_url: string, expires_at: string }>}
   *
   * @example
   * const { auth_url } = await client.nyaitterAuth.initiate({
   *   appId: 'my_app',
   *   apiToken: 'secret_token',
   *   redirectUri: 'https://example.com/callback',
   *   scopes: ['profile:read', 'posts:write', 'continuous_access'],
   *   name: '私のアプリ',
   * });
   * // ユーザーを auth_url にリダイレクトする
   */
  initiate({ appId, apiToken, redirectUri, scopes, name, iconUrl, state } = {}) {
    return this._client._post('/server/api/nyaitter-auth/initiate', {
      app_id: appId,
      api_token: apiToken,
      redirect_uri: redirectUri,
      scopes,
      name,
      icon_url: iconUrl,
      state,
    });
  }

  /**
   * 認証コード（`code`）をアクセストークンと交換します。
   * ユーザーが許可した後、`redirect_uri` に届いた `code` をここで使います。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.apiToken - API トークン
   * @param {string} params.code - 認証コード（コールバック URL の `?code=` の値）
   * @returns {Promise<{ user: object, granted_scopes: string[], access_token?: string }>}
   *
   * @example
   * // コールバック URL から code を取得
   * const code = new URLSearchParams(window.location.search).get('code');
   *
   * const result = await client.nyaitterAuth.exchangeToken({
   *   appId: 'my_app',
   *   apiToken: 'secret_token',
   *   code,
   * });
   *
   * if (result.access_token) {
   *   client.setToken(result.access_token);
   * }
   */
  async exchangeToken({ appId, apiToken, code } = {}) {
    const data = await this._client._post('/server/api/nyaitter-auth/token', {
      app_id: appId,
      api_token: apiToken,
      code,
    });
    if (data.access_token) {
      this._client.setToken(data.access_token);
    }
    return data;
  }

  /**
   * アクセストークンを使ってユーザー情報を取得します。
   * `exchangeToken()` 後、自動でトークンが設定されている場合はそのまま使えます。
   *
   * @returns {Promise<{ user: object, scopes: string[], app_id: string }>}
   *
   * @example
   * const { user } = await client.nyaitterAuth.getMe();
   * console.log(`ログイン中: ${user.name}`);
   */
  getMe() {
    return this._client._get('/server/api/nyaitter-auth/userinfo');
  }

  /**
   * 認証リクエストの詳細情報を取得します。
   * （主に Nyaitter の認証画面が内部で使用します）
   *
   * @param {string} requestId - `initiate()` で取得した `request_id`
   * @returns {Promise<{ request: object }>}
   */
  getRequest(requestId) {
    return this._client._get(`/server/api/nyaitter-auth/requests/${requestId}`);
  }

  /**
   * 連携中のアプリ一覧を取得します。
   *
   * @returns {Promise<{ apps: object[] }>}
   */
  getAuthorizedApps() {
    return this._client._get('/server/api/nyaitter-auth/authorized-apps');
  }

  /**
   * 連携中のアプリの権限を更新します。
   *
   * @param {string} appAuthId - 連携 ID
   * @param {string[]} scopes - 新しい権限リスト
   * @returns {Promise<{ success: boolean }>}
   */
  updateAuthorizedApp(appAuthId, scopes) {
    return this._client._patch(`/server/api/nyaitter-auth/authorized-apps/${appAuthId}`, { scopes });
  }

  /**
   * アプリの連携を解除します。
   *
   * @param {string} appAuthId - 連携 ID
   * @returns {Promise<{ success: boolean }>}
   */
  revokeAuthorizedApp(appAuthId) {
    return this._client._delete(`/server/api/nyaitter-auth/authorized-apps/${appAuthId}`);
  }
}
