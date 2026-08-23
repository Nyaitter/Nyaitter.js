/**
 * 投稿 API
 * 投稿の作成・取得・編集・削除・いいね・スター・リポスト・検索・トレンドなどを行います。
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
    return this._client._get('/posts/page', {
      mode: 'timeline',
      tab,
      limit,
      offset,
      before_id: beforeId,
    });
  }

  /**
   * おすすめ投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - このID以前の投稿を取得
   * @returns {Promise<{ posts: object[], has_next?: boolean, next_cursor?: any }>}
   */
  getRecommended({ limit = 20, offset = 0, beforeId } = {}) {
    return this._client._get('/posts/recommended', {
      limit,
      offset,
      before_id: beforeId,
    });
  }

  /**
   * トレンド投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @returns {Promise<{ posts: object[] }>}
   */
  getTrending({ limit = 20 } = {}) {
    return this._client._get('/posts/trending', { limit });
  }

  /**
   * トレンドハッシュタグ一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=10] - 取得件数
   * @returns {Promise<{ trends: Array<{ tag: string, count: number }> }>}
   */
  getTrendingHashtags({ limit = 10 } = {}) {
    return this._client._get('/posts/trending-hashtags', { limit });
  }

  /**
   * 投稿を検索します。
   *
   * @param {object} params
   * @param {string} params.query - 検索キーワード
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - このID以前の投稿を取得
   * @returns {Promise<{ posts: object[], has_next?: boolean, next_cursor?: any }>}
   *
   * @example
   * const { posts } = await client.posts.search({ query: 'ねこ' });
   */
  search({ query, limit = 20, offset = 0, beforeId } = {}) {
    return this._client._get('/posts/search', {
      q: query,
      limit,
      offset,
      before_id: beforeId,
    });
  }

  /**
   * タイムライン・おすすめ・検索・プロフィール等の投稿ページを汎用取得します。
   *
   * @param {object} [params]
   * @param {'timeline'|'recommended'|'search'|'profile'|'ids'} [params.mode='timeline'] - ページモード
   * @param {'foryou'|'following'} [params.tab='foryou'] - タイムライン時のタブ
   * @param {string} [params.query] - 検索クエリ（mode: 'search'）
   * @param {number} [params.userId] - ユーザーID（mode: 'profile'）
   * @param {'all'|'posts_only'|'replies_only'} [params.subType='all'] - プロフィール絞り込み
   * @param {number} [params.pinId] - 固定投稿ID
   * @param {number[]|string} [params.ids] - 投稿IDリスト（mode: 'ids'）
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - カーソル（投稿ID）
   * @returns {Promise<{ posts: object[], has_more: boolean, next_cursor: any, context?: any, meta?: any }>}
   */
  getPage({
    mode = 'timeline',
    tab = 'foryou',
    query,
    userId,
    subType = 'all',
    pinId,
    ids,
    limit = 30,
    offset = 0,
    beforeId,
  } = {}) {
    return this._client._get('/posts/page', {
      mode,
      tab,
      q: query,
      user_id: userId,
      sub_type: subType,
      pin_id: pinId,
      ids: Array.isArray(ids) ? ids.join(',') : ids,
      limit,
      offset,
      before_id: beforeId,
    });
  }

  /**
   * タイムラインの投稿 ID 一覧のみを軽量に取得します。
   *
   * @param {object} [params]
   * @param {'foryou'|'following'} [params.tab='foryou'] - タブ
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ ids: number[], has_more: boolean }>}
   */
  getIds({ tab = 'foryou', limit = 30, offset = 0 } = {}) {
    return this._client._get('/posts/ids', { tab, limit, offset });
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
    return this._client._get(`/posts/${postId}`);
  }

  /**
   * 投稿のリプライ一覧を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ replies: object[], has_more: boolean, offset: number, limit: number }>}
   */
  getReplies(postId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/posts/${postId}/replies`, { limit, offset });
  }

  /**
   * 投稿のスレッド（親投稿＋リプライ階層）を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ post: object, replies: object[], has_more: boolean, offset: number, limit: number }>}
   */
  getThread(postId, { limit = 50, offset = 0 } = {}) {
    return this._client._get(`/posts/${postId}/thread`, { limit, offset });
  }

  /**
   * 新しい投稿を作成します。
   *
   * @param {object} params
   * @param {string} [params.content] - 投稿本文
   * @param {number} [params.replyToId] - 返信先の投稿 ID（返信投稿の場合）
   * @param {number} [params.quoteId] - 引用・リポストする投稿 ID
   * @param {Array<object>} [params.attachments] - 添付ファイル一覧
   * @param {boolean} [params.mask=false] - 閲覧注意（CW）マスクフラグ
   * @param {boolean} [params.lock=false] - フォロワー限定公開フラグ
   * @param {boolean} [params.announcement=false] - アナウンス投稿フラグ（管理者のみ）
   * @param {string} [params.groupId] - グループ内投稿時のグループID
   * @param {boolean} [params.groupAnnouncement=false] - グループ内アナウンスフラグ
   * @param {number} [params.postAsUserId] - インポスター等の代理投稿ユーザーID
   * @returns {Promise<{ success: boolean, queued: boolean, action_id?: string }>}
   *
   * @example
   * // 通常投稿
   * await client.posts.create({ content: 'こんにちは！' });
   *
   * // 返信
   * await client.posts.create({ content: '返信です', replyToId: 123 });
   *
   * // 画像付き投稿
   * await client.posts.create({
   *   content: '画像添付テスト',
   *   attachments: [{ id: 'attachments/12/example.png' }],
   * });
   */
  create({
    content,
    replyToId,
    quoteId,
    attachments,
    mask = false,
    lock = false,
    announcement = false,
    groupId,
    groupAnnouncement = false,
    postAsUserId,
  } = {}) {
    return this._client._post('/posts', {
      content,
      reply_to: replyToId,
      repost_to: quoteId,
      attachments,
      mask: Boolean(mask),
      lock: Boolean(lock),
      announcement: Boolean(announcement),
      group_id: groupId,
      group_announcement: Boolean(groupAnnouncement),
      post_as_user_id: postAsUserId,
    });
  }

  /**
   * 投稿を編集・更新します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} params
   * @param {string} params.content - 更新後の投稿本文
   * @param {Array<object>} [params.attachments] - 添付ファイル
   * @param {boolean} [params.mask] - 閲覧注意マスク
   * @param {boolean} [params.lock] - 鍵（フォロワー限定）
   * @returns {Promise<{ success: boolean, post: object }>}
   */
  update(postId, { content, attachments, mask, lock } = {}) {
    return this._client._put(`/posts/${postId}`, {
      content,
      attachments,
      mask,
      lock,
    });
  }

  /**
   * `update()` のエイリアスです。
   */
  edit(postId, params) {
    return this.update(postId, params);
  }

  /**
   * 投稿を削除します。
   *
   * @param {number} postId - 削除する投稿 ID
   * @returns {Promise<{ success: boolean, queued: boolean, action_id?: string }>}
   */
  delete(postId) {
    return this._client._delete(`/posts/${postId}`);
  }

  /**
   * 投稿にいいねをつけます（トグル）。
   *
   * @param {number} postId - いいねする投稿 ID
   * @returns {Promise<{ success: boolean, liked: boolean, count: number, updated_likes: number[] }>}
   *
   * @example
   * const res = await client.posts.like(123);
   * console.log('いいね状態:', res.liked);
   */
  like(postId) {
    return this._client._post(`/posts/${postId}/like`, {});
  }

  /**
   * 投稿のいいねを取り消します。
   * サーバー側でトグル処理されるため、いいね済みの投稿に対して実行すると解除されます。
   *
   * @param {number} postId - いいねを取り消す投稿 ID
   * @returns {Promise<{ success: boolean, liked: boolean, count: number, updated_likes: number[] }>}
   */
  unlike(postId) {
    return this.like(postId);
  }

  /**
   * 投稿をスターします（ブックマーク的な機能、トグル）。
   *
   * @param {number} postId - スターする投稿 ID
   * @returns {Promise<{ success: boolean, starred: boolean, count: number, updated_stars: number[] }>}
   */
  star(postId) {
    return this._client._post(`/posts/${postId}/star`, {});
  }

  /**
   * 投稿のスターを取り消します。
   *
   * @param {number} postId - スターを取り消す投稿 ID
   * @returns {Promise<{ success: boolean, starred: boolean, count: number, updated_stars: number[] }>}
   */
  unstar(postId) {
    return this.star(postId);
  }

  /**
   * 投稿をリポストします。
   *
   * @param {number} postId - リポストする投稿 ID
   * @returns {Promise<{ success: boolean, post: object }>}
   *
   * @example
   * await client.posts.repost(123);
   */
  repost(postId) {
    return this._client._post(`/posts/${postId}/repost`, {});
  }

  /**
   * リポストを取り消します（リポスト投稿自体を削除します）。
   *
   * @param {number} repostPostId - 削除するリポスト投稿の ID
   * @returns {Promise<{ success: boolean }>}
   */
  unrepost(repostPostId) {
    return this.delete(repostPostId);
  }

  /**
   * 指定した投稿のリポスト一覧を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ reposts: object[] }>}
   */
  getReposts(postId, { limit = 50 } = {}) {
    return this._client._get(`/posts/${postId}/reposts`, { limit });
  }

  /**
   * 投稿をプロフィールにピン留め / 解除します（トグル）。
   *
   * @param {number} postId - ピン留めする投稿 ID
   * @returns {Promise<{ success: boolean, pinned: boolean, pin_id: number|null }>}
   */
  pin(postId) {
    return this._client._post(`/posts/${postId}/pin`, {});
  }

  /**
   * 複数の投稿 ID を一括で詳細データに変換（ハイドレーション）します。
   *
   * @param {number[]} postIds - 取得する投稿 ID 配列
   * @returns {Promise<{ posts: object[] }>}
   */
  hydrate(postIds) {
    return this._client._post('/posts/hydrate', { post_ids: postIds });
  }

  /**
   * 複数の投稿 ID のメトリクス（いいね数・スター数・リプライ数・リポスト数）を一括取得します。
   *
   * @param {number[]} postIds - 投稿 ID 配列
   * @returns {Promise<{ metrics: Array<{ post_id: number, like_count: number, star_count: number, reply_count: number, repost_count: number }> }>}
   */
  getMetrics(postIds) {
    return this._client._post('/posts/metrics', { post_ids: postIds });
  }
}

