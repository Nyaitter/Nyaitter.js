/**
 * 通知 API
 * 通知の取得・既読処理などを行います。
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
    return this._client._get('/server/api/notifications', {
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
    return this._client._get('/server/api/notifications/unread');
  }

  /**
   * 通知を既読にします。
   *
   * @param {number} notificationId - 通知 ID
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   */
  markAsRead(notificationId) {
    return this._client._put(`/server/api/notifications/${notificationId}/read`, {});
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
    return this._client._put('/server/api/notifications/read-all', {});
  }

  /**
   * 通知を削除します。
   *
   * @param {number} notificationId - 削除する通知 ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(notificationId) {
    return this._client._delete(`/server/api/notifications/${notificationId}`);
  }
}
