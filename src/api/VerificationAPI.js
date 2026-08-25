/**
 * 認証バッジ申請 API
 * アカウントの認証マーク申請および審査状況の確認・管理を行います。
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

  /**
   * 認証バッジ申請一覧を取得します（モデレーター用）。
   *
   * @param {object} [params]
   * @param {string} [params.status] - ステータス絞り込み
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ applications: object[] }>}
   */
  list({ status, limit = 50, offset = 0 } = {}) {
    return this._client._get('/verification-applications', { status, limit, offset });
  }

  /**
   * 認証バッジ申請の詳細を取得します（モデレーター用）。
   *
   * @param {number} applicationId - 申請 ID
   * @returns {Promise<{ application: object }>}
   */
  get(applicationId) {
    return this._client._get(`/verification-applications/${applicationId}`);
  }

  /**
   * 認証バッジ申請の審査結果を更新します（モデレーター用）。
   *
   * @param {number} applicationId - 申請 ID
   * @param {object} params
   * @param {'approved'|'rejected'} params.status - 審査結果
   * @param {string} [params.reason] - 理由
   * @returns {Promise<{ success: boolean, application: object }>}
   */
  update(applicationId, { status, reason } = {}) {
    return this._client._patch(`/verification-applications/${applicationId}`, {
      status,
      reason,
    });
  }
}
