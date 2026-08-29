/**
 * システム / ユーティリティ API
 * サーバー状態・ヘルスチェック・コミュニティルール・URL カード展開・oEmbed・ナビゲーション集計などの取得を行います。
 */
export class SystemAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  getStatusResponse() {
    return this._client.requestResponse('/status');
  }

  getApiSpecResponse(options) {
    return this._getWithFallback('/spec/endpoints', '/api/spec/endpoints', options);
  }

  getDocsResponse(options) {
    return this._getWithFallback('/docs', '/api/docs', options);
  }

  getDocResponse(docId, options) {
    return this._getWithFallback(`/docs/${encodeURIComponent(docId)}`, `/api/docs/${encodeURIComponent(docId)}`, options);
  }

  getRulesResponse(options) {
    return this._client.requestResponse('/rules', options);
  }

  async _getWithFallback(primaryPath, fallbackPath, options) {
    const response = await this._client.requestResponse(primaryPath, options);
    return response.ok ? response : this._client.requestResponse(fallbackPath, options);
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
    return this._client._get('/status');
  }

  /**
   * サーバーのヘルスチェック状態を取得します。
   *
   * @returns {Promise<{ status: string, timestamp: string, version: string, uptime: number, env: string }>}
   */
  getHealth() {
    return this._client._get('/health');
  }

  /**
   * サーバーのレディネス（DB接続準備）状態を取得します。
   *
   * @returns {Promise<{ status: string, timestamp: string }>}
   */
  getReady() {
    return this._client._get('/ready');
  }

  /**
   * コミュニティルール・利用規約を取得します。
   *
   * @returns {Promise<{ success: boolean, rules: string, updated_at: string }>}
   */
  getRules() {
    return this._client._get('/rules');
  }

  /**
   * 指定した URL の OGP カード情報（タイトル・説明・画像・著者など）を取得します。
   *
   * @param {string} url - 展開対象の URL
   * @returns {Promise<{ card: object }>}
   */
  getUrlCard(url) {
    return this._client._get('/url-cards', { url });
  }

  /**
   * Nyaitter 投稿等の oEmbed 埋め込みデータを取得します。
   *
   * @param {string} url - 投稿 URL
   * @returns {Promise<object>} oEmbed JSON レスポンス
   */
  getOembed(url) {
    return this._client._get('/oembed', { url });
  }

  /**
   * ナビゲーション表示用の未読カウントサマリー（通知未読数・DM未読数）を取得します。
   *
   * @returns {Promise<{ notification_unread_count: number, dm_unread_count: number }>}
   */
  getUiSummary() {
    return this._client._get('/ui/summary');
  }
}
