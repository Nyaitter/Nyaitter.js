/**
 * グループオブジェクトまたはアイコンデータから、適切なグループアイコン URL を生成して返します。
 *
 * @param {object|string} group - グループオブジェクトまたはアイコン文字列
 * @param {object} [options]
 * @param {string} [options.baseUrl] - サーバーのベース URL
 * @returns {string} グループアイコンの URL
 *
 * @example
 * const url = getGroupIconUrl(group, { baseUrl: 'https://nyaitter.example.com' });
 */
export function getGroupIconUrl(group, { baseUrl = '' } = {}) {
  const base = baseUrl ? String(baseUrl).replace(/\/+$/, '') : '';

  if (!group) return '';

  const rawIcon =
    typeof group === 'object' && group !== null
      ? (group.icon_data ?? group.iconData ?? '')
      : group;

  const image = typeof rawIcon === 'string' ? rawIcon.trim() : '';
  if (!image) return '';

  if (/^data:image\//i.test(image) || /^https?:\/\//i.test(image)) {
    return image;
  }
  if (image.startsWith('/')) {
    return `${base}${image}`;
  }
  return base ? `${base}/${image}` : image;
}

export class GroupsAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * グループオブジェクトまたはアイコン文字列から、適切なグループアイコン URL を返します。
   *
   * @param {object|string} group - グループオブジェクトまたはアイコン文字列
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
    return this._client._get('/groups', { query, limit, offset });
  }

  /**
   * 自分が所属しているグループ一覧を取得します。
   *
   * @param {object} [params]
   * @param {number} [params.postAsUserId] - 互換用（Serverは無視し、認証中ユーザーの一覧を返します）
   * @param {number} [params.limit=50] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ groups: object[], limit: number, offset: number }>}
   */
  listMine({ postAsUserId, limit = 50, offset = 0 } = {}) {
    return this._client._get('/groups/mine', {
      limit,
      offset,
    });
  }

  /**
   * 自分に届いているグループ招待一覧を取得します。
   *
   * @returns {Promise<{ invites: Array<{ id: string, group_id: string, inviter_id: number, invitee_id: number, status: string, group: object|null }> }>}
   */
  getInvitesMine() {
    return this._client._get('/groups/invites/mine');
  }

  /**
   * グループ招待に応答します。
   *
   * @param {string} inviteId - 招待 ID
   * @param {'accept'|'decline'} decision - 応答判定
   * @returns {Promise<{ success: boolean, group?: object }>}
   */
  respondInvite(inviteId, decision) {
    return this._client._post(`/groups/invites/${encodeURIComponent(inviteId)}/respond`, { decision });
  }

  /**
   * グループの詳細情報を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {{postAsUserId?: number}} [params]
   * @returns {Promise<{ group: object }>}
   *
   * @example
   * const { group } = await client.groups.get('group-uuid');
   */
  get(groupId, { postAsUserId } = {}) {
    return this._client._get(`/groups/${encodeURIComponent(groupId)}`, { post_as_user_id: postAsUserId });
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
   * @param {string} [params.category]
   * @returns {Promise<{ group: object }>}
   *
   * @example
   * const { group } = await client.groups.create({
   *   name: '猫好きクラブ',
   *   description: '猫が好きな人の集まりです',
   *   visibility: 'open',
   * });
   */
  create({ name, description = '', visibility = 'open', iconData, headerImage, category } = {}) {
    return this._client._post('/groups', {
      name,
      description,
      visibility,
      icon_data: iconData,
      header_image: headerImage,
      category,
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
    return this._client._patch(`/groups/${encodeURIComponent(groupId)}`, {
      name,
      description,
      visibility,
      icon_data: iconData,
      header_image: headerImage,
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
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/transfer-owner`, {
      user_id: userId,
    });
  }

  /**
   * グループを削除します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  delete(groupId) {
    return this._client._delete(`/groups/${encodeURIComponent(groupId)}`);
  }

  /**
   * グループに参加します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ membership: object, joined: true } | { join_request: object, pending: true }>}
   */
  join(groupId) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/join`, {});
  }

  /**
   * グループから退出します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ success: boolean }>}
   */
  leave(groupId) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/leave`, {});
  }

  /**
   * ユーザーをグループに招待します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - 招待するユーザー ID
   * @returns {Promise<{ success: boolean, invite: object }>}
   */
  invite(groupId, userId) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/invites`, {
      user_id: userId,
    });
  }

  /**
   * 保留中の参加申請一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {{status?: string}} [params]
   * @returns {Promise<{ requests: object[] }>}
   */
  getJoinRequests(groupId, { status } = {}) {
    return this._client._get(`/groups/${encodeURIComponent(groupId)}/join-requests`, { status });
  }

  /**
   * 参加申請に応答します。
   *
   * @param {string} groupId - グループ ID
   * @param {string} requestId - 参加申請 ID
   * @param {'approve'|'decline'} decision - 判定
   * @returns {Promise<{ join_request: object }>}
   */
  respondJoinRequest(groupId, requestId, decision) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/join-requests/${encodeURIComponent(requestId)}/respond`, {
      decision,
    });
  }

  /**
   * グループのロール一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @returns {Promise<{ roles: object[] }>}
   */
  getRoles(groupId) {
    return this._client._get(`/groups/${encodeURIComponent(groupId)}/roles`);
  }

  /**
   * グループに新しいカスタムロールを作成します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} params
   * @param {string} params.name - ロール名
   * @param {string[]} params.permissions - 権限リスト
   * @param {number} [params.sortOrder=0] - 表示順序
   * @returns {Promise<{ role: object }>}
   */
  createRole(groupId, { name, permissions, sortOrder = 0 } = {}) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/roles`, {
      name,
      permissions,
      sort_order: sortOrder,
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
    return this._client._patch(`/groups/${encodeURIComponent(groupId)}/roles/${encodeURIComponent(roleId)}`, {
      name,
      permissions,
      sort_order: sortOrder,
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
    return this._client._delete(`/groups/${encodeURIComponent(groupId)}/roles/${encodeURIComponent(roleId)}`);
  }

  /**
   * グループメンバー一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} [params]
   * @param {'active'|'pending'|'invited'|'banned'} [params.status='active'] - 取得するステータス
   * @param {number} [params.limit=200] - 互換用（Serverは無視し、固定値200を使用します）
   * @param {number} [params.offset=0] - 取得開始位置
   * @returns {Promise<{ members: object[] }>}
   */
  getMembers(groupId, { status = 'active', limit = 200, offset = 0 } = {}) {
    return this._client._get(`/groups/${encodeURIComponent(groupId)}/members`, {
      status,
      offset,
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
    return this._client._patch(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`, {
      role_id: roleId,
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
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/ban`, {});
  }

  /**
   * メンバーの BAN を解除します。
   *
   * @param {string} groupId - グループ ID
   * @param {number} userId - BAN 解除するユーザー ID
   * @returns {Promise<{ success: boolean }>}
   */
  unbanMember(groupId, userId) {
    return this._client._post(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/unban`, {});
  }

  /**
   * グループ内の投稿一覧を取得します。
   *
   * @param {string} groupId - グループ ID
   * @param {object} [params]
   * @param {number} [params.limit=30] - 取得件数
   * @param {number} [params.offset=0] - 取得開始位置
   * @param {number} [params.beforeId] - この ID 以前の投稿を取得
   * @param {string} [params.cursor] - キーセットカーソル
   * @param {number} [params.authorId]
   * @param {string} [params.subType]
   * @param {string} [params.order]
   * @param {string} [params.mode]
   * @returns {Promise<{ posts: object[], has_next: boolean, next_cursor: any }>}
   */
  getPosts(groupId, { limit = 30, offset = 0, beforeId, cursor, authorId, subType, order, mode } = {}) {
    return this._client._get(`/groups/${encodeURIComponent(groupId)}/posts`, {
      limit,
      offset,
      before_id: beforeId,
      author_id: authorId,
      sub_type: subType,
      order,
      mode,
      ...(cursor !== undefined && cursor !== null ? { cursor } : {}),
    });
  }
}
