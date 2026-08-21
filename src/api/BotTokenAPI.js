/**
 * Bot トークン API
 * Bot トークンの発行・一覧取得・削除を行います。
 *
 * Bot トークン（`bot_...`）は、自分のアカウントで動く Bot や自動投稿スクリプトのための
 * API キーです。スコープの制限がなく、自分のアカウントとして自由に API を呼び出せます。
 *
 * ⚠️ Bot トークンの発行・削除には、セッションによるログインが必要です。
 *    Bot トークン自体でこれらの操作を行うことはできません。
 */
export class BotTokenAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 新しい Bot トークンを発行します。
   * **トークンはこのレスポンスにしか含まれません。必ず安全な場所に保存してください。**
   *
   * @param {object} [params]
   * @param {string} [params.name] - トークンの名前（管理用）
   * @returns {Promise<{ token: string, tokenId: string, name: string }>}
   *
   * @example
   * const { token } = await client.botTokens.create({ name: '自動投稿Bot' });
   * // token を安全に保存する（再表示はできません）
   */
  create({ name } = {}) {
    return this._client._post('/server/api/auth/bot-tokens', { name });
  }

  /**
   * 発行済みの Bot トークン一覧を取得します。
   * トークンの値そのものは含まれません（ID と名前のみ）。
   *
   * @returns {Promise<{ tokens: Array<{ tokenId: string, name: string, createdAt: string, lastUsedAt: string|null }> }>}
   *
   * @example
   * const { tokens } = await client.botTokens.list();
   * for (const t of tokens) console.log(t.name);
   */
  list() {
    return this._client._get('/server/api/auth/bot-tokens');
  }

  /**
   * Bot トークンを削除（無効化）します。
   *
   * @param {string} tokenId - 削除するトークンの ID（`list()` で取得）
   * @returns {Promise<{ message: string }>}
   *
   * @example
   * await client.botTokens.delete('abc123...');
   */
  delete(tokenId) {
    return this._client._delete(`/server/api/auth/bot-tokens/${tokenId}`);
  }
}
