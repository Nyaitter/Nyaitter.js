/**
 * ダイレクトメッセージAPI
 * DM グループの作成・取得・編集・脱退・メッセージ送受信・未読管理などを行います。
 * メンバーの追加はルーム更新（updateRoom の member）、退出は leave で行います。
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
   * @param {number} [params.limit=50] - 取得件数（Server の既定値）
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   *
   * @example
   * const { dm, unread_total } = await client.dm.list();
   */
  list({ limit = 50, offset = 0 } = {}) {
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

  /** 指定ユーザーの DM 公開鍵を取得します。 */
  getKeys(userIds) {
    return this._client._get('/dm/keys', { user_ids: Array.isArray(userIds) ? userIds.join(',') : userIds });
  }

  /** 自分の DM 公開鍵を登録します。 */
  setKey(publicKey) {
    return this._client._post('/dm/keys', { public_key: publicKey });
  }

  /** DM を削除します。 */
  delete(dmId) {
    return this._client._delete(`/dm/${encodeURIComponent(dmId)}`);
  }

  /** DM の招待を受諾します。 */
  accept(dmId) {
    return this._client._post(`/dm/${encodeURIComponent(dmId)}/accept`, {});
  }

  /** DM の招待を拒否します。 */
  decline(dmId) {
    return this._client._post(`/dm/${encodeURIComponent(dmId)}/decline`, {});
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
   * @param {number} [params.limit] - 互換のため受け取るだけです。現行Serverの GET /dm/:dmId は limit/offset を無視して全メッセージを返すため、送信しません。
   * @param {number} [params.offset] - 同上（送信しません）
   * @param {boolean} [params.markRead] - 取得時に既読にする
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   */
  get(dmId, { limit, offset, markRead } = {}) {
    // limit/offset は互換のため受け取るが、現行Serverは無視するため送信しない。
    void limit; void offset;
    return this._client._get(`/dm/${encodeURIComponent(dmId)}`, { mark_read: markRead === undefined || markRead === null ? markRead : (markRead ? '1' : '0') });
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
   * @param {number[]} [params.members]
   * @param {number[]} [params.member]
   * @param {number} [params.hostId]
   * @param {object[]} [params.post]
   * @param {string} [params.stateVersion] - 取得した DM の state_version。post を更新するときは必須です。競合時は再取得してください。
   * @returns {Promise<{ dm: object }>}
   */
  updateRoom(dmId, { title, members, member, hostId, post, stateVersion } = {}) {
    return this._client._put(`/dm/${encodeURIComponent(dmId)}`, { title, member: member !== undefined ? member : members, host_id: hostId, post, ...(stateVersion === undefined ? {} : { state_version: stateVersion }) });
  }

  /**
   * DM グループから脱退します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(dmId) {
    return this._client._post(`/dm/${encodeURIComponent(dmId)}/leave`, {});
  }

  /**
   * DM グループにメッセージを送信します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.content] - メッセージ本文
   * @param {Array<object>} [params.attachments] - 添付ファイル
   * @param {object} [params.e2e] - E2E 暗号化ペイロード
   * @param {string} [params.reply_to] - 同じ会話内の返信先メッセージ ID
   * @param {string} [params.requestId] - 再送時に再利用する UUID（サーバーの対応が必要）
   * @param {{content?: string, attachments?: Array<object>, e2e?: object, reply_to?: string}} [params.message]
   * @returns {Promise<{ dm: object, message: object }>}
   */
  sendMessage(dmId, { message, requestId, ...fields } = {}) {
    return this._client._post(`/dm/${encodeURIComponent(dmId)}/messages`, { message: message !== undefined ? message : fields, ...(requestId === undefined ? {} : { request_id: requestId }) });
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
    return this._client._patch(`/dm/${encodeURIComponent(dmId)}/messages/${encodeURIComponent(messageId)}`, { content });
  }

  /**
   * 自分の送信済みメッセージを削除します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - 削除するメッセージ ID
   * @returns {Promise<{ success: boolean }>}
   */
  deleteMessage(dmId, messageId) {
    return this._client._delete(`/dm/${encodeURIComponent(dmId)}/messages/${encodeURIComponent(messageId)}`);
  }

  /**
   * DM グループのメッセージを既読にします。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {string|number} [params.messageId] - 互換用（サーバーは指定を無視します）
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(dmId, { messageId } = {}) {
    return this._client._post(`/dm/${encodeURIComponent(dmId)}/read`, {
      message_id: messageId,
    });
  }

}
