/**
 * ユーザー API
 * プロフィール取得・フォロー・検索などを行います。
 */
export class UsersAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
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
    return this._client._get(`/server/api/users/${userId}`);
  }

  /**
   * ユーザー名（ハンドル）でプロフィールを取得します。
   *
   * @param {string} handle - ユーザー名（例: 'nyanko' または 'nyanko@nyaitter.example.com'）
   * @returns {Promise<{ user: object }>}
   *
   * @example
   * const { user } = await client.users.getByHandle('nyanko');
   */
  getByHandle(handle) {
    return this._client._get('/server/api/users/by-handle', { handle });
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
    return this._client._get('/server/api/users/search', { q: query, limit, offset });
  }

  /**
   * ユーザーの投稿一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   *
   * @example
   * const { posts } = await client.users.getPosts(12);
   */
  getPosts(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/server/api/users/${userId}/posts`, { limit, offset });
  }

  /**
   * ユーザーをフォローします。
   *
   * @param {number} userId - フォローするユーザー ID
   * @returns {Promise<{ success: boolean }>}
   *
   * @example
   * await client.users.follow(12);
   */
  follow(userId) {
    return this._client._post(`/server/api/users/${userId}/follow`, {});
  }

  /**
   * ユーザーのフォローを解除します。
   *
   * @param {number} userId - フォロー解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unfollow(userId) {
    return this._client._delete(`/server/api/users/${userId}/follow`);
  }

  /**
   * ユーザーをブロックします。
   *
   * @param {number} userId - ブロックするユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  block(userId) {
    return this._client._post(`/server/api/users/${userId}/block`, {});
  }

  /**
   * ユーザーのブロックを解除します。
   *
   * @param {number} userId - ブロック解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unblock(userId) {
    return this._client._delete(`/server/api/users/${userId}/block`);
  }

  /**
   * 自分のプロフィールを更新します。
   *
   * @param {object} params
   * @param {string} [params.name] - 表示名
   * @param {string} [params.me] - 自己紹介文
   * @returns {Promise<{ user: object }>}
   *
   * @example
   * await client.users.updateProfile({ name: '新しい名前', me: '自己紹介です' });
   */
  updateProfile({ name, me } = {}) {
    return this._client._patch('/server/api/users/me', { name, me });
  }

  /**
   * ユーザーのフォロワー一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ users: object[] }>}
   */
  getFollowers(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/server/api/users/${userId}/followers`, { limit, offset });
  }

  /**
   * ユーザーのフォロー中一覧を取得します。
   *
   * @param {number} userId - ユーザー ID
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ users: object[] }>}
   */
  getFollowing(userId, { limit = 20, offset = 0 } = {}) {
    return this._client._get(`/server/api/users/${userId}/following`, { limit, offset });
  }
}
