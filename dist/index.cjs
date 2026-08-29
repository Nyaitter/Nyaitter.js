var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// Nyaitter.js/src/index.js
var index_exports = {};
__export(index_exports, {
  AppealsAPI: () => AppealsAPI,
  AuthAPI: () => AuthAPI,
  DmAPI: () => DmAPI,
  GroupsAPI: () => GroupsAPI,
  ImpostersAPI: () => ImpostersAPI,
  NotificationsAPI: () => NotificationsAPI,
  NyaitterAuthAPI: () => NyaitterAuthAPI,
  NyaitterClient: () => NyaitterClient,
  NyaitterError: () => NyaitterError,
  OEmbedAPI: () => OEmbedAPI,
  PollsAPI: () => PollsAPI,
  PostsAPI: () => PostsAPI,
  PushAPI: () => PushAPI,
  RankingAPI: () => RankingAPI,
  RealtimeClient: () => RealtimeClient,
  ReportsAPI: () => ReportsAPI,
  RulesAPI: () => RulesAPI,
  SystemAPI: () => SystemAPI,
  UIAPI: () => UIAPI,
  UploadsAPI: () => UploadsAPI,
  UrlCardsAPI: () => UrlCardsAPI,
  UsersAPI: () => UsersAPI,
  VerificationAPI: () => VerificationAPI,
  getGroupIconUrl: () => getGroupIconUrl,
  getUserIconUrl: () => getUserIconUrl
});
module.exports = __toCommonJS(index_exports);

// Nyaitter.js/src/api/AuthAPI.js
var AuthAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  getProvidersResponse() {
    return this._client.requestResponse("/auth/providers");
  }
  pollLoginApprovalResponse(approvalId, approvalToken) {
    return this._client.requestResponse(`/auth/login-approvals/${encodeURIComponent(approvalId)}/poll`, {
      method: "POST",
      body: { approval_token: approvalToken }
    });
  }
  generateScratchResponse(username) {
    return this._client.requestResponse("/auth/scratch/generate", {
      method: "POST",
      body: { type: "generateCode", username }
    });
  }
  verifyScratchResponse(body) {
    return this._client.requestResponse("/auth/scratch/verify", { method: "POST", body });
  }
  initiateEmailResponse(email) {
    return this._client.requestResponse("/auth/email/initiate", { method: "POST", body: { email } });
  }
  verifyEmailResponse(body) {
    return this._client.requestResponse("/auth/email/verify", { method: "POST", body });
  }
  initiatePasskeyResponse(body = {}) {
    return this._client.requestResponse("/auth/passkey/initiate", { method: "POST", body });
  }
  verifyPasskeyResponse(body) {
    return this._client.requestResponse("/auth/passkey/verify", { method: "POST", body });
  }
  initiateNyaitterResponse(body) {
    return this._client.requestResponse("/auth/nyaitter/initiate", { method: "POST", body });
  }
  verifyProviderResponse(provider, body) {
    return this._client.requestResponse(`/auth/${encodeURIComponent(provider)}/verify`, {
      method: "POST",
      body
    });
  }
  /**
   * ログインしてセッショントークンを取得します。
   *
   * @param {object} params
   * @param {string} params.username - ユーザー名または Scratch ID
   * @param {string} params.password - パスワード
   * @param {string} [params.token2fa] - 2要素認証コード
   * @returns {Promise<{ success: boolean, token?: string, user?: object, require_2fa?: boolean }>}
   */
  login({ username, password, token2fa } = {}) {
    return this._client._post("/auth/login", {
      username,
      password,
      token_2fa: token2fa
    });
  }
  /**
   * ログアウトします。
   *
   * @returns {Promise<{ success: boolean }>}
   */
  logout() {
    return this._client._post("/auth/logout", {});
  }
  /**
   * ログイン中のユーザー情報を取得します。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this._client._get("/auth/me");
  }
  /**
   * 新規アカウントを登録します。
   *
   * @param {object} params
   * @param {string} params.scratchId - Scratch ユーザー名
   * @param {string} params.password - パスワード
   * @param {string} [params.username] - 表示名
   * @param {string} [params.email] - メールアドレス
   * @returns {Promise<{ success: boolean, user: object, token?: string }>}
   */
  register({ scratchId, password, username, email } = {}) {
    return this._client._post("/auth/register", {
      scratch_id: scratchId,
      password,
      username,
      email
    });
  }
  /**
   * Scratch 認証用の確認コードを取得します。
   *
   * @param {string} scratchId - Scratch ユーザー名
   * @returns {Promise<{ success: boolean, code: string }>}
   */
  checkScratch(scratchId) {
    return this._client._post("/auth/check-scratch", { scratch_id: scratchId });
  }
  /**
   * Scratch プロフィール確認コードを検証してアカウントを連携します。
   *
   * @param {object} params
   * @param {string} params.scratchId - Scratch ユーザー名
   * @param {string} params.code - 確認コード
   * @returns {Promise<{ success: boolean, verified: boolean }>}
   */
  linkScratch({ scratchId, code } = {}) {
    return this._client._post("/auth/link-scratch", {
      scratch_id: scratchId,
      code
    });
  }
  /**
   * 連携されているサブアカウント一覧を取得します。
   *
   * @returns {Promise<{ accounts: object[] }>}
   */
  getAccounts() {
    return this._client._get("/auth/accounts");
  }
  /**
   * 操作対象のアカウントを切り替えます。
   *
   * @param {object} params
   * @param {number} params.accountId - 切り替え先のアカウント ID
   * @param {string} [params.password] - パスワード
   * @returns {Promise<{ success: boolean, token?: string, user: object }>}
   */
  switchAccount({ accountId, password } = {}) {
    return this._client._post("/auth/accounts/switch", {
      account_id: accountId,
      password
    });
  }
  /**
   * 既存のアカウントをサブアカウントとして連携します。
   *
   * @param {object} params
   * @param {number|string} params.accountId - 連携するアカウント ID またはユーザー名
   * @param {string} params.password - パスワード
   * @returns {Promise<{ success: boolean, accounts: object[] }>}
   */
  linkAccount({ accountId, password } = {}) {
    return this._client._post("/auth/accounts/link", {
      account_id: accountId,
      password
    });
  }
  /**
   * サブアカウントの連携を解除します。
   *
   * @param {number} accountId - 解除するアカウント ID
   * @returns {Promise<{ success: boolean }>}
   */
  unlinkAccount(accountId) {
    return this._client._delete("/auth/accounts/unlink", {
      account_id: accountId
    });
  }
  /**
   * 2要素認証（2FA）のセットアップを開始します。
   *
   * @returns {Promise<{ secret: string, qr_code_uri: string }>}
   */
  setup2FA() {
    return this._client._post("/auth/2fa/setup", {});
  }
  /**
   * 2要素認証（2FA）を有効化します。
   *
   * @param {object} params
   * @param {string} params.code - 認証アプリの 6 桁コード
   * @param {string} params.secret - セットアップ時に取得したシークレット
   * @returns {Promise<{ success: boolean }>}
   */
  verify2FA({ code, secret } = {}) {
    return this._client._post("/auth/2fa/verify", { code, secret });
  }
  /**
   * 2要素認証（2FA）を無効化します。
   *
   * @param {string} code - 認証アプリの 6 桁コード
   * @returns {Promise<{ success: boolean }>}
   */
  disable2FA(code) {
    return this._client._post("/auth/2fa/disable", { code });
  }
  /**
   * アクティブなログインセッション一覧を取得します。
   *
   * @returns {Promise<{ sessions: object[] }>}
   */
  getSessions() {
    return this._client._get("/auth/sessions");
  }
  /**
   * 指定したログインセッションを取り消し（切断）します。
   *
   * @param {string} sessionId - セッション ID
   * @returns {Promise<{ success: boolean }>}
   */
  revokeSession(sessionId) {
    return this._client._post("/auth/sessions/revoke", { session_id: sessionId });
  }
  /**
   * 外部ログイン認証を開始します。
   *
   * @param {object} params
   * @param {string} params.provider - 認証プロバイダー名
   * @param {string} [params.redirectUri] - リダイレクト URL
   * @returns {Promise<{ auth_url: string, token: string }>}
   */
  startExternalAuth({ provider, redirectUri } = {}) {
    return this._client._post("/auth/external/start", {
      provider,
      redirect_uri: redirectUri
    });
  }
  /**
   * 外部認証の確認を行います。
   *
   * @param {object} params
   * @param {string} params.token - 外部認証トークン
   * @param {string} [params.password] - パスワード
   * @returns {Promise<{ success: boolean }>}
   */
  confirmExternalAuth({ token, password } = {}) {
    return this._client._post("/auth/external/confirm", { token, password });
  }
  /**
   * 外部認証を完了しログインします。
   *
   * @param {string} token - 外部認証トークン
   * @returns {Promise<{ success: boolean, token?: string, user?: object }>}
   */
  completeExternalAuth(token) {
    return this._client._post("/auth/external/complete", { token });
  }
  /**
   * アカウント削除を申請します。
   *
   * @param {string} password - アカウントのパスワード
   * @returns {Promise<{ success: boolean, scheduled_deletion_at: string }>}
   */
  requestAccountDeletion(password) {
    return this._client._post("/auth/account-deletion/request", { password });
  }
  /**
   * アカウント削除申請を取り消します。
   *
   * @param {string} password - アカウントのパスワード
   * @returns {Promise<{ success: boolean }>}
   */
  cancelAccountDeletion(password) {
    return this._client._post("/auth/account-deletion/cancel", { password });
  }
};

