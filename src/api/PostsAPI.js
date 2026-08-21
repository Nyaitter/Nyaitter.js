/**
 * 投稿 API
 * 投稿の作成・取得・削除・いいね・リポストなどを行います。
 */
export class PostsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * タイムライン（おすすめ・フォロー中）の投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {'foryou'|'following'} [params.tab='foryou'] - タブ（'foryou': おすすめ、'following': フォロー中）
   * @param {number} [params.limit=20] - 取得件数（最大 100）
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - このID以前の投稿を取得（ページネーション）
   * @returns {Promise<{ posts: object[] }>}
   *
   * @example
   * const { posts } = await client.posts.getTimeline({ tab: 'following' });
   */
  getTimeline({ tab = 'foryou', limit = 20, offset = 0, beforeId } = {}) {
    return this._client._get('/server/api/posts/timeline', { tab, limit, offset, before_id: beforeId });
  }

  /**
   * おすすめ投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getRecommended({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/server/api/posts/recommended', { limit, offset });
  }

  /**
   * 投稿を検索します。
   *
   * @param {object} params
   * @param {string} params.query - 検索キーワード
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   *
   * @example
   * const { posts } = await client.posts.search({ query: 'ねこ' });
   */
  search({ query, limit = 20, offset = 0 } = {}) {
    return this._client._get('/server/api/posts/search', { q: query, limit, offset });
  }

  /**
   * 投稿を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @returns {Promise<{ post: object }>}
   *
   * @example
   * const { post } = await client.posts.get(123);
   */
  get(postId) {
    return this._client._get(`/server/api/posts/${postId}`);
  }

  /**
   * 投稿のリプライ一覧を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getReplies(postId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/server/api/posts/${postId}/replies`, { limit, offset });
  }

  /**
   * 新しい投稿を作成します。
   *
   * @param {object} params
   * @param {string} params.content - 投稿本文
   * @param {number} [params.replyToId] - 返信先の投稿 ID（返信投稿の場合）
   * @param {number} [params.quoteId] - 引用する投稿 ID（引用投稿の場合）
   * @param {Array} [params.attachments] - 添付ファイル（画像など）
   * @returns {Promise<{ post: object }>}
   *
   * @example
   * // 通常投稿
   * const { post } = await client.posts.create({ content: 'こんにちは！' });
   *
   * // 返信
   * const { post } = await client.posts.create({ content: '返信です', replyToId: 123 });
   */
  create({ content, replyToId, quoteId, attachments } = {}) {
    return this._client._post('/server/api/posts', {
      content,
      reply_to_id: replyToId,
      quote_id: quoteId,
      attachments,
    });
  }

  /**
   * 投稿を削除します。
   *
   * @param {number} postId - 削除する投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(postId) {
    return this._client._delete(`/server/api/posts/${postId}`);
  }

  /**
   * 投稿にいいねをつけます。
   *
   * @param {number} postId - いいねする投稿 ID
   * @returns {Promise<{ success: boolean }>}
   *
   * @example
   * await client.posts.like(123);
   */
  like(postId) {
    return this._client._post(`/server/api/posts/${postId}/like`, {});
  }

  /**
   * 投稿のいいねを取り消します。
   *
   * @param {number} postId - いいねを取り消す投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  unlike(postId) {
    return this._client._delete(`/server/api/posts/${postId}/like`);
  }

  /**
   * 投稿をスターします（ブックマーク的な機能）。
   *
   * @param {number} postId - スターする投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  star(postId) {
    return this._client._post(`/server/api/posts/${postId}/star`, {});
  }

  /**
   * 投稿のスターを取り消します。
   *
   * @param {number} postId - スターを取り消す投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  unstar(postId) {
    return this._client._delete(`/server/api/posts/${postId}/star`);
  }

  /**
   * 投稿をリポストします。
   *
   * @param {number} postId - リポストする投稿 ID
   * @returns {Promise<{ success: boolean }>}
   *
   * @example
   * await client.posts.repost(123);
   */
  repost(postId) {
    return this._client._post(`/server/api/posts/${postId}/repost`, {});
  }

  /**
   * リポストを取り消します。
   *
   * @param {number} postId - リポストを取り消す投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  unrepost(postId) {
    return this._client._delete(`/server/api/posts/${postId}/repost`);
  }
}
