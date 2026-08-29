/**
 * ユーザーオブジェクトまたはユーザー ID から、適切なアカウントアイコン URL を生成して返します。
 *
 * @param {object|number|string} user - ユーザーオブジェクトまたはユーザー ID
 * @param {object} [options]
 * @param {string} [options.baseUrl] - サーバーのベース URL
 * @returns {string} アイコンの URL
 */
export function getUserIconUrl(user, { baseUrl = '' } = {}) {
  const base = baseUrl ? String(baseUrl).replace(/\/+$/, '') : '';

  if (!user && user !== 0) {
    return base ? `${base}/emoji/neko.svg` : '/emoji/neko.svg';
  }

  if (typeof user === 'number' || (typeof user === 'string' && /^\d+$/.test(user.trim()))) {
    const id = typeof user === 'number' ? user : parseInt(user.trim(), 10);
    if (Number.isSafeInteger(id) && id > 0) {
      return `${base}/users/${encodeURIComponent(String(id))}/icon`;
    }
  }

  if (typeof user === 'object' && user !== null) {
    if (user.icon_available === false) {
      return base ? `${base}/emoji/neko.svg` : '/emoji/neko.svg';
    }

    const iconData =
      typeof user.icon_data === 'string'
        ? user.icon_data.trim()
        : typeof user.iconData === 'string'
          ? user.iconData.trim()
          : '';

    if (iconData) {
      if (/^data:image\//i.test(iconData) || /^https?:\/\//i.test(iconData)) {
        return iconData;
      }
      if (iconData.startsWith('/')) {
        return `${base}${iconData}`;
      }
      return `${base}/${iconData}`;
    }

    const userId = Number(user.id);
    if (Number.isSafeInteger(userId) && userId > 0) {
      return `${base}/users/${encodeURIComponent(String(userId))}/icon`;
    }
  }

  return base ? `${base}/emoji/neko.svg` : '/emoji/neko.svg';
}

