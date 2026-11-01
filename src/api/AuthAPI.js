/**
 * 認証 API
 * 現行Serverのプロバイダー認証、ログイン承認、セッション管理などを行います。
 */

export class AuthAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  getProviders() { return this._client._get('/auth/providers'); }
  verifyProvider(provider, body = {}) { return this._client._post(`/auth/${encodeURIComponent(provider)}/verify`, body); }
  pollLoginApproval(id, approvalToken) { return this._client._post(`/auth/login-approvals/${encodeURIComponent(id)}/poll`, { approval_token: approvalToken }); }
  getLinkedProviders() { return this._client._get('/auth/linked-providers'); }
  initiateProvider(provider, body = {}) { return this._client._post(`/auth/${encodeURIComponent(provider)}/initiate`, body); }
  initiateProviderLink(provider, body = {}) { return this._client._post(`/auth/link/${encodeURIComponent(provider)}/initiate`, body); }
  verifyProviderLink(provider, body = {}) { return this._client._post(`/auth/link/${encodeURIComponent(provider)}/verify`, body); }
  unlinkProvider(provider, providerUserId) { return this._client._delete(`/auth/link/${encodeURIComponent(provider)}`, { provider_user_id: providerUserId }); }
  getLoginApproval(id) { return this._client._get(`/auth/login-approvals/${encodeURIComponent(id)}`); }
  decideLoginApproval(id, decision) { return this._client._post(`/auth/login-approvals/${encodeURIComponent(id)}/decision`, { decision }); }
  /** @param {{approvalId?: string, approvalToken?: string}} [params] */
  startAccountRecovery({ approvalId, approvalToken } = {}) { return this._client._post('/auth/account-recovery/start', { approval_id: approvalId, approval_token: approvalToken }); }
  pollAccountRecovery(id, recoveryToken) { return this._client._post(`/auth/account-recovery/${encodeURIComponent(id)}/poll`, { recovery_token: recoveryToken }); }
  getAccountRecovery(id) { return this._client._get(`/auth/account-recovery/${encodeURIComponent(id)}`); }
  decideAccountRecovery(id, decision) { return this._client._post(`/auth/account-recovery/${encodeURIComponent(id)}/decision`, { decision }); }
  getBlockedIps() { return this._client._get('/auth/blocked-ips'); }
  deleteBlockedIp(hash) { return this._client._delete(`/auth/blocked-ips/${encodeURIComponent(hash)}`); }
  trustCurrentIp() { return this._client._post('/auth/login-security/trust-current-ip', {}); }
  revokeSessionIp(id) { return this._client._post(`/auth/sessions/${encodeURIComponent(id)}/revoke-ip`, {}); }
  switchImposter(id) { return this._client._post(`/auth/imposters/${encodeURIComponent(id)}/switch`, {}); }
  verifyTurnstile(token) { return this._client._post('/auth/turnstile/verify', { token }); }
  devLogin(username) { return this._client._post('/auth/dev-login', { username }); }
  testProtected() { return this._client._get('/auth/test-protected'); }
  createBotToken(name) { return this._client._post('/auth/bot-tokens', { name }); }
  getBotTokens() { return this._client._get('/auth/bot-tokens'); }
  deleteBotToken(id) { return this._client._delete(`/auth/bot-tokens/${encodeURIComponent(id)}`); }

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
   * ログアウトします。
   *
   * @returns {Promise<{ message: string }>}
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
   * @param {number} [params.userId] - 切り替え先のユーザー ID
   * @returns {Promise<{ success: boolean, user: object }>}
   */
  switchAccount({ accountId, userId = accountId } = {}) {
    return this._client._post('/auth/accounts/switch', { user_id: userId });
  }

  /**
   * 記憶済みアカウントを解除します（provider連携の解除ではありません）。
   *
   * @param {number} accountId - 解除するアカウント ID
   * @returns {Promise<{ success: boolean }>}
   */
  unlinkAccount(accountId) {
    return this._client._delete(`/auth/accounts/${encodeURIComponent(accountId)}`);
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
    return this._client._delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
  }

}
