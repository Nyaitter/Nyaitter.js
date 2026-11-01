# Posts / Groups / Notes SDK・Server 契約照合

対象は `Server/server/routes/{posts,groups,notes}.js` のルーター登録と `src/api/{PostsAPI,GroupsAPI,NotesAPI}.js`。Server ソースの登録 method/path/auth と数は永続テストで検証する。各 router はそれぞれ `/posts`、`/groups`、ルート直下に mount される前提で記載。

| Server登録 (router内 path) | SDK操作 | 契約メモ |
|---|---|---|
| POST `/` (posts, required) | `posts.create` | body snake_case変換。202 `{success,queued,action_id}`。 |
| GET `/` (posts, optional) | `posts.list` | tab/limit/offset/before_id/since_id/cursor/order。`{posts,has_more,next_cursor}` |
| GET `/trending` (posts, optional) | `posts.getTrending` | limit。`{posts}` |
| GET `/search` (posts, optional) | `posts.search` | SDKは `/posts/search`。`q,limit,offset,before_id,cursor`。 |
| GET `/recommended` (posts, optional) | `posts.getRecommended` | limit/offset/before_id/cursor。 |
| GET `/page` (posts, optional) | `posts.getPage`, `posts.getTimeline` | mode/tab/q/user_id/sub_type/pin_id/ids/limit/offset/before_id/cursor。 |
| GET `/ids` (posts, optional) | `posts.getIds` | tab/limit/offset/cursor。 |
| GET `/trending-hashtags` (posts, optional) | `posts.getTrendingHashtags` | limit。`{trends}` |
| POST `/hydrate` (posts, optional) | `posts.hydrate` | `{post_ids}` → `{posts}` |
| POST `/metrics` (posts, optional) | `posts.getMetrics` | `{post_ids}` → `{metrics}` |
| GET `/:id/thread` (posts, optional) | `posts.getThread` | limit/offset。 |
| GET `/:id` (posts, optional) | `posts.get` | `{post}` |
| GET `/:id/replies` (posts, optional) | `posts.getReplies` | limit/offset/cursor。 |
| POST `/:id/like` (posts, required) | `posts.like`, `posts.unlike` | 空body。 |
| POST `/:id/star` (posts, required) | `posts.star`, `posts.unstar` | 空body。 |
| DELETE `/:id` (posts, required) | `posts.delete`, `posts.unrepost` | `{success}` / queued action。 |
| DELETE `/admin/:id` (posts, admin) | `posts.adminDelete` | 管理者ルート。 |
| GET `/:id/activity` (posts, optional) | `posts.getActivity` | `{activity}`。 |
| GET `/:id/quotes` (posts, optional) | `posts.getQuotes` | limit (offsetはServerに送信しない)。 |
| GET `/:id/reposts` (posts, optional) | `posts.getReposts` | limit。 |
| GET `/:id/likes` (posts, optional) | `posts.getLikes` | limit。 |
| POST `/:id/repost` (posts, required) | `posts.repost` | 空body。 |
| POST `/:id/pin` (posts, required) | `posts.pin` | 空body。 |
| POST `/:id/dislike` (posts, required) | `posts.dislike` | 空body。 |
| PUT `/:id` (posts, required) | `posts.update`, `posts.edit` | content/attachments/mask/lock/reply_control。 |
| GET `/` (groups, optional) | `groups.list` | query/limit/offset。 |
| POST `/` (groups, required) | `groups.create` | name/description/visibility/icon_data/header_image/category。 |
| GET `/mine` (groups, required) | `groups.listMine` | limit/offset。SDKのpostAsUserIdは送信しない。 |
| GET `/invites/mine` (groups, required) | `groups.getInvitesMine` | `{invites}` |
| POST `/invites/:inviteId/respond` (groups, required) | `groups.respondInvite` | `{decision}` |
| GET `/:groupId` (groups, optional) | `groups.get` | SDKはpost_as_user_idも受け付ける。 |
| PATCH `/:groupId` (groups, required) | `groups.update` | icon_data/header_image変換。 |
| POST `/:groupId/transfer-owner` (groups, required) | `groups.transferOwner` | `{user_id}` |
| DELETE `/:groupId` (groups, required) | `groups.delete` | `{success}` |
| POST `/:groupId/join` (groups, required) | `groups.join` | membershipまたはjoin_request。 |
| POST `/:groupId/leave` (groups, required) | `groups.leave` | `{success}` |
| POST `/:groupId/invites` (groups, required) | `groups.invite` | `{user_id}` |
| GET `/:groupId/join-requests` (groups, required) | `groups.getJoinRequests` | status。 |
| POST `/:groupId/join-requests/:requestId/respond` (groups, required) | `groups.respondJoinRequest` | `{decision}` |
| GET `/:groupId/roles` (groups, required) | `groups.getRoles` | `{roles}` |
| POST `/:groupId/roles` (groups, required) | `groups.createRole` | name/permissions/sort_order。 |
| PATCH `/:groupId/roles/:roleId` (groups, required) | `groups.updateRole` | name/permissions/sort_order。 |
| DELETE `/:groupId/roles/:roleId` (groups, required) | `groups.deleteRole` | `{success}` |
| GET `/:groupId/members` (groups, required) | `groups.getMembers` | status/offset (limitは互換引数だが送信しない)。 |
| PATCH `/:groupId/members/:userId` (groups, required) | `groups.updateMember` | `{role_id}` |
| POST `/:groupId/members/:userId/ban` (groups, required) | `groups.banMember` | 空body。 |
| POST `/:groupId/members/:userId/unban` (groups, required) | `groups.unbanMember` | 空body。 |
| GET `/:groupId/posts` (groups, required) | `groups.getPosts` | limit/offset/before_id/author_id/sub_type/order/mode/cursor。 |
| POST `/notes/:noteId/re-evaluate` (notes, admin) | `notes.reEvaluate` | 空body。 |
| POST `/posts/:postId/notes` (notes, required) | `notes.create` | content/sources/reasons → `{note}`。 |
| GET `/posts/:postId/notes` (notes, required) | `notes.list` | `{notes,eligible}` |
| POST `/notes/bulk` (notes, required) | `notes.listForPosts` | `{post_ids}`（最大50件）→ `{notes_by_post,missing_post_ids}`。意味は投稿ごとの一覧取得と同一。 |
| GET `/notes/reason-tags` (notes, required) | `notes.getReasonTags` | side → `{tags}` |
| POST `/notes/:noteId/ratings` (notes, required) | `notes.rate` | helpful/reasons。 |
| DELETE `/notes/:noteId` (notes, required) | `notes.delete` | `{success}` |

SDK共通HTTP層は成功JSONをそのまま返し、非2xxは `NyaitterError` としてstatus/error messageを伝播する。今回の永続テストは隔離モックHTTPでwire request・Bearer header・エラー伝播を確認するもの。Server登録インベントリは実ソースから照合するが、実Serverを起動してのHTTP統合試験ではなく、DB動作・実認証/認可・個々の成功レスポンスは未検証。`getIconUrl` はHTTP APIではない。
