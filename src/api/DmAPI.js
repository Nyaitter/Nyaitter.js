/**
 * ダイレクトメッセージAPI
 * DM グループの作成・取得・編集・脱退・メッセージ送受信・リアクション・未読管理などを行います。
 */
export class DmAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * DM の一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   *
   * @example
   * const { dm, unread_total } = await client.dm.list();
   */
  list({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/dm', { limit, offset });
  }

  /**
   * `list()` のエイリアスです。
   */
  getRooms(params) {
    return this.list(params);
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
   * DM グループの詳細を取得します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得するメッセージ数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   */
  get(dmId, { limit = 50, offset = 0 } = {}) {
    return this._client._get(`/dm/${dmId}`, { limit, offset });
  }

  /**
   * `get()` のエイリアスです。
   */
  getRoom(dmId, params) {
    return this.get(dmId, params);
  }

  /**
   * 新しい DM グループを作成します。
   *
   * @param {object} params
   * @param {number[]} params.members - 招待するユーザー ID の配列
   * @param {string} [params.title] - グループ名
   * @param {string} [params.name] - グループ名
   * @returns {Promise<{ dm: object, created: boolean }>}
   */
  create({ members, title, name } = {}) {
    return this._client._post('/dm', {
      member: members,
      title: title !== undefined ? title : name,
    });
  }

  /**
   * DM グループのタイトルや設定を更新します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.title] - グループ名
   * @returns {Promise<{ dm: object }>}
   */
  updateRoom(dmId, { title } = {}) {
    return this._client._patch(`/dm/${dmId}`, { title });
  }

  /**
   * DM グループから脱退します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(dmId) {
    return this._client._delete(`/dm/${dmId}/leave`);
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
   */
  sendMessage(dmId, { content, attachments, e2e } = {}) {
    return this._client._post(`/dm/${dmId}/messages`, {
      content,
      attachments,
      e2e,
    });
  }

  /**
   * 送信済みメッセージを編集します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {object} params
   * @param {string} params.content - 編集後のメッセージ本文
   * @returns {Promise<{ success: boolean, message: object }>}
   */
  editMessage(dmId, messageId, { content } = {}) {
    return this._client._patch(`/dm/${dmId}/messages/${messageId}`, { content });
  }

  /**
   * 送信済みメッセージを削除します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - 削除するメッセージ ID
   * @returns {Promise<{ success: boolean }>}
   */
  deleteMessage(dmId, messageId) {
    return this._client._delete(`/dm/${dmId}/messages/${messageId}`);
  }

  /**
   * DM グループのメッセージを既読にします。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {string|number} [params.messageId] - 既読にする最後のメッセージ ID
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(dmId, { messageId } = {}) {
    return this._client._post(`/dm/${dmId}/read`, {
      message_id: messageId,
    });
  }

  /**
   * DM グループに新しいメンバーを追加します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number|{ userId: number }} params - 追加するユーザー ID
   * @returns {Promise<{ dm: object, member: object }>}
   */
  addMember(dmId, params) {
    const userId = typeof params === 'object' && params !== null ? params.userId : params;
    return this._client._post(`/dm/${dmId}/members`, { user_id: userId });
  }

  /**
   * DM グループからメンバーを退出させます。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 削除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  removeMember(dmId, userId) {
    return this._client._delete(`/dm/${dmId}/members/${userId}`);
  }

  /**
   * メッセージに絵文字リアクションを付けます。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {string} reaction - 絵文字またはリアクション文字列
   * @returns {Promise<{ success: boolean, reactions: object }>}
   */
  addReaction(dmId, messageId, reaction) {
    return this._client._post(`/dm/${dmId}/messages/${messageId}/reactions`, { reaction });
  }

  /**
   * メッセージの絵文字リアクションを取り消します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {string} reaction - 絵文字またはリアクション文字列
   * @returns {Promise<{ success: boolean, reactions: object }>}
   */
  removeReaction(dmId, messageId, reaction) {
    return this._client._delete(`/dm/${dmId}/messages/${messageId}/reactions`, { reaction });
  }
}
