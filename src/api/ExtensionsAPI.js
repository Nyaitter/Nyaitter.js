/**
 * 拡張 API（サーバー間連携）
 * 拡張キー（x-nyaitter-extension-key）で認証する `/internal/extensions` 配下の
 * NyaitterAuth フローを呼びます。通常のユーザートークンではなく拡張キーが
 * 必要なため、メソッドごとに `extensionKey` を渡すか、クライアント初期化時に
 * `extensionKey` オプション（または `client.setExtensionKey()`）で設定します。
 */
export class ExtensionsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * @internal
   * @param {string} [extensionKey]
   * @returns {Record<string, string>}
   */
  _headers(extensionKey) {
    const key = extensionKey ?? this._client.getExtensionKey();
    if (!key) {
      throw new Error('拡張キーが必要です。メソッドの引数か、クライアントの extensionKey オプションで指定してください。');
    }
    return { 'x-nyaitter-extension-key': key };
  }

  /**
   * 拡張キーに許可された戻り先へ、NyaitterAuth の認可リクエストを作成します。
   *
   * @param {object} params
   * @param {string} [params.extensionKey] - 拡張キー（クライアントに設定済みの場合は省略可）
   * @param {string} params.redirectUri - 戻り先 URL（拡張キーに許可されたオリジンであること）
   * @param {string} [params.state] - 認可リクエストに引き継ぐ任意の状態値
   * @param {(string|{scope: string, required?: boolean})[]} [params.scopes] - 要求スコープ
   * @returns {Promise<object>} サーバーの認可リクエスト応答（auth_url 等）
   */
  initiate({ extensionKey, redirectUri, state, scopes } = {}) {
    return this._client.request('POST', '/internal/extensions/nyaitter-auth/initiate', {
      headers: this._headers(extensionKey),
      body: { redirect_uri: redirectUri, state, scopes },
    });
  }

  /**
   * 認可コードをアクセストークンへ交換します（拡張キー側のアプリとして）。
   *
   * @param {object} params
   * @param {string} [params.extensionKey] - 拡張キー（クライアントに設定済みの場合は省略可）
   * @param {string} params.code - 認可コード
   * @returns {Promise<object>} トークン交換の応答
   */
  exchangeToken({ extensionKey, code } = {}) {
    return this._client.request('POST', '/internal/extensions/nyaitter-auth/token', {
      headers: this._headers(extensionKey),
      body: { code },
    });
  }

  /**
   * アクセストークンのユーザー情報を取得します。
   * トークンはこの拡張キーに対して発行されたものである必要があります。
   *
   * @param {object} params
   * @param {string} [params.extensionKey] - 拡張キー（クライアントに設定済みの場合は省略可）
   * @param {string} params.accessToken - NyaitterAuth アクセストークン
   * @returns {Promise<{success: boolean, app_id: string, granted_scopes: string[], user: object}>}
   */
  getUserInfo({ extensionKey, accessToken } = {}) {
    return this._client.request('POST', '/internal/extensions/nyaitter-auth/userinfo', {
      headers: { ...this._headers(extensionKey), Authorization: `Bearer ${accessToken}` },
      body: {},
    });
  }
}
