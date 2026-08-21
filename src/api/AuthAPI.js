/**
 * 認証 API
 * ログイン・ログアウト・セッション確認などを行います。
 */
export class AuthAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * ユーザー名とパスワードでログインします。
   * ログインに成功するとトークンが自動で保存されます。
   *
   * @param {object} params
   * @param {string} params.username - ユーザー名（Nyaitter ID）
   * @param {string} params.password - パスワード
   * @returns {Promise<{ success: boolean, token: string, user: object }>}
   *
   * @example
   * const result = await client.auth.login({ username: 'nyanko', password: 'password' });
   * console.log(result.user.name);
   */
  async login({ username, password }) {
    const data = await this._client._post('/server/api/auth/login', { username, password });
    if (data.token) {
      this._client.setToken(data.token);
    }
    return data;
  }

  /**
   * ログアウトします（現在のセッションを無効化します）。
   *
   * @returns {Promise<{ success: boolean }>}
   */
  async logout() {
    const data = await this._client._post('/server/api/auth/logout', {});
    this._client.setToken(null);
    return data;
  }

  /**
   * 現在ログイン中のユーザー情報を取得します。
   *
   * @returns {Promise<object>} ユーザー情報
   */
  getMe() {
    return this._client._get('/server/api/auth/me');
  }
}
