/**
 * ダイレクトメッセージ（DM）API
 * DM グループの作成・取得・メッセージ送受信・未読管理・鍵管理などを行います。
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
    return this._client._get('/dm', { limit, offset });
  }

  /**
   * 全体の DM 未読件数を取得します。
   *
   * @returns {Promise<{ unread_count: number }>}
   */
  getUnreadCount() {
    return this._client._get('/dm/unread');
  }

  /**
   * DM グループごとの未読件数マップを取得します。
   *
   * @returns {Promise<{ unread_total: number, unread_by_dm: Record<string, number> }>}
   */
  getUnreadCounts() {
    return this._client._get('/dm/unread-counts');
  }

  /**
   * 指定ユーザーとの既存の 1対1 DM グループを検索します。
   *
   * @param {number|{ userId: number }} params - 相手のユーザー ID
   * @returns {Promise<{ dm: object|null }>}
   */
  find(params) {
    const userId = typeof params === 'object' && params !== null ? params.userId : params;
    return this._client._get('/dm/find', { user_id: userId });
  }

  /**
   * DM グループの詳細（メッセージ一覧）を取得します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得するメッセージ数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   *
   * @example
   * const dm = await client.dm.get('dm-group-id');
   */
  get(dmId, { limit = 50, offset = 0 } = {}) {
    return this._client._get(`/dm/${dmId}`, { limit, offset });
  }

  /**
   * 新しい DM グループを作成します。
   *
   * @param {object} params
   * @param {number[]} params.members - 招待するユーザー ID の配列
   * @param {string} [params.title] - グループ名
   * @param {string} [params.name] - グループ名（title の別名）
   * @returns {Promise<{ dm: object, created: boolean }>}
   *
   * @example
   * const { dm } = await client.dm.create({ members: [12, 34], title: '企画グループ' });
   */
  create({ members, title, name } = {}) {
    return this._client._post('/dm', {
      member: members,
      title: title !== undefined ? title : name,
    });
  }

  /**
   * DM グループにメッセージを送信します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.content] - メッセージ本文
   * @param {Array<object>} [params.attachments] - 添付ファイル
   * @param {object} [params.e2e] - E2E 暗号化ペイロード
   * @returns {Promise<{ dm: object, message: object }>}
   *
   * @example
   * await client.dm.send('dm-group-id', { content: 'こんにちは！' });
   */
  send(dmId, { content = '', attachments, e2e } = {}) {
    return this._client._post(`/dm/${dmId}/messages`, {
      message: {
        content,
        attachments,
        e2e,
      },
    });
  }

  /**
   * DM グループの設定（タイトル・メンバー・ホスト・メッセージ履歴）を更新します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.title] - グループ名
   * @param {number[]} [params.members] - メンバー ID 配列
   * @param {number} [params.hostId] - 新ホストのユーザー ID
   * @param {Array<object>} [params.post] - メッセージ配列（履歴編集）
   * @returns {Promise<{ dm: object }>}
   */
  update(dmId, { title, members, hostId, post } = {}) {
    return this._client._put(`/dm/${dmId}`, {
      title,
      member: members,
      host_id: hostId,
      post,
    });
  }

  /**
   * DM グループにメンバーを追加します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 追加するユーザー ID
   * @returns {Promise<{ dm: object }>}
   */
  async addMember(dmId, userId) {
    const dmRes = await this.get(dmId);
    const dmObj = dmRes?.dm?.[0] || dmRes;
    const currentMembers = Array.isArray(dmObj?.member) ? dmObj.member.map(Number) : [];
    if (!currentMembers.includes(Number(userId))) {
      currentMembers.push(Number(userId));
    }
    return this.update(dmId, { members: currentMembers });
  }

  /**
   * DM グループからメンバーを削除します（ホストのみ）。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 削除するユーザー ID
   * @returns {Promise<{ dm: object }>}
   */
  async removeMember(dmId, userId) {
    const dmRes = await this.get(dmId);
    const dmObj = dmRes?.dm?.[0] || dmRes;
    const currentMembers = Array.isArray(dmObj?.member)
      ? dmObj.member.map(Number).filter((id) => id !== Number(userId))
      : [];
    return this.update(dmId, { members: currentMembers });
  }

  /**
   * DM グループを解散・削除します（ホストのみ）。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(dmId) {
    return this._client._delete(`/dm/${dmId}`);
  }

  /**
   * メッセージリクエストを承認します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean, dm: object }>}
   */
  accept(dmId) {
    return this._client._post(`/dm/${dmId}/accept`, {});
  }

  /**
   * メッセージリクエストを拒否して退出します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  decline(dmId) {
    return this._client._post(`/dm/${dmId}/decline`, {});
  }

  /**
   * DM グループから退出します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(dmId) {
    return this._client._post(`/dm/${dmId}/leave`, {});
  }

  /**
   * DM グループを既読にします。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(dmId) {
    return this._client._post(`/dm/${dmId}/read`, {});
  }

  /**
   * 指定ユーザーたちの E2E 暗号化公開鍵を取得します。
   *
   * @param {number[]|string} userIds - ユーザー ID 配列またはカンマ区切り文字列
   * @returns {Promise<{ keys: Record<string, string> }>}
   */
  getKeys(userIds) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    return this._client._get('/dm/keys', { user_ids: ids });
  }

  /**
   * 自分の E2E 暗号化公開鍵を登録します。
   *
   * @param {string} publicKey - 公開鍵文字列
   * @returns {Promise<{ success: boolean }>}
   */
  setKeys(publicKey) {
    return this._client._post('/dm/keys', { public_key: publicKey });
  }
}

