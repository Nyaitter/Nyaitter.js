/**
 * 通知 API
 * 通知の取得・作成・既読・クリック状態管理・削除などを行います。
 */
export class NotificationsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 通知一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数（最大 100）
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {string|Date} [params.since] - この日時以降の通知のみ取得
   * @returns {Promise<{ notifications: object[], notification_unread_count: number }>}
   *
   * @example
   * const { notifications, notification_unread_count } = await client.notifications.list();
   * console.log(`未読: ${notification_unread_count} 件`);
   */
  list({ limit = 50, offset = 0, since } = {}) {
    return this._client._get('/notifications', {
      limit,
      offset,
      since: since instanceof Date ? since.toISOString() : since,
    });
  }

  /**
   * 未読の通知件数を取得します。
   *
   * @returns {Promise<{ unread_count: number }>}
   *
   * @example
   * const { unread_count } = await client.notifications.getUnreadCount();
   */
  getUnreadCount() {
    return this._client._get('/notifications/unread');
  }

  /**
   * 新しい通知を送信します。
   *
   * @param {object} params
   * @param {number} params.recipientId - 送信先ユーザー ID
   * @param {'mention'|'repost'|'dm_invite'|'dm_removed'|'dm_host_transfer'|'admin_notice'} params.type - 通知タイプ
   * @param {object} [params.target] - 通知対象（例: `{ kind: 'post', id: 123 }` または `{ kind: 'dm', id: 'group-id' }`）
   * @returns {Promise<{ success: boolean, notification: object|null }>}
   *
   * @example
   * await client.notifications.create({
   *   recipientId: 12,
   *   type: 'mention',
   *   target: { kind: 'post', id: 123 },
   * });
   */
  create({ recipientId, type, target } = {}) {
    return this._client._post('/notifications', {
      recipient_id: recipientId,
      type,
      target,
    });
  }

  /**
   * 通知を既読にします。
   *
   * @param {number} notificationId - 通知 ID
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   */
  markAsRead(notificationId) {
    return this._client._put(`/notifications/${notificationId}/read`, {});
  }

  /**
   * 通知をクリック済みにマークします。
   *
   * @param {number} notificationId - 通知 ID
   * @returns {Promise<{ success: boolean, read: boolean, clicked: boolean }>}
   */
  markAsClicked(notificationId) {
    return this._client._put(`/notifications/${notificationId}/clicked`, {});
  }

  /**
   * すべての通知を既読にします。
   *
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   *
   * @example
   * await client.notifications.markAllAsRead();
   */
  markAllAsRead() {
    return this._client._put('/notifications/read-all', {});
  }

  /**
   * すべての通知をクリック済みにします。
   *
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   */
  markAllAsClicked() {
    return this._client._put('/notifications/click-all', {});
  }

  /**
   * 通知を削除します。
   *
   * @param {number} notificationId - 削除する通知 ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(notificationId) {
    return this._client._delete(`/notifications/${notificationId}`);
  }
}

