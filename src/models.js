/**
 * @typedef {'Trusted'|'Reliable'|'Credible'|'Neutral'|'Questionable'|'Suspicious'|'Banned'} TrustRank
 * @typedef {{trust: TrustRank, writer: number, reviewer: number}} DisplayRanks
 * @typedef {{trust?: TrustRank|null, writer?: number|null, reviewer?: number|null}} DisplayRankOverrides
 * @typedef {{show_ranks?: boolean, display_ranks?: DisplayRankOverrides, [key: string]: any}} UserSettings
 * @typedef {{id: number, display_ranks?: DisplayRanks|null, settings?: UserSettings, [key: string]: any}} User
 */

/**
 * @template {string|number} T
 * @typedef {{rank: T, label: string, description: string, requirements: string[], benefits: string[], restrictions: string[]}} RankInfo
 */

/**
 * 実ランクは trust / writer / reviewer、表示用は display_ranks を参照します。実スコアは含みません。
 * @typedef {object} UserStatus
 * @property {RankInfo<TrustRank> & {ranks: RankInfo<TrustRank>[]}} trust
 * @property {RankInfo<number> & {ranks: RankInfo<number>[]}} writer
 * @property {RankInfo<number> & {ranks: RankInfo<number>[]}} reviewer
 * @property {DisplayRanks} display_ranks
 * @property {{trust: TrustRank[], writer: number[], reviewer: number[]}} display_rank_options
 * @property {{show_ranks: boolean, display_ranks: {trust: TrustRank|null, writer: number|null, reviewer: number|null}}} display_settings
 */

/**
 * @typedef {{helpfulCount: number, totalRatingCount: number, myRating: boolean|null}} NoteRatingSummary
 * @typedef {'create'|'positive'|'negative'} NoteReasonSide
 * @typedef {{code: string, side: NoteReasonSide, label: string, description: string|null, sortOrder: number}} NoteReasonTag
 * @typedef {object} CommunityNote
 * @property {number} id
 * @property {number} postId
 * @property {number} userId
 * @property {string} content
 * @property {{url: string, title?: string}[]} sources
 * @property {'limited'|'review'|'public'|'rejected'} status
 * @property {number} stage
 * @property {string|null} publishedAt
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {number} helpfulCount
 * @property {number} totalRatingCount
 * @property {boolean|null} myRating
 * @property {{side: NoteReasonSide, code: string}[]} reasons
 * @property {boolean} [eligible]
 */

/**
 * @typedef {object} ServerStatus
 * @property {string} server
 * @property {string} timestamp
 * @property {string} database
 * @property {object} identity
 * @property {{api_endpoint: string, user_file_endpoint: string, share_url: string, post_share_url: string, turnstile_site_key: string, push: {enabled: boolean, vapid_public_key: string}, resource_links: object[], widget_links: object[], ui: object}} client_config
 * @property {string[]} auth_methods
 * @property {{enabled: boolean}} turnstile
 * @property {object} client_limits
 */

export {};
