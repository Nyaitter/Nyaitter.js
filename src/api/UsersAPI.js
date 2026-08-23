/**
 * ユーザーオブジェクトまたはユーザー ID から、適切なアカウントアイコン URL を生成して返します。
 *
 * @param {object|number|string} user - ユーザーオブジェクト（{ id, icon_data, icon_available }）またはユーザー ID
 * @param {object} [options]
 * @param {string} [options.baseUrl] - サーバーのベース URL（省略時は空文字列）
 * @returns {string} アイコンの URL
 *
 * @example
 * const url = getUserIconUrl(user, { baseUrl: 'https://nyaitter.example.com' });
 */
export function getUserIconUrl(user, { baseUrl = '' } = {}) {
  const base = baseUrl ? String(baseUrl).replace(/\/+$/, '') : '';

  if (!user && user !== 0) {
    return base ? `${base}/emoji/neko.svg` : '/emoji/neko.svg';
  }

  // 数値または数値文字列（ID 直接指定）の場合
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
   * @param {object|number|string} user - ユーザーオブジェクト（{ id, icon_data, icon_available }）またはユーザー ID
   * @returns {string} アイコンの URL
   *
   * @example
   * const iconUrl = client.users.getIconUrl(user);
   * const myIconUrl = client.users.getIconUrl(12);
   */
  getIconUrl(user) {
    return getUserIconUrl(user, { baseUrl: this._client._baseUrl });
  }

  /**
   * ユーザー ID でプロフィールを取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ user: object }>}
   *
   * @example
   * const { user } = await client.users.get(12);
   * console.log(user.name);
   */
  get(userId) {
    return this._client._get(`/users/${userId}`);
  }

  /**
   * ログイン中のユーザー（Bot の所有者アカウント）の情報を取得します。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   *
   * @example
   * const { user } = await client.users.getMe();
   * console.log(`ログイン中: ${user.name}`);
   */
  getMe() {
    return this._client._get('/auth/me');
  }

  /**
   * ユーザー名（ハンドル / Scratch ID / NyaitterID）でユーザーを検索・取得します。
   *
   * @param {string} handle - ユーザー名（例: 'nyanko' または '12'）
   * @returns {Promise<{ user: object|null }>}
   *
   * @example
   * const { user } = await client.users.getByHandle('nyanko');
   */
  async getByHandle(handle) {
    const cleanHandle = String(handle || '').replace(/^[@#]/, '').trim();
    if (!cleanHandle) return { user: null };

    // 数値 ID の場合は直接取得を試みる
    const numericId = parseInt(cleanHandle, 10);
    if (Number.isInteger(numericId) && numericId >= 0 && String(numericId) === cleanHandle) {
      try {
        const res = await this.get(numericId);
        if (res?.user) return res;
      } catch (_) {}
    }

    // 検索エンドポイントでハンドル一致を探す
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
   *
   * @example
   * const { users } = await client.users.search({ query: 'nyanko' });
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
   * ユーザーのカウント情報（投稿数・メディア数・フォロワー数・フォロー数）を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ post_count: number, media_count: number, follower_count: number, following_count: number }>}
   */
  getCounts(userId) {
    return this._client._get(`/users/${userId}/counts`);
  }

  /**
   * ユーザーが投稿したメディア（画像など）一覧を取得します。
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
   * ユーザーが非公開アカウント（鍵垢）かどうかを取得します。
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
   * @param {'all'|'posts'|'replies'} [params.mode='all'] - 投稿の絞り込み（'all': すべて、'posts': 通常投稿のみ、'replies': リプライのみ）
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[], has_more: boolean }>}
   *
   * @example
   * const { posts } = await client.users.getPosts(12, { mode: 'posts' });
   */
  getPosts(userId, { limit = 20, offset = 0, mode = 'all' } = {}) {
    return this._client._get(`/users/${userId}/posts`, { limit, offset, mode });
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
   * ユーザーの固定投稿 ID を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ pin_id: number|null }>}
   */
  getPinnedPost(userId) {
    return this._client._get(`/users/${userId}/pin`);
  }

  /**
   * ユーザーのアイコン画像の URL を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {string} アイコン画像の URL
   */
  getIconUrl(userId) {
    return `${this._client._baseUrl}/users/${userId}/icon`;
  }

  /**
   * ユーザーをフォローします（トグル）。
   *
   * @param {number} userId - フォローするユーザー ID
   * @returns {Promise<{ success: boolean, following: boolean, updated_follows: number[] }>}
   *
   * @example
   * const res = await client.users.follow(12);
   * console.log('フォロー中:', res.following);
   */
  follow(userId) {
    return this._client._post(`/users/${userId}/follow`, {});
  }

  /**
   * ユーザーのフォローを解除します。
   * サーバー側でトグル処理されるため、フォロー済みの場合は解除されます。
   *
   * @param {number} userId - フォロー解除するユーザー ID
   * @returns {Promise<{ success: boolean, following: boolean, updated_follows: number[] }>}
   */
  unfollow(userId) {
    return this.follow(userId);
  }

  /**
   * 自分のプロフィールや設定を更新します。
   *
   * @param {object} params
   * @param {string} [params.name] - 表示名
   * @param {string} [params.me] - 自己紹介文
   * @param {string} [params.bio] - 自己紹介文（me の別名）
   * @param {string} [params.headerImage] - ヘッダー画像 URL / データ
   * @param {string} [params.iconData] - アイコン画像データ
   * @param {object} [params.settings] - 設定オブジェクト
   * @param {number[]} [params.block] - ブロックユーザー ID 配列
   * @returns {Promise<{ user: object }>}
   *
   * @example
   * await client.users.updateProfile({ name: '新しい名前', me: '自己紹介です' });
   */
  updateProfile({ name, me, bio, headerImage, iconData, settings, block } = {}) {
    return this._client._put('/users/me', {
      name,
      me: me !== undefined ? me : bio,
      bio: bio !== undefined ? bio : me,
      header_image: headerImage,
      icon_data: iconData,
      settings,
      block,
    });
  }

  /**
   * ユーザーをブロックします。
   *
   * @param {number} userId - ブロックするユーザー ID
   * @returns {Promise<{ user: object }>}
   */
  async block(userId) {
    const meRes = await this.getMe();
    const currentBlocks = Array.isArray(meRes?.user?.block) ? meRes.user.block.map(Number) : [];
    if (!currentBlocks.includes(Number(userId))) {
      currentBlocks.push(Number(userId));
    }
    return this.updateProfile({ block: currentBlocks });
  }

  /**
   * ユーザーのブロックを解除します。
   *
   * @param {number} userId - ブロック解除するユーザー ID
   * @returns {Promise<{ user: object }>}
   */
  async unblock(userId) {
    const meRes = await this.getMe();
    const currentBlocks = Array.isArray(meRes?.user?.block)
      ? meRes.user.block.map(Number).filter((id) => id !== Number(userId))
      : [];
    return this.updateProfile({ block: currentBlocks });
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

