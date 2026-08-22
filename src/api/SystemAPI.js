/**
 * システム / ユーティリティ API
 * サーバー状態・コミュニティルール・URL カード展開・oEmbed・ナビゲーション集計などの取得を行います。
 */
export class SystemAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * サーバーの稼働状態・制限値・認証プロバイダー設定を取得します。
   *
   * @returns {Promise<{ server: string, timestamp: string, database: string, identity: object, auth_methods: string[], client_limits: object }>}
   *
   * @example
   * const status = await client.system.getStatus();
   * console.log('サーバー状態:', status.server, status.database);
   */
  getStatus() {
    return this._client._get('/server/api/status');
  }

  /**
   * コミュニティルール・利用規約を取得します。
   *
   * @returns {Promise<{ success: boolean, rules: string, updated_at: string }>}
   *
   * @example
   * const { rules } = await client.system.getRules();
   * console.log(rules);
   */
  getRules() {
    return this._client._get('/server/api/rules');
  }

  /**
   * 指定した URL の OGP カード情報（タイトル・説明・画像・著者など）を取得します。
   *
   * @param {string} url - 展開対象の URL
   * @returns {Promise<{ card: object }>}
   *
   * @example
   * const { card } = await client.system.getUrlCard('https://example.com');
   * console.log('タイトル:', card.title);
   */
  getUrlCard(url) {
    return this._client._get('/server/api/url-cards', { url });
  }

  /**
   * Nyaitter 投稿等の oEmbed 埋め込みデータを取得します。
   *
   * @param {string} url - 投稿 URL
   * @returns {Promise<object>} oEmbed JSON レスポンス
   */
  getOembed(url) {
    return this._client._get('/server/api/oembed', { url });
  }

  /**
   * ナビゲーション表示用の未読カウントサマリー（通知未読数・DM未読数）を取得します。
   *
   * @returns {Promise<{ notification_unread_count: number, dm_unread_count: number }>}
   *
   * @example
   * const summary = await client.system.getUiSummary();
   * console.log(`通知未読: ${summary.notification_unread_count}, DM未読: ${summary.dm_unread_count}`);
   */
  getUiSummary() {
    return this._client._get('/server/api/ui/summary');
  }
}
