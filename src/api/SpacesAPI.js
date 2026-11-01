/** スペースとチャンネルを操作します。 */
export class SpacesAPI {
  /** @param {import('../NyaitterClient.js').NyaitterClient} client */
  constructor(client) {
    this._client = client;
  }

  /** 音声通話用の接続設定を取得します。 */
  getIceServers() {
    return this._client._get('/spaces/ice-servers');
  }

  /** @param {{query?: string, limit?: number, offset?: number}} [options] */
  list({ query, limit = 20, offset = 0 } = {}) {
    return this._client._get('/spaces', { query, limit, offset });
  }

  /** @param {{limit?: number, offset?: number}} [options] */
  getMine({ limit = 50, offset = 0 } = {}) {
    return this._client._get('/spaces/mine', { limit, offset });
  }

  /** @param {{name: string, visibility: 'public'|'private'|'group', description?: string, groupId?: number|string, iconData?: string, headerImage?: string}} options - group visibility の場合は有効な groupId も必要です */
  create({ name, description, visibility, groupId, iconData, headerImage } = {}) {
    return this._client._post('/spaces', { name, description, visibility, group_id: groupId, iconData, headerImage });
  }

  /** @param {number|string} spaceId */
  get(spaceId) {
    return this._client._get(`/spaces/${encodeURIComponent(spaceId)}`);
  }

  /**
   * @param {number|string} spaceId
   * @param {{name?: string, description?: string, visibility?: 'public'|'private'|'group', groupId?: number|string, iconData?: string, headerImage?: string}} [options]
   */
  update(spaceId, { name, description, visibility, groupId, iconData, headerImage } = {}) {
    return this._client._patch(`/spaces/${encodeURIComponent(spaceId)}`, { name, description, visibility, group_id: groupId, iconData, headerImage });
  }

  /** @param {number|string} spaceId */
  delete(spaceId) {
    return this._client._delete(`/spaces/${encodeURIComponent(spaceId)}`);
  }

  /** @param {number|string} spaceId */
  join(spaceId) {
    return this._client._post(`/spaces/${encodeURIComponent(spaceId)}/join`, {});
  }

  /** @param {number|string} spaceId */
  leave(spaceId) {
    return this._client._post(`/spaces/${encodeURIComponent(spaceId)}/leave`, {});
  }

  /**
   * @param {number|string} spaceId
   * @param {{limit?: number, offset?: number}} [options]
   */
  getMembers(spaceId, { limit = 100, offset = 0 } = {}) {
    return this._client._get(`/spaces/${encodeURIComponent(spaceId)}/members`, { limit, offset });
  }

  /** @param {number|string} spaceId */
  getChannels(spaceId) {
    return this._client._get(`/spaces/${encodeURIComponent(spaceId)}/channels`);
  }

  /**
   * @param {number|string} spaceId
   * @param {{name?: string, kind?: 'text'|'voice'}} [options]
   */
  createChannel(spaceId, { name, kind } = {}) {
    return this._client._post(`/spaces/${encodeURIComponent(spaceId)}/channels`, { name, kind });
  }

  /**
   * @param {number|string} spaceId
   * @param {number|string} channelId
   * @param {{name?: string, kind?: 'text'|'voice'}} [options]
   */
  updateChannel(spaceId, channelId, { name, kind } = {}) {
    return this._client._patch(`/spaces/${encodeURIComponent(spaceId)}/channels/${encodeURIComponent(channelId)}`, { name, kind });
  }

  /**
   * @param {number|string} spaceId
   * @param {number|string} channelId
   */
  deleteChannel(spaceId, channelId) {
    return this._client._delete(`/spaces/${encodeURIComponent(spaceId)}/channels/${encodeURIComponent(channelId)}`);
  }

  /**
   * @param {number|string} spaceId
   * @param {number|string} channelId
   * @param {{limit?: number, beforeId?: number|string}} [options]
   */
  getMessages(spaceId, channelId, { limit = 50, beforeId } = {}) {
    return this._client._get(`/spaces/${encodeURIComponent(spaceId)}/channels/${encodeURIComponent(channelId)}/messages`, { limit, before_id: beforeId });
  }

  /**
   * @param {number|string} spaceId
   * @param {number|string} channelId
   * @param {{content?: string}} [options]
   */
  sendMessage(spaceId, channelId, { content } = {}) {
    return this._client._post(`/spaces/${encodeURIComponent(spaceId)}/channels/${encodeURIComponent(channelId)}/messages`, { content });
  }

  /**
   * @param {number|string} spaceId
   * @param {number|string} messageId
   */
  deleteMessage(spaceId, messageId) {
    return this._client._delete(`/spaces/${encodeURIComponent(spaceId)}/messages/${encodeURIComponent(messageId)}`);
  }
}
