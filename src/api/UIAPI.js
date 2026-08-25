/**
 * UI / ナビゲーション集計 API
 * ナビゲーション用の未読カウントサマリーやテーマ設定等の取得を行います。
 */
export class UIAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * ナビゲーション表示用の未読カウントサマリー（通知未読数・DM未読数）を取得します。
   *
   * @returns {Promise<{ notification_unread_count: number, dm_unread_count: number }>}
   *
   * @example
   * const summary = await client.ui.getSummary();
   * console.log(`未読通知: ${summary.notification_unread_count} 件, 未読DM: ${summary.dm_unread_count} 件`);
   */
  getSummary() {
    return this._client._get('/ui/summary');
  }
}
