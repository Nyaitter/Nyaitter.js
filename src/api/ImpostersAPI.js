/**
 * インポスター（代理・サブアカウント）API
 * インポスターの作成・一覧取得・共同運用メンバーの追加/変更/削除・インポスターの削除を行います。
 */
export class ImpostersAPI {
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
    return this._client._get('/imposters');
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
    return this._client._post('/imposters', { name });
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
  addMember(imposterId, { userId, role = 'operator' } = {}) {
    return this._client._post(`/imposters/${imposterId}/members`, {
      user_id: userId,
      role,
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
      role,
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
}
