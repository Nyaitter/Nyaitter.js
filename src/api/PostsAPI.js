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
   * タイムラインの投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {'foryou'|'following'} [params.tab='foryou'] - タブ
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - このID以前の投稿を取得
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
   * 指定したハッシュタグの投稿一覧を取得します。
   *
   * @param {string} tag - ハッシュタグ
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getByTag(tag, { limit = 20, offset = 0 } = {}) {
    const cleanTag = String(tag || '').replace(/^#/, '').trim();
    return this._client._get(`/posts/tags/${encodeURIComponent(cleanTag)}`, { limit, offset });
  }

  /**
   * ログイン中ユーザーがいいねした投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getLiked({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/posts/liked', { limit, offset });
  }

  /**
   * ログイン中ユーザーがスターした投稿一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getStarred({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/posts/starred', { limit, offset });
  }

  /**
   * タイムライン・おすすめ・検索・プロフィール等の投稿ページを汎用取得します。
   *
   * @param {object} [params]
   * @param {'timeline'|'recommended'|'search'|'profile'|'ids'} [params.mode='timeline'] - ページモード
   * @param {'foryou'|'following'} [params.tab='foryou'] - タイムライン時のタブ
   * @param {string} [params.query] - 検索クエリ
   * @param {number} [params.userId] - ユーザーID
   * @param {'all'|'posts_only'|'replies_only'} [params.subType='all'] - プロフィール絞り込み
   * @param {number} [params.pinId] - 固定投稿ID
   * @param {number[]|string} [params.ids] - 投稿IDリスト
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - カーソル
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
   * 投稿のスレッドを取得します。
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
   * 投稿のリアクション詳細を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @returns {Promise<{ reactions: object }>}
   */
  getReactions(postId) {
    return this._client._get(`/posts/${postId}/reactions`);
  }

  /**
   * 投稿の引用ポスト一覧を取得します。
   *
   * @param {number} postId - 投稿 ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ quotes: object[] }>}
   */
  getQuotes(postId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/posts/${postId}/quotes`, { limit, offset });
  }

  /**
   * 新しい投稿を作成します。
   *
   * @param {object} params
   * @param {string} [params.content] - 投稿本文
   * @param {number} [params.replyToId] - 返信先の投稿 ID
   * @param {number} [params.quoteId] - 引用・リポストする投稿 ID
   * @param {Array<object>} [params.attachments] - 添付ファイル/投票一覧
   * @param {boolean} [params.mask=false] - 閲覧注意マスクフラグ
   * @param {boolean} [params.lock=false] - フォロワー限定公開フラグ
   * @param {boolean} [params.announcement=false] - アナウンス投稿フラグ
   * @param {string} [params.groupId] - グループ内投稿時のグループID
   * @param {boolean} [params.groupAnnouncement=false] - グループ内アナウンスフラグ
   * @param {'everyone'|'following'|'mentioned_only'} [params.replyControl='everyone'] - 返信可能範囲
   * @param {number} [params.postAsUserId] - インポスター等の代理投稿ユーザーID
   * @returns {Promise<{ success: boolean, queued: boolean, action_id?: string }>}
   *
   * @example
   * // 通常投稿
   * await client.posts.create({ content: 'こんにちは！' });
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
    replyControl = 'everyone',
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
      reply_control: replyControl,
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
   * @param {boolean} [params.lock] - 鍵
   * @returns {Promise<{ success: boolean, post: object }>}
   */
  update(postId, { content, attachments, mask, lock } = {}) {
    return this._client._patch(`/posts/${postId}`, {
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
   * 投稿にいいねをつけます。
   *
   * @param {number} postId - いいねする投稿 ID
   * @returns {Promise<{ success: boolean, liked: boolean, count: number, updated_likes: number[] }>}
   */
  like(postId) {
    return this._client._post(`/posts/${postId}/like`, {});
  }

  /**
   * 投稿のいいねを取り消します。
   *
   * @param {number} postId - いいねを取り消す投稿 ID
   * @returns {Promise<{ success: boolean, liked: boolean, count: number, updated_likes: number[] }>}
   */
  unlike(postId) {
    return this.like(postId);
  }

  /**
   * 投稿をスターします。
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
   */
  repost(postId) {
    return this._client._post(`/posts/${postId}/repost`, {});
  }

  /**
   * リポストを取り消します。
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
   * 投稿をプロフィールにピン留め / 解除します。
   *
   * @param {number} postId - ピン留めする投稿 ID
   * @returns {Promise<{ success: boolean, pinned: boolean, pin_id: number|null }>}
   */
  pin(postId) {
    return this._client._post(`/posts/${postId}/pin`, {});
  }

  /**
   * 投稿を既読として送信します。
   *
   * @param {number[]|number} postIds - 既読にする投稿 ID 配列
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(postIds) {
    const ids = Array.isArray(postIds) ? postIds : [postIds];
    return this._client._post('/posts/read', { post_ids: ids });
  }

  /**
   * 複数の投稿 ID を一括で詳細データに変換します。
   *
   * @param {number[]} postIds - 取得する投稿 ID 配列
   * @returns {Promise<{ posts: object[] }>}
   */
  hydrate(postIds) {
    return this._client._post('/posts/hydrate', { post_ids: postIds });
  }

  /**
   * 複数の投稿 ID のメトリクスを一括取得します。
   *
   * @param {number[]} postIds - 投稿 ID 配列
   * @returns {Promise<{ metrics: Array<{ post_id: number, like_count: number, star_count: number, reply_count: number, repost_count: number }> }>}
   */
  getMetrics(postIds) {
    return this._client._post('/posts/metrics', { post_ids: postIds });
  }
}
