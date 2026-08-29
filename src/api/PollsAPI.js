/**
 * 投票 API
 * 投稿に添付された投票の取得・投票実行を行います。
 */
export class PollsAPI {
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
   * @param {number[]|number} [params.optionIds] - 投票する選択肢のインデックス配列
   * @param {string} [params.otherText] - 「その他」選択時の自由記述テキスト
   * @returns {Promise<{ poll: object }>}
   *
   * @example
   * const { poll } = await client.polls.vote('poll-id', {
   *   optionIds: [0],
   * });
   */
  vote(pollId, { optionIds, otherText } = {}) {
    const rawIds = Array.isArray(optionIds)
      ? optionIds
      : optionIds !== undefined && optionIds !== null
        ? [optionIds]
        : [];
    return this._client._post(`/polls/${pollId}/vote`, {
      option_ids: rawIds,
      other_text: otherText,
    });
  }
}
