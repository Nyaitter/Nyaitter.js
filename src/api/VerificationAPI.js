/**
 * 認証バッジ申請 API
 * アカウントの認証マーク申請および審査状況の確認を行います。
 */
export class VerificationAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 自分の認証バッジ申請の現在の審査ステータスを取得します。
   *
   * @returns {Promise<{ application: { id: number, status: string, assigned_at: string|null, created_at: string }|null }>}
   *
   * @example
   * const { application } = await client.verification.getStatus();
   * if (application) {
   *   console.log('申請状況:', application.status);
   * }
   */
  getStatus() {
    return this._client._get('/verification-applications/me');
  }

  /**
   * 認証バッジを申請します。
   *
   * @returns {Promise<{ application: { id: number, status: string, assigned_at: string|null, created_at: string } }>}
   *
   * @example
   * await client.verification.apply();
   */
  apply() {
    return this._client._post('/verification-applications', {});
  }
}
