/**
 * 報告（通報）API
 * 不適切な投稿やユーザーの報告を行います。
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
   * @param {'post'|'user'} params.targetKind - 報告対象の種類（'post' または 'user'）
   * @param {number|string} params.targetId - 報告対象の投稿 ID またはユーザー ID
   * @param {string} params.description - 通報理由・詳細説明
   * @returns {Promise<{ success: boolean, report: { id: number, status: string, created_at: string } }>}
   *
   * @example
   * await client.reports.create({
   *   targetKind: 'post',
   *   targetId: 123,
   *   description: 'スパム投稿です。',
   * });
   */
  create({ targetKind, targetId, description } = {}) {
    return this._client._post('/server/api/reports', {
      target_kind: targetKind,
      target_id: targetId,
      description,
    });
  }
}
