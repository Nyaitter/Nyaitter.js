/**
 * 認証 API
 * ログイン・ログアウト・2要素認証・セッション管理・Scratch連携・外部認証などを行います。
 */
export class AuthAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  getProvidersResponse() {
    return this._client.requestResponse('/auth/providers');
  }

  pollLoginApprovalResponse(approvalId, approvalToken) {
    return this._client.requestResponse(`/auth/login-approvals/${encodeURIComponent(approvalId)}/poll`, {
      method: 'POST',
      body: { approval_token: approvalToken },
    });
  }

  generateScratchResponse(username) {
    return this._client.requestResponse('/auth/scratch/generate', {
      method: 'POST',
      body: { type: 'generateCode', username },
    });
  }

  verifyScratchResponse(body) {
    return this._client.requestResponse('/auth/scratch/verify', { method: 'POST', body });
  }

  initiateEmailResponse(email) {
    return this._client.requestResponse('/auth/email/initiate', { method: 'POST', body: { email } });
  }

  verifyEmailResponse(body) {
    return this._client.requestResponse('/auth/email/verify', { method: 'POST', body });
  }

  initiatePasskeyResponse(body = {}) {
    return this._client.requestResponse('/auth/passkey/initiate', { method: 'POST', body });
  }

  verifyPasskeyResponse(body) {
    return this._client.requestResponse('/auth/passkey/verify', { method: 'POST', body });
  }

  initiateNyaitterResponse(body) {
    return this._client.requestResponse('/auth/nyaitter/initiate', { method: 'POST', body });
  }

  verifyProviderResponse(provider, body) {
    return this._client.requestResponse(`/auth/${encodeURIComponent(provider)}/verify`, {
      method: 'POST',
      body,
    });
  }

  /**
   * ログインしてセッショントークンを取得します。
   *
   * @param {object} params
   * @param {string} params.username - ユーザー名または Scratch ID
   * @param {string} params.password - パスワード
   * @param {string} [params.token2fa] - 2要素認証コード
   * @returns {Promise<{ success: boolean, token?: string, user?: object, require_2fa?: boolean }>}
   */
  login({ username, password, token2fa } = {}) {
    return this._client._post('/auth/login', {
      username,
      password,
      token_2fa: token2fa,
    });
  }

  /**
   * ログアウトします。
   *
   * @returns {Promise<{ success: boolean }>}
   */
  logout() {
    return this._client._post('/auth/logout', {});
  }

  /**
   * ログイン中のユーザー情報を取得します。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this._client._get('/auth/me');
  }

  /**
   * 新規アカウントを登録します。
   *
   * @param {object} params
   * @param {string} params.scratchId - Scratch ユーザー名
   * @param {string} params.password - パスワード
   * @param {string} [params.username] - 表示名
   * @param {string} [params.email] - メールアドレス
   * @returns {Promise<{ success: boolean, user: object, token?: string }>}
   */
  register({ scratchId, password, username, email } = {}) {
    return this._client._post('/auth/register', {
      scratch_id: scratchId,
      password,
      username,
      email,
    });
  }

  /**
   * Scratch 認証用の確認コードを取得します。
   *
   * @param {string} scratchId - Scratch ユーザー名
   * @returns {Promise<{ success: boolean, code: string }>}
   */
  checkScratch(scratchId) {
    return this._client._post('/auth/check-scratch', { scratch_id: scratchId });
  }

  /**
   * Scratch プロフィール確認コードを検証してアカウントを連携します。
   *
   * @param {object} params
   * @param {string} params.scratchId - Scratch ユーザー名
   * @param {string} params.code - 確認コード
   * @returns {Promise<{ success: boolean, verified: boolean }>}
   */
  linkScratch({ scratchId, code } = {}) {
    return this._client._post('/auth/link-scratch', {
      scratch_id: scratchId,
      code,
    });
  }

  /**
   * 連携されているサブアカウント一覧を取得します。
   *
   * @returns {Promise<{ accounts: object[] }>}
   */
  getAccounts() {
    return this._client._get('/auth/accounts');
  }

  /**
   * 操作対象のアカウントを切り替えます。
   *
   * @param {object} params
   * @param {number} params.accountId - 切り替え先のアカウント ID
   * @param {string} [params.password] - パスワード
   * @returns {Promise<{ success: boolean, token?: string, user: object }>}
   */
  switchAccount({ accountId, password } = {}) {
    return this._client._post('/auth/accounts/switch', {
      account_id: accountId,
      password,
    });
  }

  /**
   * 既存のアカウントをサブアカウントとして連携します。
   *
   * @param {object} params
   * @param {number|string} params.accountId - 連携するアカウント ID またはユーザー名
   * @param {string} params.password - パスワード
   * @returns {Promise<{ success: boolean, accounts: object[] }>}
   */
  linkAccount({ accountId, password } = {}) {
    return this._client._post('/auth/accounts/link', {
      account_id: accountId,
      password,
    });
  }

  /**
   * サブアカウントの連携を解除します。
   *
   * @param {number} accountId - 解除するアカウント ID
   * @returns {Promise<{ success: boolean }>}
   */
  unlinkAccount(accountId) {
    return this._client._delete('/auth/accounts/unlink', {
      account_id: accountId,
    });
  }

  /**
   * 2要素認証のセットアップを開始します。
   *
   * @returns {Promise<{ secret: string, qr_code_uri: string }>}
   */
  setup2FA() {
    return this._client._post('/auth/2fa/setup', {});
  }

  /**
   * 2要素認証を有効化します。
   *
   * @param {object} params
   * @param {string} params.code - 認証アプリの 6 桁コード
   * @param {string} params.secret - セットアップ時に取得したシークレット
   * @returns {Promise<{ success: boolean }>}
   */
  verify2FA({ code, secret } = {}) {
    return this._client._post('/auth/2fa/verify', { code, secret });
  }

  /**
   * 2要素認証を無効化します。
   *
   * @param {string} code - 認証アプリの 6 桁コード
   * @returns {Promise<{ success: boolean }>}
   */
  disable2FA(code) {
    return this._client._post('/auth/2fa/disable', { code });
  }

  /**
   * アクティブなログインセッション一覧を取得します。
   *
   * @returns {Promise<{ sessions: object[] }>}
   */
  getSessions() {
    return this._client._get('/auth/sessions');
  }

  /**
   * 指定したログインセッションを取り消しします。
   *
   * @param {string} sessionId - セッション ID
   * @returns {Promise<{ success: boolean }>}
   */
  revokeSession(sessionId) {
    return this._client._post('/auth/sessions/revoke', { session_id: sessionId });
  }

  /**
   * 外部ログイン認証を開始します。
   *
   * @param {object} params
   * @param {string} params.provider - 認証プロバイダー名
   * @param {string} [params.redirectUri] - リダイレクト URL
   * @returns {Promise<{ auth_url: string, token: string }>}
   */
  startExternalAuth({ provider, redirectUri } = {}) {
    return this._client._post('/auth/external/start', {
      provider,
      redirect_uri: redirectUri,
    });
  }

  /**
   * 外部認証の確認を行います。
   *
   * @param {object} params
   * @param {string} params.token - 外部認証トークン
   * @param {string} [params.password] - パスワード
   * @returns {Promise<{ success: boolean }>}
   */
  confirmExternalAuth({ token, password } = {}) {
    return this._client._post('/auth/external/confirm', { token, password });
  }

  /**
   * 外部認証を完了しログインします。
   *
   * @param {string} token - 外部認証トークン
   * @returns {Promise<{ success: boolean, token?: string, user?: object }>}
   */
  completeExternalAuth(token) {
    return this._client._post('/auth/external/complete', { token });
  }

  /**
   * アカウント削除を申請します。
   *
   * @param {string} password - アカウントのパスワード
   * @returns {Promise<{ success: boolean, scheduled_deletion_at: string }>}
   */
  requestAccountDeletion(password) {
    return this._client._post('/auth/account-deletion/request', { password });
  }

  /**
   * アカウント削除申請を取り消します。
   *
   * @param {string} password - アカウントのパスワード
   * @returns {Promise<{ success: boolean }>}
   */
  cancelAccountDeletion(password) {
    return this._client._post('/auth/account-deletion/cancel', { password });
  }
}