export class UsersAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * ユーザーオブジェクトまたはユーザー ID から、適切なアカウントアイコン URL を返します。
   *
   * @param {object|number|string} user - ユーザーオブジェクトまたはユーザー ID
   * @returns {string} アイコンの URL
   */
  getIconUrl(user) {
    return getUserIconUrl(user, { baseUrl: this._client._baseUrl });
  }

  /**
   * ユーザー ID でプロフィールを取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ user: object }>}
   */
  get(userId) {
    return this._client._get(`/users/${userId}`);
  }

  /**
   * ログイン中のユーザー情報を取得します。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this._client._get('/auth/me');
  }

  /**
   * ユーザー名でユーザーを検索・取得します。
   *
   * @param {string} handle - ユーザー名
   * @returns {Promise<{ user: object|null }>}
   */
  async getByHandle(handle) {
    const cleanHandle = String(handle || '').replace(/^[@#]/, '').trim();
    if (!cleanHandle) return { user: null };

    const numericId = parseInt(cleanHandle, 10);
    if (Number.isInteger(numericId) && numericId >= 0 && String(numericId) === cleanHandle) {
      try {
        const res = await this.get(numericId);
        if (res?.user) return res;
      } catch (_) {}
    }

    const { users = [] } = await this.search({ query: cleanHandle, limit: 10 });
    const exact = users.find(
      (u) =>
        String(u.scid || '').toLowerCase() === cleanHandle.toLowerCase() ||
        String(u.name || '').toLowerCase() === cleanHandle.toLowerCase() ||
        String(u.id) === cleanHandle,
    );

    if (exact) {
      return this.get(exact.id);
    }

    return { user: users[0] ? (await this.get(users[0].id)).user : null };
  }

  /**
   * ユーザーを検索します。
   *
   * @param {object} params
   * @param {string} params.query - 検索キーワード
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ users: object[] }>}
   */
  search({ query, limit = 20, offset = 0 } = {}) {
    return this._client._get('/users/search', { q: query, limit, offset });
  }

  /**
   * おすすめユーザー一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ users: object[] }>}
   */
  getRecommended({ limit = 20, offset = 0 } = {}) {
    return this._client._get('/users/recommended', { limit, offset });
  }

  /**
   * 複数のユーザー ID からユーザー情報を一括取得します。
   *
   * @param {number[]|string} userIds - ユーザー ID の配列またはカンマ区切り文字列
   * @returns {Promise<{ users: object[] }>}
   */
  getBatch(userIds) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    return this._client._get('/users', { ids });
  }

  /**
   * `getBatch()` のエイリアスです。
   */
  getUsers(userIds) {
    return this.getBatch(userIds);
  }

  /**
   * ユーザーのカウント情報を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ post_count: number, media_count: number, follower_count: number, following_count: number }>}
   */
  getCounts(userId) {
    return this._client._get(`/users/${userId}/counts`);
  }

  /**
   * ユーザーが投稿したメディア一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=15] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ media_items: object[] }>}
   */
  getMedia(userId, { limit = 15, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/media`, { limit, offset });
  }

  /**
   * ユーザーが非公開アカウントかどうかを取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ lock: boolean }>}
   */
  isLocked(userId) {
    return this._client._get(`/users/${userId}/is-lock`);
  }

  /**
   * ユーザーの投稿一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {'all'|'posts'|'replies'} [params.mode='all'] - 投稿の絞り込み
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[], has_more: boolean }>}
   */
  getPosts(userId, { limit = 20, offset = 0, mode = 'all' } = {}) {
    return this._client._get(`/users/${userId}/posts`, { limit, offset, mode });
  }

  /**
   * ユーザーのリプライ一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ replies: object[], has_more: boolean }>}
   */
  getReplies(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/replies`, { limit, offset });
  }

  /**
   * ユーザーがいいねした投稿一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[], has_more: boolean }>}
   */
  getLikes(userId, { limit = 30, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/likes`, { limit, offset });
  }

  /**
   * ユーザーがスターした投稿一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[], has_more: boolean }>}
   */
  getStars(userId, { limit = 30, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/stars`, { limit, offset });
  }

  /**
   * ユーザーのフォロワー一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ followers: object[], has_more: boolean }>}
   */
  getFollowers(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/followers`, { limit, offset });
  }

  /**
   * ユーザーのフォロー中一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ following: object[], has_more: boolean }>}
   */
  getFollowing(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/users/${userId}/following`, { limit, offset });
  }

  /**
   * ユーザーの固定投稿一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ pinned_posts: object[] }>}
   */
  getPinnedPosts(userId) {
    return this._client._get(`/users/${userId}/pinned-posts`);
  }

  /**
   * 投稿をプロフィールに固定します。
   *
   * @param {number} userId - ユーザー ID
   * @param {number} postId - 投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  pinPost(userId, postId) {
    return this._client._post(`/users/${userId}/pinned-posts/${postId}`, {});
  }

  /**
   * プロフィールの固定投稿を解除します。
   *
   * @param {number} userId - ユーザー ID
   * @param {number} postId - 投稿 ID
   * @returns {Promise<{ success: boolean }>}
   */
  unpinPost(userId, postId) {
    return this._client._delete(`/users/${userId}/pinned-posts/${postId}`);
  }

  /**
   * ユーザーのブロック一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ blocks: object[] }>}
   */
  getBlocks(userId) {
    return this._client._get(`/users/${userId}/blocks`);
  }

  /**
   * ユーザーのミュート一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ mutes: object[] }>}
   */
  getMutes(userId) {
    return this._client._get(`/users/${userId}/mutes`);
  }

  /**
   * ユーザーをミュートします。
   *
   * @param {number} userId - ミュートするユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  mute(userId) {
    return this._client._post(`/users/${userId}/mute`, {});
  }

  /**
   * ユーザーのミュートを解除します。
   *
   * @param {number} userId - ミュート解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unmute(userId) {
    return this._client._delete(`/users/${userId}/mute`);
  }

  /**
   * ユーザーをフォローします。
   *
   * @param {number} userId - フォローするユーザー ID
   * @returns {Promise<{ success: boolean, following: boolean, updated_follows: number[] }>}
   */
  follow(userId) {
    return this._client._post(`/users/${userId}/follow`, {});
  }

  /**
   * ユーザーのフォローを解除します。
   *
   * @param {number} userId - フォロー解除するユーザー ID
   * @returns {Promise<{ success: boolean, following: boolean, updated_follows: number[] }>}
   */
  unfollow(userId) {
    return this.follow(userId);
  }

  /**
   * ユーザーをブロックします。
   *
   * @param {number} userId - ブロックするユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  block(userId) {
    return this._client._post(`/users/${userId}/block`, {});
  }

  /**
   * ユーザーのブロックを解除します。
   *
   * @param {number} userId - ブロック解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unblock(userId) {
    return this._client._delete(`/users/${userId}/block`);
  }

  /**
   * 自分のプロフィールや設定を更新します。
   *
   * @param {object} params
   * @param {string} [params.name] - 表示名
   * @param {string} [params.me] - 自己紹介文
   * @param {string} [params.bio] - 自己紹介文
   * @param {string} [params.headerImage] - ヘッダー画像 URL / データ
   * @param {string} [params.iconData] - アイコン画像データ
   * @param {object} [params.settings] - 設定オブジェクト
   * @returns {Promise<{ user: object }>}
   */
  updateProfile({ name, me, bio, headerImage, iconData, settings } = {}) {
    return this._client._patch('/users/me', {
      name,
      me: me !== undefined ? me : bio,
      bio: bio !== undefined ? bio : me,
      header_image: headerImage,
      icon_data: iconData,
      settings,
    });
  }

  /**
   * ログイン履歴・ログを取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ logs: object[] }>}
   */
  getLogs({ limit = 50, offset = 0 } = {}) {
    return this._client._get('/users/logs', { limit, offset });
  }
}
