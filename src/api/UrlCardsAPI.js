/**
 * URL カード API
 * 外部リンクや Nyaitter 投稿等の OGP カード情報を取得します。
 */
export class UrlCardsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 指定した URL の OGP カード情報を取得します。
   *
   * @param {string} url - 展開対象の URL
   * @returns {Promise<{ card: object|null }>}
   *
   * @example
   * const { card } = await client.urlCards.get('https://scratch.mit.edu');
   * console.log('タイトル:', card?.title);
   */
  get(url) {
    return this._client._get('/url-cards', { url });
  }
}
