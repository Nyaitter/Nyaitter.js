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
   * @returns {Promise<{ user: import('../models.js').User }>}
   */
  get(userId) {
    return this._client._get(`/users/${encodeURIComponent(userId)}`);
  }

  /**
   * ログイン中のユーザー情報を取得します。
   *
   * @returns {Promise<{ user: import('../models.js').User, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this._client._get('/auth/me');
  }

  getScheduled(userId, { limit = 30, offset = 0 } = {}) { return this._client._get(`/users/${encodeURIComponent(userId)}/scheduled`, { limit, offset }); }
  /** 管理者専用。対象ユーザーの管理ステータスを取得します。 */
  getUserStatus(userId) { return this._client._get(`/users/${encodeURIComponent(userId)}/status`); }
  /** 管理者専用。対象ユーザーの管理ステータスを更新します。 */
  updateUserStatus(userId, body = {}) { return this._client._put(`/users/${encodeURIComponent(userId)}/status`, body); }
  /** 管理者専用。対象ユーザーの管理属性を更新します。 */
  updateUser(userId, body = {}) { return this._client._put(`/users/${encodeURIComponent(userId)}`, body); }
  reassignNyaitterId() { return this._client._post('/users/me/nyaitter-id/reassign', {}); }
  prepareAccountDeletion() { return this._client._post('/users/me/account/delete/prepare', {}); }
  deleteAccount(confirmationToken) { return this._client._delete('/users/me/account', { confirmation_token: confirmationToken }); }

  /** @returns {Promise<import('../models.js').UserStatus>} */
  getStatus() {
    return this._client._get('/users/me/status');
  }

  /**
   * 管理者が利用制限を指定・解除します。
   * @param {number|string} userId
   * @param {{banned: boolean, reason: string}} params - 理由は10文字以上
   * @returns {Promise<{success: boolean}>}
   */
  moderateTrust(userId, { banned, reason } = {}) {
    return this._client._post(`/users/${encodeURIComponent(userId)}/trust-moderation`, { banned, reason });
  }

  /**
   * 管理者が削除済みノートの実績を取り消します。
   * @param {number|string} userId
   * @param {{noteId: number, reason: string}} params - 理由は10文字以上
   * @returns {Promise<{success: boolean}>}
   */
  retractNoteOutcome(userId, { noteId, reason } = {}) {
    return this._client._post(`/users/${encodeURIComponent(userId)}/note-outcome-retract`, { noteId, reason });
  }

  /**
   * ユーザー名でユーザーを検索・取得します。
   *
   * @param {string} handle - ユーザー名
   * @returns {Promise<{ user: import('../models.js').User|null }>}
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
   * @param {string|null} [params.cursor=null] - ページネーションカーソル
   * @returns {Promise<{ users: import('../models.js').User[], has_more?: boolean, next_cursor?: string|null }>}
   */
  search({ query, limit = 20, offset = 0, cursor = null } = {}) {
    return this._client._get('/users/search', {
      q: query,
      limit,
      offset: cursor ? undefined : offset,
      cursor: cursor || undefined,
    });
  }

  /**
   * おすすめユーザー一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 互換用に受理しますが、現行Serverは無視します。
   * @param {number} [params.offset=0] - 互換用に受理しますが、現行Serverは無視します。
   * Serverは件数・offsetを受け付けず固定件数を返します（optionsは旧互換のため受理しますが送信しません）。
   * @returns {Promise<{ users: import('../models.js').User[] }>}
   */
  getRecommended({ limit = 20, offset = 0 } = {}) {
    void limit;
    void offset;
    return this._client._get('/users/recommended');
  }

  /**
   * 複数のユーザー ID からユーザー情報を一括取得します。
   *
   * @param {number[]|string} userIds - ユーザー ID の配列またはカンマ区切り文字列
   * @returns {Promise<{ users: import('../models.js').User[] }>}
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
    return this._client._get(`/users/${encodeURIComponent(userId)}/counts`);
  }

  /**
   * ユーザーが投稿したメディア一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=15] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {string} [params.type] - メディア種類 ('image' | 'video')
   * @param {string} [params.cursor] - キーセットカーソル
   * @returns {Promise<{ media_items: object[], next_cursor?: string|null }>}
   */
  getMedia(userId, { limit = 15, offset = 0, type, cursor } = {}) {
    return this._client._get(`/users/${encodeURIComponent(userId)}/media`, {
      limit,
      offset,
      ...(type ? { type } : {}),
      ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
    });
  }

  /**
   * ユーザーが非公開アカウントかどうかを取得します。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ lock: boolean }>}
   */
  isLocked(userId) {
    return this._client._get(`/users/${encodeURIComponent(userId)}/is-lock`);
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
    return this._client._get(`/users/${encodeURIComponent(userId)}/posts`, { limit, offset, mode });
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
    return this._client._get(`/users/${encodeURIComponent(userId)}/likes`, { limit, offset });
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
    return this._client._get(`/users/${encodeURIComponent(userId)}/stars`, { limit, offset });
  }

  /**
   * ユーザーのフォロワー一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {string|null} [params.cursor=null] - ページネーションカーソル
   * @returns {Promise<{ followers: import('../models.js').User[], has_more: boolean, next_cursor?: string|null }>}
   */
  getFollowers(userId, { limit = 20, offset = 0, cursor = null } = {}) {
    return this._client._get(`/users/${encodeURIComponent(userId)}/followers`, {
      limit,
      offset: cursor ? undefined : offset,
      cursor: cursor || undefined,
    });
  }

  /**
   * ユーザーのフォロー中一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {string|null} [params.cursor=null] - ページネーションカーソル
   * @returns {Promise<{ following: import('../models.js').User[], has_more: boolean, next_cursor?: string|null }>}
   */
  getFollowing(userId, { limit = 20, offset = 0, cursor = null } = {}) {
    return this._client._get(`/users/${encodeURIComponent(userId)}/following`, {
      limit,
      offset: cursor ? undefined : offset,
      cursor: cursor || undefined,
    });
  }

  /**
   * ユーザーの固定投稿 ID を取得します。
   * 名前は複数形ですが、現行Serverの `GET /users/:id/pin` は固定投稿を1件だけ持ち、
   * 戻り値は単数の `{ pin_id }` です（投稿の配列ではありません）。
   *
   * @param {number} userId - ユーザー ID
   * @returns {Promise<{ pin_id: number|null }>}
   */
  getPinnedPosts(userId) {
    return this._client._get(`/users/${encodeURIComponent(userId)}/pin`);
  }

  /**
   * ユーザーをフォローします。
   *
   * @param {number} userId - フォローするユーザー ID
   * @returns {Promise<{ success: boolean, following: boolean, updated_follows: number[] }>}
   */
  follow(userId) {
    return this._client._post(`/users/${encodeURIComponent(userId)}/follow`, {});
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
   * ユーザーのブロック状態を切り替えます（ブロック/ブロック解除）。
   *
   * @param {number} userId - ブロック切り替えするユーザー ID
   * @returns {Promise<{ success: boolean, blocked: boolean, block: number[], user_id: number }>}
   */
  toggleBlock(userId) {
    return this._client._post(`/users/${encodeURIComponent(userId)}/block`, {});
  }

  /**
   * ユーザーをブロックします。
   *
   * @param {number} userId - ブロックするユーザー ID
   * @returns {Promise<{ success: boolean, blocked: boolean, block: number[], user_id: number }>}
   */
  block(userId) {
    return this.toggleBlock(userId);
  }

  /**
   * ユーザーのブロックを解除します。
   *
   * @param {number} userId - ブロック解除するユーザー ID
   * @returns {Promise<{ success: boolean, blocked: boolean, block: number[], user_id: number }>}
   */
  unblock(userId) {
    return this.toggleBlock(userId);
  }

  /**
   * 自分のプロフィールや設定を更新します。
   *
   * @param {object} params
   * @param {string} [params.name] - 表示名
   * @param {string} [params.me] - 自己紹介文（bioの互換alias。両方指定時はServer側でbioが優先）
   * @param {string} [params.bio] - 自己紹介文（meの互換alias。両方指定時はServer側でbioが優先）
   * @param {string} [params.headerImage] - ヘッダー画像 URL / データ
   * @param {string} [params.iconData] - アイコン画像データ
   * @param {import('../models.js').UserSettings} [params.settings] - 表示設定を含む設定。表示ランクの各項目は null で解除
   * @returns {Promise<{ user: import('../models.js').User }>}
   */
  updateProfile({ name, me, bio, headerImage, iconData, settings } = {}) {
    return this._client._put('/users/me', {
      name,
      me,
      bio,
      header_image: headerImage,
      icon_data: iconData,
      settings,
    });
  }

  /**
   * 管理者専用。ログイン履歴・ログを取得します（通常の認証権限では利用できません）。
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
