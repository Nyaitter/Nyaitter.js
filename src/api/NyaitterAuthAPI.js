/**
 * NyaitterAuth API
 * 自分のアプリに他のユーザーを連携させるための機能です。
 *
 * **Bot トークンが必要です。**
 * このクラスのメソッドは、Bot トークンで認証した `NyaitterClient` から呼び出してください。
 *
 * ## 使い方の流れ
 * 1. `initiate()` で認証 URL を生成し、ユーザーをそこへ案内する
 * 2. ユーザーが許可すると `redirect_uri` に `?code=...` が届く
 * 3. `exchangeToken()` で code をアクセストークン（`nyauth_...`）と交換する
 * 4. 以降はそのトークンで別の `NyaitterClient` を作り、そのユーザーとして API を呼び出せる
 */
export class NyaitterAuthAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 認証 URL を生成します。返ってきた `auth_url` にユーザーをリダイレクトしてください。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.redirectUri - 許可後にリダイレクトされる URL
   * @param {string[]} params.scopes - 要求する権限のリスト
   * @param {string} [params.name] - 認証画面に表示されるアプリ名
   * @param {string} [params.iconUrl] - 認証画面に表示されるアイコン URL
   * @param {string} [params.state] - CSRF 対策用の任意文字列
   * @returns {Promise<{ request_id: string, auth_url: string, expires_at: string }>}
   *
   * @example
   * const { auth_url } = await client.nyaitterAuth.initiate({
   *   appId: 'my_app',
   *   redirectUri: 'https://example.com/callback',
   *   scopes: ['profile:read', 'posts:write', 'continuous_access'],
   *   name: '私のアプリ',
   * });
   * // ユーザーを auth_url へ案内する
   */
  initiate({ appId, redirectUri, scopes, name, iconUrl, state } = {}) {
    return this._client._post('/server/api/nyaitter-auth/initiate', {
      app_id: appId,
      api_token: this._client.getToken(),
      redirect_uri: redirectUri,
      scopes,
      name,
      icon_url: iconUrl,
      state,
    });
  }

  /**
   * ユーザーが許可した後に届いた `code` をアクセストークンと交換します。
   * 取得したトークンで新しい `NyaitterClient` を作成して、そのユーザーとして API を呼び出せます。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.code - コールバック URL の `?code=` の値
   * @returns {Promise<{ user: object, granted_scopes: string[], access_token?: string }>}
   *
   * @example
   * const code = new URLSearchParams(window.location.search).get('code');
   *
   * const { user, access_token } = await client.nyaitterAuth.exchangeToken({
   *   appId: 'my_app',
   *   code,
   * });
   *
   * // 取得したトークンで別クライアントを作る
   * const userClient = new NyaitterClient({
   *   baseUrl: 'https://nyaitter.example.com',
   *   token: access_token,
   * });
   * await userClient.posts.create({ content: 'ユーザーとして投稿！' });
   */
  exchangeToken({ appId, code } = {}) {
    return this._client._post('/server/api/nyaitter-auth/token', {
      app_id: appId,
      api_token: this._client.getToken(),
      code,
    });
  }

  /**
   * 連携済みアプリの一覧を取得します。
   *
   * @returns {Promise<{ apps: object[] }>}
   */
  getAuthorizedApps() {
    return this._client._get('/server/api/nyaitter-auth/authorized-apps');
  }

  /**
   * 現在のアクセストークンで認可されたユーザー情報とスコープを取得します。
   *
   * @returns {Promise<{ success: boolean, user: object, scopes: string[], app_id: string|null }>}
   *
   * @example
   * const info = await userClient.nyaitterAuth.getUserInfo();
   * console.log(`連携ユーザー: ${info.user.name}, スコープ:`, info.scopes);
   */
  getUserInfo() {
    return this._client._get('/server/api/nyaitter-auth/userinfo');
  }

  /**
   * 連携済みアプリのスコープを更新します。
   *
   * @param {string} appAuthId - 連携 ID
   * @param {string[]} scopes - 新しいスコープ一覧
   * @returns {Promise<{ success: boolean }>}
   */
  updateAuthorizedApp(appAuthId, scopes) {
    return this._client._patch(`/server/api/nyaitter-auth/authorized-apps/${appAuthId}`, { scopes });
  }

  /**
   * 連携済みアプリを解除します。
   *
   * @param {string} appAuthId - 連携 ID
   * @returns {Promise<{ success: boolean }>}
   */
  revokeAuthorizedApp(appAuthId) {
    return this._client._delete(`/server/api/nyaitter-auth/authorized-apps/${appAuthId}`);
  }
}