// Nyaitter.js/src/api/PostsAPI.js
var PostsAPI = class {
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
  getTimeline({ tab = "foryou", limit = 20, offset = 0, beforeId } = {}) {
    return this._client._get("/posts/page", {
      mode: "timeline",
      tab,
      limit,
      offset,
      before_id: beforeId
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
    return this._client._get("/posts/recommended", {
      limit,
      offset,
      before_id: beforeId
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
    return this._client._get("/posts/trending", { limit });
  }
  /**
   * トレンドハッシュタグ一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=10] - 取得件数
   * @returns {Promise<{ trends: Array<{ tag: string, count: number }> }>}
   */
  getTrendingHashtags({ limit = 10 } = {}) {
    return this._client._get("/posts/trending-hashtags", { limit });
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
    return this._client._get("/posts/search", {
      q: query,
      limit,
      offset,
      before_id: beforeId
    });
  }
  /**
   * 指定したハッシュタグの投稿一覧を取得します。
   *
   * @param {string} tag - ハッシュタグ（#なし）
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[] }>}
   */
  getByTag(tag, { limit = 20, offset = 0 } = {}) {
    const cleanTag = String(tag || "").replace(/^#/, "").trim();
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
    return this._client._get("/posts/liked", { limit, offset });
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
    return this._client._get("/posts/starred", { limit, offset });
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
    mode = "timeline",
    tab = "foryou",
    query,
    userId,
    subType = "all",
    pinId,
    ids,
    limit = 30,
    offset = 0,
    beforeId
  } = {}) {
    return this._client._get("/posts/page", {
      mode,
      tab,
      q: query,
      user_id: userId,
      sub_type: subType,
      pin_id: pinId,
      ids: Array.isArray(ids) ? ids.join(",") : ids,
      limit,
      offset,
      before_id: beforeId
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
  getIds({ tab = "foryou", limit = 30, offset = 0 } = {}) {
    return this._client._get("/posts/ids", { tab, limit, offset });
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
   * 投稿のリアクション詳細（いいねしたユーザー等）を取得します。
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
   * @param {number} [params.replyToId] - 返信先の投稿 ID（返信投稿の場合）
   * @param {number} [params.quoteId] - 引用・リポストする投稿 ID
   * @param {Array<object>} [params.attachments] - 添付ファイル/投票一覧
   * @param {boolean} [params.mask=false] - 閲覧注意（CW）マスクフラグ
   * @param {boolean} [params.lock=false] - フォロワー限定公開フラグ
   * @param {boolean} [params.announcement=false] - アナウンス投稿フラグ（管理者のみ）
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
    replyControl = "everyone",
    postAsUserId
  } = {}) {
    return this._client._post("/posts", {
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
      post_as_user_id: postAsUserId
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
    return this._client._patch(`/posts/${postId}`, {
      content,
      attachments,
      mask,
      lock
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
   * 投稿をスターします（トグル）。
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
   * 投稿を既読として送信します。
   *
   * @param {number[]|number} postIds - 既読にする投稿 ID 配列
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(postIds) {
    const ids = Array.isArray(postIds) ? postIds : [postIds];
    return this._client._post("/posts/read", { post_ids: ids });
  }
  /**
   * 複数の投稿 ID を一括で詳細データに変換（ハイドレーション）します。
   *
   * @param {number[]} postIds - 取得する投稿 ID 配列
   * @returns {Promise<{ posts: object[] }>}
   */
  hydrate(postIds) {
    return this._client._post("/posts/hydrate", { post_ids: postIds });
  }
  /**
   * 複数の投稿 ID のメトリクスを一括取得します。
   *
   * @param {number[]} postIds - 投稿 ID 配列
   * @returns {Promise<{ metrics: Array<{ post_id: number, like_count: number, star_count: number, reply_count: number, repost_count: number }> }>}
   */
  getMetrics(postIds) {
    return this._client._post("/posts/metrics", { post_ids: postIds });
  }
};

// Nyaitter.js/src/api/PollsAPI.js
var PollsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 投票データを取得します。
   *
   * @param {string} pollId - 投票 ID
   * @returns {Promise<{ poll: object }>}
   *
   * @example
   * const { poll } = await client.polls.get('poll-id');
   * console.log('選択肢:', poll.options);
   */
  get(pollId) {
    return this._client._get(`/polls/${pollId}`);
  }
  /**
   * 投票を実行します。
   *
   * @param {string} pollId - 投票 ID
   * @param {object} params
   * @param {number[]|number} [params.optionIds] - 投票する選択肢のインデックス配列（または単一の番号）
   * @param {string} [params.otherText] - 「その他」選択時の自由記述テキスト
   * @returns {Promise<{ poll: object }>}
   *
   * @example
   * const { poll } = await client.polls.vote('poll-id', {
   *   optionIds: [0],
   * });
   */
  vote(pollId, { optionIds, otherText } = {}) {
    const rawIds = Array.isArray(optionIds) ? optionIds : optionIds !== void 0 && optionIds !== null ? [optionIds] : [];
    return this._client._post(`/polls/${pollId}/vote`, {
      option_ids: rawIds,
      other_text: otherText
    });
  }
};

// Nyaitter.js/src/api/UsersAPI.js
function getUserIconUrl(user, { baseUrl = "" } = {}) {
  const base = baseUrl ? String(baseUrl).replace(/\/+$/, "") : "";
  if (!user && user !== 0) {
    return base ? `${base}/emoji/neko.svg` : "/emoji/neko.svg";
  }
  if (typeof user === "number" || typeof user === "string" && /^\d+$/.test(user.trim())) {
    const id = typeof user === "number" ? user : parseInt(user.trim(), 10);
    if (Number.isSafeInteger(id) && id > 0) {
      return `${base}/users/${encodeURIComponent(String(id))}/icon`;
    }
  }
  if (typeof user === "object" && user !== null) {
    if (user.icon_available === false) {
      return base ? `${base}/emoji/neko.svg` : "/emoji/neko.svg";
    }
    const iconData = typeof user.icon_data === "string" ? user.icon_data.trim() : typeof user.iconData === "string" ? user.iconData.trim() : "";
    if (iconData) {
      if (/^data:image\//i.test(iconData) || /^https?:\/\//i.test(iconData)) {
        return iconData;
      }
      if (iconData.startsWith("/")) {
        return `${base}${iconData}`;
      }
      return `${base}/${iconData}`;
    }
    const userId = Number(user.id);
    if (Number.isSafeInteger(userId) && userId > 0) {
      return `${base}/users/${encodeURIComponent(String(userId))}/icon`;
    }
  }
  return base ? `${base}/emoji/neko.svg` : "/emoji/neko.svg";
}
var UsersAPI = class {
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
    return this._client._get("/auth/me");
  }
  /**
   * ユーザー名（ハンドル / Scratch ID / NyaitterID）でユーザーを検索・取得します。
   *
   * @param {string} handle - ユーザー名
   * @returns {Promise<{ user: object|null }>}
   */
  async getByHandle(handle) {
    const cleanHandle = String(handle || "").replace(/^[@#]/, "").trim();
    if (!cleanHandle) return { user: null };
    const numericId = parseInt(cleanHandle, 10);
    if (Number.isInteger(numericId) && numericId >= 0 && String(numericId) === cleanHandle) {
      try {
        const res = await this.get(numericId);
        if (res?.user) return res;
      } catch (_) {
      }
    }
    const { users = [] } = await this.search({ query: cleanHandle, limit: 10 });
    const exact = users.find(
      (u) => String(u.scid || "").toLowerCase() === cleanHandle.toLowerCase() || String(u.name || "").toLowerCase() === cleanHandle.toLowerCase() || String(u.id) === cleanHandle
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
    return this._client._get("/users/search", { q: query, limit, offset });
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
    return this._client._get("/users/recommended", { limit, offset });
  }
  /**
   * 複数のユーザー ID からユーザー情報を一括取得します。
   *
   * @param {number[]|string} userIds - ユーザー ID の配列またはカンマ区切り文字列
   * @returns {Promise<{ users: object[] }>}
   */
  getBatch(userIds) {
    const ids = Array.isArray(userIds) ? userIds.join(",") : userIds;
    return this._client._get("/users", { ids });
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
   * @param {'all'|'posts'|'replies'} [params.mode='all'] - 投稿の絞り込み
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ posts: object[], has_more: boolean }>}
   */
  getPosts(userId, { limit = 20, offset = 0, mode = "all" } = {}) {
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
   * ユーザーをフォローします（トグル）。
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
    return this._client._patch("/users/me", {
      name,
      me: me !== void 0 ? me : bio,
      bio: bio !== void 0 ? bio : me,
      header_image: headerImage,
      icon_data: iconData,
      settings
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
    return this._client._get("/users/logs", { limit, offset });
  }
};

// Nyaitter.js/src/api/DmAPI.js
var DmAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * DM の一覧（グループ一覧）を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   *
   * @example
   * const { dm, unread_total } = await client.dm.list();
   */
  list({ limit = 20, offset = 0 } = {}) {
    return this._client._get("/dm", { limit, offset });
  }
  /**
   * `list()` のエイリアスです。
   */
  getRooms(params) {
    return this.list(params);
  }
  /**
   * 全体の DM 未読件数を取得します。
   *
   * @returns {Promise<{ unread_count: number }>}
   */
  getUnreadCount() {
    return this._client._get("/dm/unread");
  }
  /**
   * DM グループごとの未読件数マップを取得します。
   *
   * @returns {Promise<{ unread_total: number, unread_by_dm: Record<string, number> }>}
   */
  getUnreadCounts() {
    return this._client._get("/dm/unread-counts");
  }
  /**
   * 指定ユーザーとの既存の 1対1 DM グループを検索します。
   *
   * @param {number|{ userId: number }} params - 相手のユーザー ID
   * @returns {Promise<{ dm: object|null }>}
   */
  find(params) {
    const userId = typeof params === "object" && params !== null ? params.userId : params;
    return this._client._get("/dm/find", { user_id: userId });
  }
  /**
   * DM グループの詳細（メッセージ一覧）を取得します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得するメッセージ数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ dm: object[], members: object[], unread_total: number }>}
   */
  get(dmId, { limit = 50, offset = 0 } = {}) {
    return this._client._get(`/dm/${dmId}`, { limit, offset });
  }
  /**
   * `get()` のエイリアスです。
   */
  getRoom(dmId, params) {
    return this.get(dmId, params);
  }
  /**
   * 新しい DM グループを作成します。
   *
   * @param {object} params
   * @param {number[]} params.members - 招待するユーザー ID の配列
   * @param {string} [params.title] - グループ名
   * @param {string} [params.name] - グループ名
   * @returns {Promise<{ dm: object, created: boolean }>}
   */
  create({ members, title, name } = {}) {
    return this._client._post("/dm", {
      member: members,
      title: title !== void 0 ? title : name
    });
  }
  /**
   * DM グループのタイトルや設定を更新します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.title] - グループ名
   * @returns {Promise<{ dm: object }>}
   */
  updateRoom(dmId, { title } = {}) {
    return this._client._patch(`/dm/${dmId}`, { title });
  }
  /**
   * DM グループから脱退します。
   *
   * @param {string} dmId - DM グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(dmId) {
    return this._client._delete(`/dm/${dmId}/leave`);
  }
  /**
   * DM グループにメッセージを送信します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} params
   * @param {string} [params.content] - メッセージ本文
   * @param {Array<object>} [params.attachments] - 添付ファイル
   * @param {object} [params.e2e] - E2E 暗号化ペイロード
   * @returns {Promise<{ dm: object, message: object }>}
   */
  sendMessage(dmId, { content, attachments, e2e } = {}) {
    return this._client._post(`/dm/${dmId}/messages`, {
      content,
      attachments,
      e2e
    });
  }
  /**
   * 送信済みメッセージを編集します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {object} params
   * @param {string} params.content - 編集後のメッセージ本文
   * @returns {Promise<{ success: boolean, message: object }>}
   */
  editMessage(dmId, messageId, { content } = {}) {
    return this._client._patch(`/dm/${dmId}/messages/${messageId}`, { content });
  }
  /**
   * 送信済みメッセージを削除します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - 削除するメッセージ ID
   * @returns {Promise<{ success: boolean }>}
   */
  deleteMessage(dmId, messageId) {
    return this._client._delete(`/dm/${dmId}/messages/${messageId}`);
  }
  /**
   * DM グループのメッセージを既読にします。
   *
   * @param {string} dmId - DM グループ ID
   * @param {object} [params]
   * @param {string|number} [params.messageId] - 既読にする最後のメッセージ ID
   * @returns {Promise<{ success: boolean }>}
   */
  markAsRead(dmId, { messageId } = {}) {
    return this._client._post(`/dm/${dmId}/read`, {
      message_id: messageId
    });
  }
  /**
   * DM グループに新しいメンバーを追加します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number|{ userId: number }} params - 追加するユーザー ID
   * @returns {Promise<{ dm: object, member: object }>}
   */
  addMember(dmId, params) {
    const userId = typeof params === "object" && params !== null ? params.userId : params;
    return this._client._post(`/dm/${dmId}/members`, { user_id: userId });
  }
  /**
   * DM グループからメンバーを退出させます。
   *
   * @param {string} dmId - DM グループ ID
   * @param {number} userId - 削除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  removeMember(dmId, userId) {
    return this._client._delete(`/dm/${dmId}/members/${userId}`);
  }
  /**
   * メッセージに絵文字リアクションを付けます。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {string} reaction - 絵文字またはリアクション文字列
   * @returns {Promise<{ success: boolean, reactions: object }>}
   */
  addReaction(dmId, messageId, reaction) {
    return this._client._post(`/dm/${dmId}/messages/${messageId}/reactions`, { reaction });
  }
  /**
   * メッセージの絵文字リアクションを取り消します。
   *
   * @param {string} dmId - DM グループ ID
   * @param {string|number} messageId - メッセージ ID
   * @param {string} reaction - 絵文字またはリアクション文字列
   * @returns {Promise<{ success: boolean, reactions: object }>}
   */
  removeReaction(dmId, messageId, reaction) {
    return this._client._delete(`/dm/${dmId}/messages/${messageId}/reactions`, { reaction });
  }
};

// Nyaitter.js/src/api/NotificationsAPI.js
var NotificationsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 通知一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数（最大 100）
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {string|Date} [params.since] - この日時以降の通知のみ取得
   * @returns {Promise<{ notifications: object[], notification_unread_count: number }>}
   *
   * @example
   * const { notifications, notification_unread_count } = await client.notifications.list();
   * console.log(`未読: ${notification_unread_count} 件`);
   */
  list({ limit = 50, offset = 0, since } = {}) {
    return this._client._get("/notifications", {
      limit,
      offset,
      since: since instanceof Date ? since.toISOString() : since
    });
  }
  /**
   * 未読の通知件数を取得します。
   *
   * @returns {Promise<{ unread_count: number }>}
   *
   * @example
   * const { unread_count } = await client.notifications.getUnreadCount();
   */
  getUnreadCount() {
    return this._client._get("/notifications/unread");
  }
  /**
   * 新しい通知を送信します。
   *
   * @param {object} params
   * @param {number} params.recipientId - 送信先ユーザー ID
   * @param {'mention'|'repost'|'dm_invite'|'dm_removed'|'dm_host_transfer'|'admin_notice'} params.type - 通知タイプ
   * @param {object} [params.target] - 通知対象（例: `{ kind: 'post', id: 123 }` または `{ kind: 'dm', id: 'group-id' }`）
   * @returns {Promise<{ success: boolean, notification: object|null }>}
   *
   * @example
   * await client.notifications.create({
   *   recipientId: 12,
   *   type: 'mention',
   *   target: { kind: 'post', id: 123 },
   * });
   */
  create({ recipientId, type, target } = {}) {
    return this._client._post("/notifications", {
      recipient_id: recipientId,
      type,
      target
    });
  }
  /**
   * 通知を既読にします。
   *
   * @param {number} notificationId - 通知 ID
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   */
  markAsRead(notificationId) {
    return this._client._put(`/notifications/${notificationId}/read`, {});
  }
  /**
   * 通知をクリック済みにマークします。
   *
   * @param {number} notificationId - 通知 ID
   * @returns {Promise<{ success: boolean, read: boolean, clicked: boolean }>}
   */
  markAsClicked(notificationId) {
    return this._client._put(`/notifications/${notificationId}/clicked`, {});
  }
  /**
   * すべての通知を既読にします。
   *
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   *
   * @example
   * await client.notifications.markAllAsRead();
   */
  markAllAsRead() {
    return this._client._put("/notifications/read-all", {});
  }
  /**
   * すべての通知をクリック済みにします。
   *
   * @returns {Promise<{ success: boolean, notification_unread_count: number }>}
   */
  markAllAsClicked() {
    return this._client._put("/notifications/click-all", {});
  }
  /**
   * 通知を削除します。
   *
   * @param {number} notificationId - 削除する通知 ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(notificationId) {
    return this._client._delete(`/notifications/${notificationId}`);
  }
};

// Nyaitter.js/src/api/GroupsAPI.js
function getGroupIconUrl(group, { baseUrl = "" } = {}) {
  const base = baseUrl ? String(baseUrl).replace(/\/+$/, "") : "";
  if (!group) return "";
  const rawIcon = typeof group === "object" && group !== null ? group.icon_data ?? group.iconData ?? "" : group;
  const image = typeof rawIcon === "string" ? rawIcon.trim() : "";
  if (!image) return "";
  if (/^data:image\//i.test(image) || /^https?:\/\//i.test(image)) {
    return image;
  }
  if (image.startsWith("/")) {
    return `${base}${image}`;
  }
  return base ? `${base}/${image}` : image;
}
var GroupsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * グループオブジェクトまたはアイコン文字列から、適切なグループアイコン URL を返します。
   *
   * @param {object|string} group - グループオブジェクト（{ id, icon_data, iconData }）またはアイコン文字列
   * @returns {string} グループアイコンの URL
   *
   * @example
   * const iconUrl = client.groups.getIconUrl(group);
   */
  getIconUrl(group) {
    return getGroupIconUrl(group, { baseUrl: this._client._baseUrl });
  }
  /**
   * 公開グループ一覧を検索・取得します。
   *
   * @param {object} [params]
   * @param {string} [params.query] - 検索キーワード
   * @param {number} [params.limit=20] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ groups: object[] }>}
   *
   * @example
   * const { groups } = await client.groups.list({ query: 'プログラミング' });
   */
  list({ query, limit = 20, offset = 0 } = {}) {
    return this._client._get("/groups", { q: query, limit, offset });
  }
  /**
   * 自分が所属しているグループ一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.postAsUserId] - インポスター等の代理ユーザー ID
   * @param {number} [params.limit=100] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ groups: object[], home_tab_limit: number }>}
   */
  listMine({ postAsUserId, limit = 100, offset = 0 } = {}) {
    return this._client._get("/groups/mine", {
      post_as_user_id: postAsUserId,
      limit,
      offset
    });
  }
  /**
   * 自分に届いているグループ招待一覧を取得します。
   *
   * @returns {Promise<{ invites: Array<{ id: string, group_id: string, inviter_id: number, invitee_id: number, status: string, group: object|null }> }>}
   */
  getInvitesMine() {
    return this._client._get("/groups/invites/mine");
  }
  /**
   * グループ招待に応答（承認または拒否）します。
   *
   * @param {string} inviteId - 招待 ID
   * @param {'accept'|'decline'} decision - 応答判定
   * @returns {Promise<{ success: boolean, group?: object }>}
   */
  respondInvite(inviteId, decision) {
    return this._client._post(`/groups/invites/${inviteId}/respond`, { decision });
  }
  /**
   * グループの詳細情報を取得します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ group: object }>}
   *
   * @example
   * const { group } = await client.groups.get('group-uuid');
   */
  get(groupId) {
    return this._client._get(`/groups/${groupId}`);
  }
  /**
   * 新しいグループを作成します。
   *
   * @param {object} params
   * @param {string} params.name - グループ名
   * @param {string} [params.description] - グループ説明
   * @param {'open'|'open_invite'|'approval'|'closed'} [params.visibility='open'] - 公開レベル
   * @param {string} [params.iconData] - アイコン画像データ
   * @param {string} [params.headerImage] - ヘッダー画像 URL / データ
   * @returns {Promise<{ group: object }>}
   *
   * @example
   * const { group } = await client.groups.create({
   *   name: '猫好きクラブ',
   *   description: '猫が好きな人の集まりです',
   *   visibility: 'open',
   * });
   */
  create({ name, description = "", visibility = "open", iconData, headerImage } = {}) {
    return this._client._post("/groups", {
      name,
      description,
      visibility,
      icon_data: iconData,
      header_image: headerImage
    });
  }
  /**
   * グループの基本設定を更新します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} params
   * @param {string} [params.name] - グループ名
   * @param {string} [params.description] - グループ説明
   * @param {'open'|'open_invite'|'approval'|'closed'} [params.visibility] - 公開レベル
   * @param {string} [params.iconData] - アイコン画像データ
   * @param {string} [params.headerImage] - ヘッダー画像 URL / データ
   * @returns {Promise<{ group: object }>}
   */
  update(groupId, { name, description, visibility, iconData, headerImage } = {}) {
    return this._client._patch(`/groups/${groupId}`, {
      name,
      description,
      visibility,
      icon_data: iconData,
      header_image: headerImage
    });
  }
  /**
   * グループのオーナー権限を別のメンバーに譲渡します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - 新オーナーのユーザー ID
   * @returns {Promise<{ group: object }>}
   */
  transferOwner(groupId, userId) {
    return this._client._post(`/groups/${groupId}/transfer-owner`, {
      user_id: userId
    });
  }
  /**
   * グループを削除します（オーナーのみ）。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(groupId) {
    return this._client._delete(`/groups/${groupId}`);
  }
  /**
   * グループに参加します（または参加申請を送信します）。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ success: boolean, status: 'joined'|'requested', group?: object, request?: object }>}
   */
  join(groupId) {
    return this._client._post(`/groups/${groupId}/join`, {});
  }
  /**
   * グループから退出します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(groupId) {
    return this._client._post(`/groups/${groupId}/leave`, {});
  }
  /**
   * ユーザーをグループに招待します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - 招待するユーザー ID
   * @returns {Promise<{ success: boolean, invite: object }>}
   */
  invite(groupId, userId) {
    return this._client._post(`/groups/${groupId}/invites`, {
      user_id: userId
    });
  }
  /**
   * 保留中の参加申請一覧を取得します（管理者のみ）。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ requests: object[] }>}
   */
  getJoinRequests(groupId) {
    return this._client._get(`/groups/${groupId}/join-requests`);
  }
  /**
   * 参加申請に応答（承認または拒否）します（管理者のみ）。
   *
   * @param {string} groupId - グループ ID
   * @param {string} requestId - 参加申請 ID
   * @param {'accept'|'decline'} decision - 判定
   * @returns {Promise<{ success: boolean, request: object }>}
   */
  respondJoinRequest(groupId, requestId, decision) {
    return this._client._post(`/groups/${groupId}/join-requests/${requestId}/respond`, {
      decision
    });
  }
  /**
   * グループのロール一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ roles: object[] }>}
   */
  getRoles(groupId) {
    return this._client._get(`/groups/${groupId}/roles`);
  }
  /**
   * グループに新しいカスタムロールを作成します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} params
   * @param {string} params.name - ロール名
   * @param {string[]} params.permissions - 権限リスト（例: ['post', 'invite', 'manage_posts']）
   * @param {number} [params.sortOrder=0] - 表示順序
   * @returns {Promise<{ role: object }>}
   */
  createRole(groupId, { name, permissions, sortOrder = 0 } = {}) {
    return this._client._post(`/groups/${groupId}/roles`, {
      name,
      permissions,
      sort_order: sortOrder
    });
  }
  /**
   * カスタムロールを更新します。
   *
   * @param {string} groupId - グループ ID
   * @param {string} roleId - ロール ID
   * @param {object} params
   * @param {string} [params.name] - ロール名
   * @param {string[]} [params.permissions] - 権限リスト
   * @param {number} [params.sortOrder] - 表示順序
   * @returns {Promise<{ role: object }>}
   */
  updateRole(groupId, roleId, { name, permissions, sortOrder } = {}) {
    return this._client._patch(`/groups/${groupId}/roles/${roleId}`, {
      name,
      permissions,
      sort_order: sortOrder
    });
  }
  /**
   * カスタムロールを削除します。
   *
   * @param {string} groupId - グループ ID
   * @param {string} roleId - ロール ID
   * @returns {Promise<{ success: boolean }>}
   */
  deleteRole(groupId, roleId) {
    return this._client._delete(`/groups/${groupId}/roles/${roleId}`);
  }
  /**
   * グループメンバー一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} [params]
   * @param {'active'|'banned'|'all'} [params.status='active'] - 取得するステータス
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ members: object[] }>}
   */
  getMembers(groupId, { status = "active", limit = 50, offset = 0 } = {}) {
    return this._client._get(`/groups/${groupId}/members`, {
      status,
      limit,
      offset
    });
  }
  /**
   * メンバーのロールを変更します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - 対象ユーザー ID
   * @param {string} roleId - 付与するロール ID
   * @returns {Promise<{ member: object }>}
   */
  updateMember(groupId, userId, roleId) {
    return this._client._patch(`/groups/${groupId}/members/${userId}`, {
      role_id: roleId
    });
  }
  /**
   * メンバーをグループから BAN します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - BAN するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  banMember(groupId, userId) {
    return this._client._post(`/groups/${groupId}/members/${userId}/ban`, {});
  }
  /**
   * メンバーの BAN を解除します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - BAN 解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unbanMember(groupId, userId) {
    return this._client._post(`/groups/${groupId}/members/${userId}/unban`, {});
  }
  /**
   * グループ内の投稿一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - この ID 以前の投稿を取得
   * @returns {Promise<{ posts: object[], has_next: boolean, next_cursor: any }>}
   */
  getPosts(groupId, { limit = 30, offset = 0, beforeId } = {}) {
    return this._client._get(`/groups/${groupId}/posts`, {
      limit,
      offset,
      before_id: beforeId
    });
  }
};

// Nyaitter.js/src/api/UploadsAPI.js
var UploadsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  uploadPartResponse(uploadId, file, { contentType = "application/octet-stream", asUserId = null } = {}) {
    return this._client.requestResponse(`/uploads/${encodeURIComponent(uploadId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        ...Number.isInteger(asUserId) && asUserId > 0 ? { "X-As-User-Id": String(asUserId) } : {}
      },
      body: file
    });
  }
  /**
   * 画像などのファイルを Nyaitter サーバーにアップロードします。
   *
   * @param {object} params
   * @param {string|Buffer|Uint8Array|ArrayBuffer|Blob} params.file - ファイルデータ（Base64 文字列、Buffer、Uint8Array、ArrayBuffer、または Blob/File）
   * @param {string} params.fileName - ファイル名（例: 'photo.png'）
   * @param {string} [params.contentType='image/png'] - MIME タイプ
   * @param {number} [params.asUserId] - インポスター代理アップロード時のユーザー ID
   * @returns {Promise<{ id: string, url: string, contentType: string, size: number }>}
   */
  async upload({ file, fileName, contentType = "image/png", asUserId } = {}) {
    let base64String = "";
    if (typeof file === "string") {
      base64String = file.replace(/^data:[^;]+;base64,/, "").trim();
    } else if (file instanceof Uint8Array || typeof Buffer !== "undefined" && Buffer.isBuffer(file)) {
      if (typeof Buffer !== "undefined") {
        base64String = Buffer.from(file).toString("base64");
      } else {
        let binary = "";
        const bytes = new Uint8Array(file.buffer || file);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
    } else if (file instanceof ArrayBuffer) {
      const bytes = new Uint8Array(file);
      if (typeof Buffer !== "undefined") {
        base64String = Buffer.from(bytes).toString("base64");
      } else {
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      if (typeof Buffer !== "undefined") {
        base64String = Buffer.from(bytes).toString("base64");
      } else {
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64String = btoa(binary);
      }
      if (!contentType && file.type) {
        contentType = file.type;
      }
    } else {
      throw new Error("\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u3066\u3044\u306A\u3044\u30D5\u30A1\u30A4\u30EB\u5F62\u5F0F\u3067\u3059\u3002Base64 \u6587\u5B57\u5217\u3001Buffer\u3001Uint8Array\u3001\u307E\u305F\u306F Blob \u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    return this._client._post("/uploads", {
      file: base64String,
      fileName,
      contentType,
      as_user_id: asUserId
    });
  }
  /**
   * 自分のストレージ使用状況とファイル一覧を取得します。
   *
   * @returns {Promise<{ limit_mb: number, limit_bytes: number, used_bytes: number, used_percent: number, files: Array<{ id: string, url: string, size: number, lastModified: string }> }>}
   */
  getStorage() {
    return this._client._get("/uploads/storage");
  }
  /**
   * アップロード済みファイルを削除します。
   *
   * @param {object|string[]} params - 削除するファイル ID リストまたはオプション
   * @param {string[]} [params.fileIds] - ファイル ID 配列
   * @param {number} [params.asUserId] - インポスター代理削除時のユーザー ID
   * @returns {Promise<{ success: boolean, deleted_count: number }>}
   */
  delete(params) {
    const fileIds = Array.isArray(params) ? params : params?.fileIds;
    const asUserId = Array.isArray(params) ? void 0 : params?.asUserId;
    return this._client._delete("/uploads", {
      fileIds,
      as_user_id: asUserId
    });
  }
  /**
   * 添付画像ファイルのサムネイル（プレビュー）URL を取得します。
   *
   * @param {string} fileId - ファイル ID
   * @returns {string} プレビュー URL
   */
  getPreviewUrl(fileId) {
    const cleanId = String(fileId || "").trim();
    return `${this._client._baseUrl}/uploads/preview?file_id=${encodeURIComponent(cleanId)}`;
  }
};

// Nyaitter.js/src/api/RankingAPI.js
var RankingAPI = class {
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
    return this._client._get("/ranking/me");
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
    return this.get("followers", { limit });
  }
  /**
   * 投稿数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getPosts({ limit = 50 } = {}) {
    return this.get("posts", { limit });
  }
  /**
   * いいね数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getLikes({ limit = 50 } = {}) {
    return this.get("likes", { limit });
  }
  /**
   * スター数ランキング上位を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.limit=50] - 取得件数
   * @returns {Promise<{ data: object[] }>}
   */
  getStars({ limit = 50 } = {}) {
    return this.get("stars", { limit });
  }
};

// Nyaitter.js/src/api/ReportsAPI.js
var ReportsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 不適切な投稿またはユーザーを通報・報告します。
   *
   * @param {object} params
   * @param {'post'|'user'} params.targetKind - 報告対象の種類（'post' または 'user'）
   * @param {number|string} params.targetId - 報告対象の投稿 ID またはユーザー ID
   * @param {string} params.description - 通報理由・詳細説明
   * @param {number} [params.postAsUserId] - 代理通報ユーザー ID
   * @returns {Promise<{ success: boolean, report: { id: number, status: string, created_at: string } }>}
   *
   * @example
   * await client.reports.create({
   *   targetKind: 'post',
   *   targetId: 123,
   *   description: 'スパム投稿です。',
   * });
   */
  create({ targetKind, targetId, description, postAsUserId } = {}) {
    return this._client._post("/reports", {
      target_kind: targetKind,
      target_id: targetId,
      description,
      post_as_user_id: postAsUserId
    });
  }
  /**
   * 通報一覧を取得します（モデレーター用）。
   *
   * @param {object} [params]
   * @param {string} [params.status] - 絞り込みステータス
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ reports: object[] }>}
   */
  list({ status, limit = 50, offset = 0 } = {}) {
    return this._client._get("/reports", { status, limit, offset });
  }
  /**
   * 通報の詳細を取得します（モデレーター用）。
   *
   * @param {number} reportId - 通報 ID
   * @returns {Promise<{ report: object }>}
   */
  get(reportId) {
    return this._client._get(`/reports/${reportId}`);
  }
  /**
   * 通報の審査ステータスを更新します（モデレーター用）。
   *
   * @param {number} reportId - 通報 ID
   * @param {object} params
   * @param {string} params.status - 新しいステータス
   * @param {string} [params.note] - モデレーターメモ
   * @param {string} [params.action] - 実行したアクション
   * @returns {Promise<{ success: boolean, report: object }>}
   */
  update(reportId, { status, note, action } = {}) {
    return this._client._patch(`/reports/${reportId}`, {
      status,
      note,
      action
    });
  }
};

// Nyaitter.js/src/api/AppealsAPI.js
var AppealsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 自分のアカウント凍結に対する異議申し立ての状態を取得します。
   *
   * @returns {Promise<{ appeal: { id: number, status: string, assigned_at: string|null, created_at: string|null, freeze_reason: string|null }|null }>}
   *
   * @example
   * const { appeal } = await client.appeals.getStatus();
   * if (appeal) {
   *   console.log('審査状況:', appeal.status);
   * }
   */
  getStatus() {
    return this._client._get("/appeals/me");
  }
  /**
   * 凍結に対する異議申し立てを提出します。
   *
   * @param {object} params
   * @param {string} params.description - 申し立て理由・詳細説明
   * @returns {Promise<{ appeal: object }>}
   *
   * @example
   * await client.appeals.create({
   *   description: '利用規約を再確認しました。凍結解除をお願いいたします。',
   * });
   */
  create({ description } = {}) {
    return this._client._post("/appeals", { description });
  }
};

// Nyaitter.js/src/api/VerificationAPI.js
var VerificationAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 自分の認証バッジ申請の現在の審査ステータスを取得します。
   *
   * @returns {Promise<{ application: { id: number, status: string, assigned_at: string|null, created_at: string }|null }>}
   *
   * @example
   * const { application } = await client.verification.getStatus();
   * if (application) {
   *   console.log('申請状況:', application.status);
   * }
   */
  getStatus() {
    return this._client._get("/verification-applications/me");
  }
  /**
   * 認証バッジを申請します。
   *
   * @returns {Promise<{ application: { id: number, status: string, assigned_at: string|null, created_at: string } }>}
   *
   * @example
   * await client.verification.apply();
   */
  apply() {
    return this._client._post("/verification-applications", {});
  }
  /**
   * 認証バッジ申請一覧を取得します（モデレーター用）。
   *
   * @param {object} [params]
   * @param {string} [params.status] - ステータス絞り込み
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ applications: object[] }>}
   */
  list({ status, limit = 50, offset = 0 } = {}) {
    return this._client._get("/verification-applications", { status, limit, offset });
  }
  /**
   * 認証バッジ申請の詳細を取得します（モデレーター用）。
   *
   * @param {number} applicationId - 申請 ID
   * @returns {Promise<{ application: object }>}
   */
  get(applicationId) {
    return this._client._get(`/verification-applications/${applicationId}`);
  }
  /**
   * 認証バッジ申請の審査結果を更新します（モデレーター用）。
   *
   * @param {number} applicationId - 申請 ID
   * @param {object} params
   * @param {'approved'|'rejected'} params.status - 審査結果
   * @param {string} [params.reason] - 理由
   * @returns {Promise<{ success: boolean, application: object }>}
   */
  update(applicationId, { status, reason } = {}) {
    return this._client._patch(`/verification-applications/${applicationId}`, {
      status,
      reason
    });
  }
};

// Nyaitter.js/src/api/ImpostersAPI.js
var ImpostersAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 自分がアクセス可能なインポスター一覧を取得します。
   *
   * @returns {Promise<{ imposters: object[], limit: number }>}
   *
   * @example
   * const { imposters } = await client.imposters.list();
   */
  list() {
    return this._client._get("/imposters");
  }
  /**
   * 新しいインポスターを作成します。
   *
   * @param {object} params
   * @param {string} params.name - インポスターのアカウント名
   * @returns {Promise<{ imposter: object }>}
   *
   * @example
   * const { imposter } = await client.imposters.create({ name: '広報用インポスター' });
   */
  create({ name } = {}) {
    return this._client._post("/imposters", { name });
  }
  /**
   * インポスターに共同運用者を追加します。
   *
   * @param {number} imposterId - インポスターのユーザー ID
   * @param {object} params
   * @param {number} params.userId - 追加するユーザー ID
   * @param {'operator'|'manager'} [params.role='operator'] - 権限ロール
   * @returns {Promise<{ imposter: object }>}
   */
  addMember(imposterId, { userId, role = "operator" } = {}) {
    return this._client._post(`/imposters/${imposterId}/members`, {
      user_id: userId,
      role
    });
  }
  /**
   * インポスターの共同運用者の権限ロールを変更します。
   *
   * @param {number} imposterId - インポスターのユーザー ID
   * @param {number} memberId - 運用者のユーザー ID
   * @param {object} params
   * @param {'operator'|'manager'} params.role - 新しい権限ロール
   * @returns {Promise<{ imposter: object }>}
   */
  updateMemberRole(imposterId, memberId, { role } = {}) {
    return this._client._patch(`/imposters/${imposterId}/members/${memberId}`, {
      role
    });
  }
  /**
   * インポスターから共同運用者を削除します。
   *
   * @param {number} imposterId - インポスターのユーザー ID
   * @param {number} memberId - 削除する運用者のユーザー ID
   * @returns {Promise<{ imposter: object }>}
   */
  removeMember(imposterId, memberId) {
    return this._client._delete(`/imposters/${imposterId}/members/${memberId}`);
  }
  /**
   * インポスターを削除します。
   *
   * @param {number} imposterId - 削除するインポスターのユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(imposterId) {
    return this._client._delete(`/imposters/${imposterId}`);
  }
};

// Nyaitter.js/src/api/PushAPI.js
var PushAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * Web Push 通知のサーバー設定（VAPID 公開鍵、購読数）を取得します。
   *
   * @returns {Promise<{ enabled: boolean, vapid_public_key: string|null, subscription_count: number }>}
   */
  getConfig() {
    return this._client._get("/push/config");
  }
  /**
   * ブラウザの PushSubscription をサーバーに登録します。
   *
   * @param {object} params
   * @param {PushSubscription|object} params.subscription - ブラウザの PushSubscription オブジェクト
   * @returns {Promise<{ success: boolean }>}
   */
  subscribe({ subscription } = {}) {
    const subObj = typeof subscription?.toJSON === "function" ? subscription.toJSON() : subscription;
    return this._client._post("/push/subscriptions", { subscription: subObj });
  }
  /**
   * PushSubscription の登録を解除します。
   *
   * @param {string} endpoint - 登録解除する購読エンドポイント URL
   * @returns {Promise<{ success: boolean }>}
   */
  unsubscribe(endpoint) {
    return this._client._delete("/push/subscriptions", { endpoint });
  }
};

// Nyaitter.js/src/api/RulesAPI.js
var RulesAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * サーバーのコミュニティルール・利用規約を取得します。
   *
   * @returns {Promise<{ success: boolean, rules: string, updated_at: string }>}
   *
   * @example
   * const { rules } = await client.rules.get();
   * console.log(rules);
   */
  get() {
    return this._client._get("/rules");
  }
};

// Nyaitter.js/src/api/UrlCardsAPI.js
var UrlCardsAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * 指定した URL の OGP カード情報（タイトル・説明・画像・サイト名・著者など）を取得します。
   *
   * @param {string} url - 展開対象の URL
   * @returns {Promise<{ card: object|null }>}
   *
   * @example
   * const { card } = await client.urlCards.get('https://scratch.mit.edu');
   * console.log('タイトル:', card?.title);
   */
  get(url) {
    return this._client._get("/url-cards", { url });
  }
};

// Nyaitter.js/src/api/OEmbedAPI.js
var OEmbedAPI = class {
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
    return this._client._get("/oembed", {
      url,
      maxwidth: maxWidth,
      maxheight: maxHeight
    });
  }
};

// Nyaitter.js/src/api/UIAPI.js
var UIAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  /**
   * ナビゲーション表示用の未読カウントサマリー（通知未読数・DM未読数）を取得します。
   *
   * @returns {Promise<{ notification_unread_count: number, dm_unread_count: number }>}
   *
   * @example
   * const summary = await client.ui.getSummary();
   * console.log(`未読通知: ${summary.notification_unread_count} 件, 未読DM: ${summary.dm_unread_count} 件`);
   */
  getSummary() {
    return this._client._get("/ui/summary");
  }
};

// Nyaitter.js/src/api/SystemAPI.js
var SystemAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  getStatusResponse() {
    return this._client.requestResponse("/status");
  }
  getApiSpecResponse(options) {
    return this._getWithFallback("/spec/endpoints", "/api/spec/endpoints", options);
  }
  getDocsResponse(options) {
    return this._getWithFallback("/docs", "/api/docs", options);
  }
  getDocResponse(docId, options) {
    return this._getWithFallback(`/docs/${encodeURIComponent(docId)}`, `/api/docs/${encodeURIComponent(docId)}`, options);
  }
  getRulesResponse(options) {
    return this._client.requestResponse("/rules", options);
  }
  async _getWithFallback(primaryPath, fallbackPath, options) {
    const response = await this._client.requestResponse(primaryPath, options);
    return response.ok ? response : this._client.requestResponse(fallbackPath, options);
  }
  /**
   * サーバーの稼働状態・制限値・認証プロバイダー設定を取得します。
   *
   * @returns {Promise<{ server: string, timestamp: string, database: string, identity: object, auth_methods: string[], client_limits: object }>}
   *
   * @example
   * const status = await client.system.getStatus();
   * console.log('サーバー状態:', status.server, status.database);
   */
  getStatus() {
    return this._client._get("/status");
  }
  /**
   * サーバーのヘルスチェック状態を取得します。
   *
   * @returns {Promise<{ status: string, timestamp: string, version: string, uptime: number, env: string }>}
   */
  getHealth() {
    return this._client._get("/health");
  }
  /**
   * サーバーのレディネス（DB接続準備）状態を取得します。
   *
   * @returns {Promise<{ status: string, timestamp: string }>}
   */
  getReady() {
    return this._client._get("/ready");
  }
  /**
   * コミュニティルール・利用規約を取得します。
   *
   * @returns {Promise<{ success: boolean, rules: string, updated_at: string }>}
   */
  getRules() {
    return this._client._get("/rules");
  }
  /**
   * 指定した URL の OGP カード情報（タイトル・説明・画像・著者など）を取得します。
   *
   * @param {string} url - 展開対象の URL
   * @returns {Promise<{ card: object }>}
   */
  getUrlCard(url) {
    return this._client._get("/url-cards", { url });
  }
  /**
   * Nyaitter 投稿等の oEmbed 埋め込みデータを取得します。
   *
   * @param {string} url - 投稿 URL
   * @returns {Promise<object>} oEmbed JSON レスポンス
   */
  getOembed(url) {
    return this._client._get("/oembed", { url });
  }
  /**
   * ナビゲーション表示用の未読カウントサマリー（通知未読数・DM未読数）を取得します。
   *
   * @returns {Promise<{ notification_unread_count: number, dm_unread_count: number }>}
   */
  getUiSummary() {
    return this._client._get("/ui/summary");
  }
};

// Nyaitter.js/src/api/NyaitterAuthAPI.js
var NyaitterAuthAPI = class {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }
  getRequestResponse(requestId, options) {
    return this._client.requestResponse(`/nyaitter-auth/requests/${encodeURIComponent(requestId)}`, options);
  }
  approveResponse(body) {
    return this._client.requestResponse("/nyaitter-auth/approve", { method: "POST", body });
  }
  denyResponse(body) {
    return this._client.requestResponse("/nyaitter-auth/deny", { method: "POST", body });
  }
  /**
   * 認証 URL を生成します。返ってきた `auth_url` にユーザーをリダイレクトしてください。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.redirectUri - 許可後にリダイレクトされる URL
   * @param {string[]} params.scopes - 要求する権限のリスト
   * @param {string} [params.name] - 認証画面に表示されるアプリ名
   * @param {string} [params.iconUrl] - 認証画面に表示されるアイコン URL
   * @param {string} [params.state] - CSRF 対策用の任意文字列
   * @returns {Promise<{ request_id: string, auth_url: string, expires_at: string }>}
   *
   * @example
   * const { auth_url } = await client.nyaitterAuth.initiate({
   *   appId: 'my_app',
   *   redirectUri: 'https://example.com/callback',
   *   scopes: ['profile:read', 'posts:write', 'continuous_access'],
   *   name: '私のアプリ',
   * });
   * // ユーザーを auth_url へ案内する
   */
  initiate({ appId, redirectUri, scopes, name, iconUrl, state } = {}) {
    return this._client._post("/nyaitter-auth/initiate", {
      app_id: appId,
      api_token: this._client.getToken(),
      redirect_uri: redirectUri,
      scopes,
      name,
      icon_url: iconUrl,
      state
    });
  }
  /**
   * ユーザーが許可した後に届いた `code` をアクセストークンと交換します。
   * 取得したトークンで新しい `NyaitterClient` を作成して、そのユーザーとして API を呼び出せます。
   *
   * @param {object} params
   * @param {string} params.appId - アプリ ID
   * @param {string} params.code - コールバック URL の `?code=` の値
   * @returns {Promise<{ user: object, granted_scopes: string[], access_token?: string }>}
   *
   * @example
   * const code = new URLSearchParams(window.location.search).get('code');
   *
   * const { user, access_token } = await client.nyaitterAuth.exchangeToken({
   *   appId: 'my_app',
   *   code,
   * });
   *
   * // 取得したトークンで別クライアントを作る
   * const userClient = new NyaitterClient({
   *   baseUrl: 'https://nyaitter.example.com',
   *   token: access_token,
   * });
   * await userClient.posts.create({ content: 'ユーザーとして投稿！' });
   */
  exchangeToken({ appId, code } = {}) {
    return this._client._post("/nyaitter-auth/token", {
      app_id: appId,
      api_token: this._client.getToken(),
      code
    });
  }
  /**
   * 連携済みアプリの一覧を取得します。
   *
   * @returns {Promise<{ apps: object[] }>}
   */
  getAuthorizedApps() {
    return this._client._get("/nyaitter-auth/authorized-apps");
  }
  /**
   * 現在のアクセストークンで認可されたユーザー情報とスコープを取得します。
   *
   * @returns {Promise<{ success: boolean, user: object, scopes: string[], app_id: string|null }>}
   *
   * @example
   * const info = await userClient.nyaitterAuth.getUserInfo();
   * console.log(`連携ユーザー: ${info.user.name}, スコープ:`, info.scopes);
   */
  getUserInfo() {
    return this._client._get("/nyaitter-auth/userinfo");
  }
  /**
   * 連携済みアプリのスコープを更新します。
   *
   * @param {string} appAuthId - 連携 ID
   * @param {string[]} scopes - 新しいスコープ一覧
   * @returns {Promise<{ success: boolean }>}
   */
  updateAuthorizedApp(appAuthId, scopes) {
    return this._client._patch(`/nyaitter-auth/authorized-apps/${appAuthId}`, { scopes });
  }
  /**
   * 連携済みアプリを解除します。
   *
   * @param {string} appAuthId - 連携 ID
   * @returns {Promise<{ success: boolean }>}
   */
  revokeAuthorizedApp(appAuthId) {
    return this._client._delete(`/nyaitter-auth/authorized-apps/${appAuthId}`);
  }
};

// Nyaitter.js/src/RealtimeClient.js
var RealtimeClient = class {
  /**
   * @param {import('./NyaitterClient.js').NyaitterClient} client
   */
  constructor(client) {
    this._client = client;
    this._ws = null;
    this._listeners = /* @__PURE__ */ new Map();
    this._pingInterval = null;
    this._reconnectTimer = null;
    this._shouldReconnect = false;
  }
  /**
   * イベントリスナーを登録します。
   *
   * イベント一覧：
   * - `'notification'`  — 新着通知 `(notification: object) => void`
   * - `'notificationUnreadCount'` — 通知未読数の更新 `(count: number) => void`
   * - `'dm'`            — DM 新着メッセージ `({ dmId, message, sender }) => void`
   * - `'dmUnreadCount'` — DM 未読数の更新 `(count: number) => void`
   * - `'timelinePost'`  — フォロー中タイムラインの新着 `({ postId, authorId }) => void`
   * - `'open'`          — 接続完了 `() => void`
   * - `'close'`         — 切断 `() => void`
   * - `'error'`         — エラー `(error: Event) => void`
   *
   * @param {string} event - イベント名
   * @param {Function} handler - コールバック関数
   * @returns {this} メソッドチェーン可
   *
   * @example
   * realtime.on('notification', (n) => console.log(n));
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, /* @__PURE__ */ new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }
  /**
   * イベントリスナーを解除します。
   *
   * @param {string} event - イベント名
   * @param {Function} handler - 登録時と同じコールバック関数
   * @returns {this}
   */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
    return this;
  }
  /** @internal */
  _emit(event, data) {
    for (const handler of this._listeners.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[NyaitterRealtime] '${event}' \u30CF\u30F3\u30C9\u30E9\u30FC\u3067\u30A8\u30E9\u30FC:`, err);
      }
    }
  }
  /**
   * WebSocket に接続します。
   * 接続が確立すると `'open'` イベントが発火します。
   *
   * @param {object} [options]
   * @param {boolean} [options.autoReconnect=true] - 切断時に自動再接続するか
   * @param {number}  [options.reconnectDelayMs=3000] - 再接続までの待機時間（ミリ秒）
   * @returns {Promise<void>} 接続完了で resolve
   */
  connect({ autoReconnect = true, reconnectDelayMs = 3e3 } = {}) {
    this._shouldReconnect = autoReconnect;
    this._reconnectDelayMs = reconnectDelayMs;
    return this._connect();
  }
  /** @internal */
  _connect() {
    return new Promise((resolve, reject) => {
      const base = this._client._baseUrl.replace(/^http/, "ws");
      const token = this._client.getToken();
      const url = `${base}/realtime`;
      const WSClass = this._client._WebSocket || globalThis.WebSocket;
      if (!WSClass) {
        throw new Error("WebSocket \u5B9F\u88C5\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002globalThis.WebSocket \u307E\u305F\u306F client \u30AA\u30D7\u30B7\u30E7\u30F3\u306B WebSocket \u3092\u6E21\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      }
      const wsOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : void 0;
      const ws = wsOptions ? new WSClass(url, wsOptions) : new WSClass(url);
      this._ws = ws;
      const onOpen = () => {
        this._startPing();
        this._emit("open");
        resolve();
      };
      const onMessage = (event) => {
        const raw = typeof event === "string" ? event : event?.data ?? event;
        this._handleMessage(raw);
      };
      const onClose = () => {
        this._stopPing();
        this._emit("close");
        if (this._shouldReconnect) {
          this._reconnectTimer = setTimeout(() => this._connect(), this._reconnectDelayMs);
        }
      };
      const onError = (err) => {
        this._emit("error", err);
        reject(err);
      };
      if (typeof ws.addEventListener === "function") {
        ws.addEventListener("open", onOpen);
        ws.addEventListener("message", onMessage);
        ws.addEventListener("close", onClose);
        ws.addEventListener("error", onError);
      } else if (typeof ws.on === "function") {
        ws.on("open", onOpen);
        ws.on("message", (data) => onMessage({ data: data.toString() }));
        ws.on("close", onClose);
        ws.on("error", onError);
      }
    });
  }
  /** @internal */
  _handleMessage(raw) {
    let data;
    try {
      data = typeof raw === "string" ? JSON.parse(raw) : JSON.parse(raw.toString());
    } catch {
      return;
    }
    this._emit("raw", data);
    switch (data.type) {
      case "notification_new":
        this._emit("notification", data.notification);
        this._emit("notificationUnreadCount", data.unread_count);
        break;
      case "notification_unread_count":
        this._emit("notificationUnreadCount", data.unread_count);
        break;
      case "dm_message":
        this._emit("dm", {
          dmId: data.dm_id,
          message: data.message,
          sender: data.sender ?? null
        });
        break;
      case "dm_unread_count":
        this._emit("dmUnreadCount", data.unread_count);
        break;
      case "timeline_post":
        this._emit("timelinePost", {
          postId: data.post_id,
          authorId: data.author_id
        });
        break;
      // pong はライブラリが内部で処理するだけ（ユーザーには公開しない）
      case "pong":
        break;
    }
  }
  /** @internal */
  _startPing() {
    this._pingInterval = setInterval(() => {
      if (this._ws?.readyState === 1) {
        this._ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25e3);
  }
  /** @internal */
  _stopPing() {
    clearInterval(this._pingInterval);
    this._pingInterval = null;
  }
  /**
   * WebSocket を切断します。
   * 自動再接続も停止します。
   */
  disconnect() {
    this._shouldReconnect = false;
    clearTimeout(this._reconnectTimer);
    this._stopPing();
    this._ws?.close();
    this._ws = null;
  }
  /**
   * 現在接続中かどうかを返します。
   * @returns {boolean}
   */
  get connected() {
    return this._ws?.readyState === 1;
  }
};

// Nyaitter.js/src/NyaitterClient.js
var NyaitterClient = class {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - Nyaitter サーバーの URL（例: 'https://nyaitter.example.com'）
   * @param {string} [options.token] - Bot トークンまたはアクセストークン（`bot_` または `nyauth_` で始まる値）
   * @param {typeof fetch} [options.fetch] - カスタム fetch 関数（省略時はグローバル fetch）
   * @param {any} [options.WebSocket] - カスタム WebSocket クラス（Node.js 環境用）
   */
  constructor({ baseUrl, token = null, fetch: customFetch = null, WebSocket: customWebSocket = null } = {}) {
    if (!baseUrl) throw new Error("baseUrl \u306F\u5FC5\u9808\u3067\u3059");
    this._baseUrl = baseUrl.replace(/\/+$/, "");
    this._token = token;
    this._fetch = customFetch || globalThis.fetch;
    this._WebSocket = customWebSocket || globalThis.WebSocket;
    if (typeof this._fetch !== "function") {
      throw new Error("fetch \u95A2\u6570\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002Node.js 18+ \u307E\u305F\u306F fetch \u30DD\u30EA\u30D5\u30A3\u30EB\u304C\u5FC5\u8981\u3067\u3059\u3002");
    }
    this.auth = new AuthAPI(this);
    this.posts = new PostsAPI(this);
    this.polls = new PollsAPI(this);
    this.users = new UsersAPI(this);
    this.dm = new DmAPI(this);
    this.notifications = new NotificationsAPI(this);
    this.groups = new GroupsAPI(this);
    this.uploads = new UploadsAPI(this);
    this.ranking = new RankingAPI(this);
    this.reports = new ReportsAPI(this);
    this.appeals = new AppealsAPI(this);
    this.verification = new VerificationAPI(this);
    this.imposters = new ImpostersAPI(this);
    this.push = new PushAPI(this);
    this.rules = new RulesAPI(this);
    this.urlCards = new UrlCardsAPI(this);
    this.oembed = new OEmbedAPI(this);
    this.ui = new UIAPI(this);
    this.system = new SystemAPI(this);
    this.nyaitterAuth = new NyaitterAuthAPI(this);
  }
  /**
   * アクセストークン（Bot トークン）を設定します。
   * @param {string|null} token
   */
  setToken(token) {
    this._token = token;
  }
  /**
   * 現在のアクセストークン（Bot トークン）を取得します。
   * @returns {string|null}
   */
  getToken() {
    return this._token;
  }
  /**
   * 認証中のユーザー（Bot の所有者アカウント）の情報を取得します。
   * `client.users.getMe()` のエイリアスです。
   *
   * @returns {Promise<{ user: object, isBot: boolean, tokenType: string }>}
   */
  getMe() {
    return this.users.getMe();
  }
  /**
   * ユーザーオブジェクトまたはユーザー ID から、適切なアカウントアイコン URL を返します。
   *
   * @param {object|number|string} user - ユーザーオブジェクトまたはユーザー ID
   * @returns {string} アイコンの URL
   */
  getUserIconUrl(user) {
    return this.users.getIconUrl(user);
  }
  /**
   * グループオブジェクトまたはアイコン文字列から、適切なグループアイコン URL を返します。
   *
   * @param {object|string} group - グループオブジェクトまたはアイコン文字列
   * @returns {string} グループアイコンの URL
   */
  getGroupIconUrl(group) {
    return this.groups.getIconUrl(group);
  }
  /**
   * リアルタイムイベントを受信するためのクライアントを作成します。
   *
   * @param {object} [options]
   * @param {boolean} [options.autoReconnect=true] - 切断時の自動再接続
   * @param {number} [options.reconnectDelayMs=3000] - 再接続待機時間（ミリ秒）
   * @returns {RealtimeClient}
   */
  realtime(options = {}) {
    return new RealtimeClient(this, options);
  }
  /**
   * API リクエストを送信する内部メソッド。
   *
   * @param {string} method - HTTP メソッド（'GET', 'POST', 'PUT', 'PATCH', 'DELETE'）
   * @param {string} path - エンドポイントのパス（例: '/posts'）
   * @param {object} [options]
   * @param {any} [options.body] - 送信する JSON ボディ
   * @param {object} [options.query] - URL クエリパラメータ
   * @param {Record<string, string>} [options.headers] - 追加ヘッダー
   * @returns {Promise<any>}
   */
  async request(method, path, { body, query, headers = {} } = {}) {
    const response = await this.requestResponse(method, path, { body, query, headers });
    const data = await this._parseResponse(response);
    if (!response.ok) {
      const message = typeof data === "object" && (data?.error || data?.message) || `HTTP ${response.status} ${response.statusText || ""}`.trim();
      throw new NyaitterError(message, response.status, data);
    }
    return data;
  }
  /**
   * API リクエストをレスポンス情報付きで送信します。
   * @param {string} methodOrPath HTTP メソッド、または直接指定するエンドポイント
   * @param {string|object} [pathOrOptions] エンドポイント、または GET 用オプション
   * @param {object} [requestOptions]
   * @example
   * await client.requestResponse('/api/custom-endpoint');
   * @returns {Promise<Response>}
   */
  async requestResponse(methodOrPath, pathOrOptions = {}, requestOptions = {}) {
    const directEndpoint = typeof pathOrOptions === "object" && pathOrOptions !== null;
    const method = directEndpoint ? pathOrOptions.method || "GET" : methodOrPath;
    const path = directEndpoint ? methodOrPath : pathOrOptions;
    const { body, query, headers = {}, signal, cache } = directEndpoint ? pathOrOptions : requestOptions;
    const rawPath = path.startsWith("/") ? path : `/${path}`;
    let url;
    if (/^https?:\/\//i.test(path)) {
      url = new URL(path);
    } else {
      const base = new URL(this._baseUrl);
      const basePath = base.pathname.replace(/\/+$/, "");
      const requestPath = basePath && (rawPath === basePath || rawPath.startsWith(`${basePath}/`)) ? rawPath.slice(basePath.length) || "/" : rawPath;
      url = new URL(`${base.origin}${basePath}${requestPath}`);
    }
    if (query && typeof query === "object") {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0 && value !== null) {
          if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(","));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers
    };
    if (this._token) {
      reqHeaders["Authorization"] = `Bearer ${this._token}`;
    }
    const fetchOptions = {
      method,
      headers: reqHeaders,
      credentials: "include",
      signal,
      cache
    };
    if (body !== void 0) {
      const isBinary = typeof Blob !== "undefined" && body instanceof Blob || typeof ArrayBuffer !== "undefined" && (body instanceof ArrayBuffer || ArrayBuffer.isView(body));
      fetchOptions.body = typeof body === "string" || isBinary ? body : JSON.stringify(body);
    }
    return this._fetch(url.toString(), fetchOptions);
  }
  async _parseResponse(response) {
    let data;
    const contentType = response.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return data;
  }
  /** @internal */
  _get(path, query) {
    return this.request("GET", path, { query });
  }
  /** @internal */
  _post(path, body, query) {
    return this.request("POST", path, { body, query });
  }
  /** @internal */
  _put(path, body, query) {
    return this.request("PUT", path, { body, query });
  }
  /** @internal */
  _patch(path, body, query) {
    return this.request("PATCH", path, { body, query });
  }
  /** @internal */
  _delete(path, body, query) {
    return this.request("DELETE", path, { body, query });
  }
};
var NyaitterError = class extends Error {
  /**
   * @param {string} message - エラーメッセージ
   * @param {number} status - HTTP ステータスコード
   * @param {any} data - サーバーからのレスポンスデータ
   */
  constructor(message, status, data) {
    super(message);
    this.name = "NyaitterError";
    this.status = status;
    this.data = data;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppealsAPI,
  AuthAPI,
  DmAPI,
  GroupsAPI,
  ImpostersAPI,
  NotificationsAPI,
  NyaitterAuthAPI,
  NyaitterClient,
  NyaitterError,
  OEmbedAPI,
  PollsAPI,
  PostsAPI,
  PushAPI,
  RankingAPI,
  RealtimeClient,
  ReportsAPI,
  RulesAPI,
  SystemAPI,
  UIAPI,
  UploadsAPI,
  UrlCardsAPI,
  UsersAPI,
  VerificationAPI,
  getGroupIconUrl,
  getUserIconUrl
});
