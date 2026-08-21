/**
 * ダイレクトメッセージ（DM）API
 * DM の送受信・グループ管理などを行います。
 */
export class DmAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * DM の一覧（グループ一覧）を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   *
   * @example
   * const { dm, unread_total } = await client.dm.list();
   * console.log(`未読 DM: ${unread_total} 件`);
   */
  list({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/server/api/dm', { limit, offset });
  }

  /**
   * DM グループの詳細（メッセージ一覧）を取得します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得するメッセージ数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<object>}
   *
   * @example
   * const dm = await client.dm.get('dm-group-id');
   */
  get(dmId, { limit = 50, offset = 0 } = {}) {
    return this._client._get(`/server/api/dm/${dmId}`, { limit, offset });
  }

  /**
   * 新しい DM グループを作成します。
   *
   * @param {object} params
   * @param {number[]} params.members - 招待するユーザー ID の配列
   * @param {string} [params.name] - グループ名（省略可）
   * @returns {Promise<{ dm: object }>}
   *
   * @example
   * const { dm } = await client.dm.create({ members: [12, 34] });
   */
  create({ members, name } = {}) {
    return this._client._post('/server/api/dm', { member: members, name });
  }

  /**
   * DM グループにメッセージを送信します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} params.content - メッセージ本文
   * @param {Array} [params.attachments] - 添付ファイル
   * @returns {Promise<{ message: object }>}
   *
   * @example
   * await client.dm.send('dm-group-id', { content: 'こんにちは！' });
   */
  send(dmId, { content, attachments } = {}) {
    return this._client._post(`/server/api/dm/${dmId}/messages`, {
      message: { content, attachments },
    });
  }

  /**
   * DM グループにメンバーを追加します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 追加するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  addMember(dmId, userId) {
    return this._client._post(`/server/api/dm/${dmId}/members`, { user_id: userId });
  }

  /**
   * DM グループからメンバーを削除します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 削除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  removeMember(dmId, userId) {
    return this._client._delete(`/server/api/dm/${dmId}/members/${userId}`);
  }

  /**
   * DM グループから退出します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(dmId) {
    return this._client._delete(`/server/api/dm/${dmId}/leave`);
  }

  /**
   * DM グループを既読にします。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(dmId) {
    return this._client._put(`/server/api/dm/${dmId}/read`, {});
  }
}
