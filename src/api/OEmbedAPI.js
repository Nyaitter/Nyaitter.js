/**
 * oEmbed API
 * Nyaitter 投稿等の oEmbed 埋め込み用メタデータを取得します。
 */
export class OEmbedAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Nyaitter 投稿 URL から oEmbed 埋め込みデータを取得します。
   *
   * @param {string} url - 投稿の URL
   * @param {object} [params]
   * @param {number} [params.maxWidth] - 最大幅
   * @param {number} [params.maxHeight] - 最大高さ
   * @returns {Promise<{ type: string, version: string, title?: string, author_name?: string, author_url?: string, provider_name: string, provider_url: string, html: string, width?: number, height?: number }>}
   *
   * @example
   * const data = await client.oembed.get('https://nyaitter.example.com/posts/123');
   * console.log(data.html);
   */
  get(url, { maxWidth, maxHeight } = {}) {
    return this._client._get('/oembed', {
      url,
      maxwidth: maxWidth,
      maxheight: maxHeight,
    });
  }
}
