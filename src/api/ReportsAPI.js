/**
 * 報告API
 * 不適切な投稿やユーザーの通報、およびモデレーション審査状況の取得・更新を行います。
 */
export class ReportsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 不適切な投稿またはユーザーを通報・報告します。
   *
   * @param {object} params
   * @param {'post'|'user'} params.targetKind - 報告対象の種類
   * @param {number|string} params.targetId - 報告対象の投稿 ID またはユーザー ID
   * @param {string} params.description - 通報理由・詳細説明
   * @param {number} [params.postAsUserId] - 代理通報ユーザー ID
   * @returns {Promise<{ success: boolean, report: { id: number, status: string, created_at: string } }>}
   *
   * @example
   * await client.reports.create({
   *   targetKind: 'post',
   *   targetId: 123,
   *   description: 'スパム投稿です。',
   * });
   */
  create({ targetKind, targetId, description, postAsUserId } = {}) {
    return this._client._post('/reports', {
      target_kind: targetKind,
      target_id: targetId,
      description,
      post_as_user_id: postAsUserId,
    });
  }

  /**
   * 通報一覧を取得します。
   *
   * @param {object} [params]
   * @param {string} [params.status] - 絞り込みステータス
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ reports: object[] }>}
   */
  list({ status, limit = 50, offset = 0 } = {}) {
    return this._client._get('/reports', { status, limit, offset });
  }

  /**
   * 通報の詳細を取得します。
   *
   * @param {number} reportId - 通報 ID
   * @returns {Promise<{ report: object }>}
   */
  get(reportId) {
    return this._client._get(`/reports/${reportId}`);
  }

  /**
   * 通報の審査ステータスを更新します。
   *
   * @param {number} reportId - 通報 ID
   * @param {object} params
   * @param {string} params.status - 新しいステータス
   * @param {string} [params.note] - モデレーターメモ
   * @param {string} [params.action] - 実行したアクション
   * @returns {Promise<{ success: boolean, report: object }>}
   */
  update(reportId, { status, note, action } = {}) {
    return this._client._patch(`/reports/${reportId}`, {
      status,
      note,
      action,
    });
  }
}
