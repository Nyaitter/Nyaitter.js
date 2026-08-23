/**
 * ランキング API
 * フォロワー数・投稿数・いいね数・スター数のユーザーランキングを取得します。
 */
export class RankingAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * 自分のランキング順位（フォロワー・投稿・いいね・スター）を取得します。
   *
   * @returns {Promise<{ followers: { rank: number|null, follower_count: number }, posts: { rank: number|null, post_count: number }, likes: { rank: number|null, like_count: number }, stars: { rank: number|null, star_count: number } }>}
   *
   * @example
   * const myRanks = await client.ranking.getMe();
   * console.log('フォロワー順位:', myRanks.followers.rank);
   */
  getMe() {
    return this._client._get('/ranking/me');
  }

  /**
   * 指定した項目のランキング上位ユーザー一覧を取得します。
   *
   * @param {'followers'|'posts'|'likes'|'stars'} type - ランキング項目
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数（最大 100）
   * @returns {Promise<{ data: Array<{ rank: number, id: number, name: string, scid?: string, count: number }> }>}
   *
   * @example
   * const { data } = await client.ranking.get('followers', { limit: 10 });
   * data.forEach((entry) => console.log(`${entry.rank}位: ${entry.name}`));
   */
  get(type, { limit = 50 } = {}) {
    return this._client._get(`/ranking/${type}`, { limit });
  }

  /**
   * フォロワー数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getFollowers({ limit = 50 } = {}) {
    return this.get('followers', { limit });
  }

  /**
   * 投稿数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getPosts({ limit = 50 } = {}) {
    return this.get('posts', { limit });
  }

  /**
   * いいね数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getLikes({ limit = 50 } = {}) {
    return this.get('likes', { limit });
  }

  /**
   * スター数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getStars({ limit = 50 } = {}) {
    return this.get('stars', { limit });
  }
}
