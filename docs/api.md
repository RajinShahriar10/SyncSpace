# SyncSpace API Reference

> **Base URL:** `/api`
> **Total Endpoints:** 129 REST endpoints + 3 health endpoints + 3 SignalR hubs
> **Auth:** JWT Bearer token (unless noted otherwise)

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Health Endpoints (No Auth)](#health-endpoints-no-auth)
- [Auth Controller](#auth-controller)
- [Workspace Controller](#workspace-controller)
- [Document Controller](#document-controller)
- [Board Controller](#board-controller)
- [Chat Controller](#chat-controller)
- [File Controller](#file-controller)
- [Notification Controller](#notification-controller)
- [Search Controller](#search-controller)
- [Analytics Controller](#analytics-controller)
- [Audit Controller](#audit-controller)
- [AI Controller](#ai-controller)
- [Admin Controller](#admin-controller)
- [SignalR Hubs](#signalr-hubs)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Authentication

SyncSpace uses **JWT Bearer tokens** for authentication.

### Obtaining a Token

1. **Register** a new account via `POST /api/Auth/register`.
2. **Login** via `POST /api/Auth/login` or authenticate with Google via `POST /api/Auth/google`.
3. The response includes an `accessToken` and a `refreshToken`.
4. Use the refresh token via `POST /api/Auth/refresh` to obtain a new access token without re-authenticating.

### Using the Token

Include the token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer <your-access-token>
```

### Token Revocation

Call `POST /api/Auth/revoke` to invalidate a refresh token, effectively logging the session out.

---

## Response Format

All API endpoints return a standardized envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "errors": []
}
```

| Field     | Type            | Description                                      |
|-----------|-----------------|--------------------------------------------------|
| `success` | `boolean`       | Whether the request succeeded.                   |
| `data`    | `T`             | The response payload (varies per endpoint).      |
| `message` | `string?`       | Human-readable message (present on errors/info). |
| `errors`  | `string[]`      | List of validation or error messages.            |

---

## Health Endpoints (No Auth)

These endpoints require **no authentication**.

| Method | Route              | Description                                                                 | Returns                                      |
|--------|--------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| GET    | `/api/Health`      | Basic health check                                                          | `{ status, timestamp, version, environment }` |
| GET    | `/health`          | Full health check (DB + Redis connectivity)                                 | `{ status, timestamp, ... }`                 |
| GET    | `/health/ready`    | Readiness check (DB only) — returns 200 when DB is reachable                | `{ status, timestamp, ... }`                 |
| GET    | `/health/live`     | Liveness check — always returns 200                                          | `{ status, timestamp, ... }`                 |

---

## Auth Controller

**Prefix:** `/api/Auth`
**Class-level auth:** None (individual endpoints are noted)

| Method | Route              | Command/Description                     | Auth      | Request Body / Params                                                                 | Returns                        |
|--------|--------------------|-----------------------------------------|-----------|----------------------------------------------------------------------------------------|--------------------------------|
| POST   | `/api/Auth/register` | RegisterCommand                       | No        | `{ email, password, displayName }`                                                     | `ApiResponse<AuthResponse>`    |
| POST   | `/api/Auth/login`    | LoginCommand                          | No        | `{ email, password }`                                                                  | `ApiResponse<AuthResponse>`    |
| POST   | `/api/Auth/refresh`  | RefreshTokenCommand                   | Required  | `{ refreshToken }`                                                                     | `ApiResponse<AuthResponse>`    |
| POST   | `/api/Auth/google`   | GoogleLoginCommand                    | No        | `{ idToken }`                                                                          | `ApiResponse<AuthResponse>`    |
| POST   | `/api/Auth/revoke`   | RevokeTokenCommand                    | Required  | `{ refreshToken }`                                                                     | `ApiResponse<bool>`            |
| GET    | `/api/Auth/me`       | Get current user profile              | Required  | —                                                                                      | `ApiResponse<UserDto>`         |

---

## Workspace Controller

**Prefix:** `/api/Workspace`
**Class-level auth:** `[Authorize]` — all endpoints require authentication.

| Method | Route                                                   | Command/Description              | Request Body / Query Params                                  | Returns                              |
|--------|---------------------------------------------------------|----------------------------------|---------------------------------------------------------------|--------------------------------------|
| POST   | `/api/Workspace`                                        | CreateWorkspaceCommand           | `{ name, description?, icon?, color? }`                       | `ApiResponse<WorkspaceDto>`          |
| GET    | `/api/Workspace/{id}`                                   | Get workspace by ID              | —                                                             | `ApiResponse<WorkspaceDto>`          |
| GET    | `/api/Workspace`                                        | GetUserWorkspaces                | —                                                             | `ApiResponse<List<WorkspaceDto>>`    |
| PUT    | `/api/Workspace/{id}`                                   | UpdateWorkspaceCommand           | `{ name?, description?, icon?, color? }`                      | `ApiResponse<WorkspaceDto>`          |
| DELETE | `/api/Workspace/{id}`                                   | Delete workspace                 | —                                                             | `ApiResponse<bool>`                  |
| GET    | `/api/Workspace/{workspaceId}/members`                  | Get workspace members            | —                                                             | `ApiResponse<List<WorkspaceMemberDto>>` |
| POST   | `/api/Workspace/{workspaceId}/members`                  | InviteMemberCommand              | `{ email, role }`                                             | `ApiResponse<WorkspaceMemberDto>`    |
| DELETE | `/api/Workspace/{workspaceId}/members/{userId}`         | Remove member                    | —                                                             | `ApiResponse<bool>`                  |
| PUT    | `/api/Workspace/{workspaceId}/members/{userId}/role`    | UpdateMemberRoleCommand          | `{ role }`                                                    | `ApiResponse<WorkspaceMemberDto>`    |

---

## Document Controller

**Prefix:** `/api/Document`
**Class-level auth:** `[Authorize]`

### Document CRUD

| Method | Route                                                 | Command/Description         | Request Body / Params                                                      | Returns                           |
|--------|-------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------|-----------------------------------|
| POST   | `/api/Document`                                       | CreateDocumentCommand       | `{ title, content?, workspaceId, folderPath? }`                            | `ApiResponse<DocumentDto>`        |
| GET    | `/api/Document/{id}`                                  | Get document by ID          | —                                                                          | `ApiResponse<DocumentDto>`        |
| GET    | `/api/Document/workspace/{workspaceId}`               | List workspace documents    | —                                                                          | `ApiResponse<List<DocumentDto>>`  |
| PUT    | `/api/Document/{id}`                                  | UpdateDocumentCommand       | `{ title?, content? }`                                                     | `ApiResponse<DocumentDto>`        |
| DELETE | `/api/Document/{id}`                                  | Delete document             | —                                                                          | `ApiResponse<bool>`               |

### Versions

| Method | Route                                                                      | Description                          | Returns                                |
|--------|----------------------------------------------------------------------------|--------------------------------------|----------------------------------------|
| GET    | `/api/Document/{documentId}/versions`                                      | List document versions               | `ApiResponse<List<DocumentVersionDto>>`|
| POST   | `/api/Document/{documentId}/versions/{versionNumber}/restore`              | Restore a specific version           | `ApiResponse<DocumentDto>`             |

### Comments & Reactions

| Method | Route                                                                | Command/Description       | Request Body / Params                    | Returns                       |
|--------|----------------------------------------------------------------------|---------------------------|------------------------------------------|-------------------------------|
| GET    | `/api/Document/{documentId}/comments`                                | List document comments    | —                                        | `ApiResponse<List<CommentDto>>`|
| POST   | `/api/Document/{documentId}/comments`                                | AddCommentCommand         | `{ content }`                            | `ApiResponse<CommentDto>`     |
| PUT    | `/api/Document/comments/{commentId}/resolve`                         | ResolveCommentCommand     | —                                        | `ApiResponse<bool>`           |
| POST   | `/api/Document/comments/{commentId}/reactions`                       | AddReactionCommand        | `{ emoji }`                              | `ApiResponse<ReactionDto>`    |
| DELETE | `/api/Document/comments/{commentId}/reactions/{emoji}`               | Remove reaction           | —                                        | `ApiResponse<bool>`           |

---

## Board Controller

**Prefix:** `/api/Board`
**Class-level auth:** `[Authorize]`

### Board CRUD

| Method | Route                                        | Command/Description     | Request Body / Params                                | Returns                        |
|--------|----------------------------------------------|-------------------------|------------------------------------------------------|--------------------------------|
| POST   | `/api/Board`                                 | CreateBoardCommand      | `{ title, description?, workspaceId }`               | `ApiResponse<BoardDto>`        |
| GET    | `/api/Board/{id}`                            | Get board by ID         | —                                                    | `ApiResponse<BoardDto>`        |
| GET    | `/api/Board/workspace/{workspaceId}`         | List workspace boards   | —                                                    | `ApiResponse<List<BoardDto>>`  |
| GET    | `/api/Board/{id}/full`                       | Get board with cards    | —                                                    | `ApiResponse<BoardWithCardsDto>` |
| PUT    | `/api/Board/{id}`                            | UpdateBoardCommand      | `{ title?, description? }`                           | `ApiResponse<BoardDto>`        |
| DELETE | `/api/Board/{id}`                            | Delete board            | —                                                    | `ApiResponse<bool>`            |

### Columns

| Method | Route                                          | Command/Description     | Request Body / Params                              | Returns                  |
|--------|------------------------------------------------|-------------------------|----------------------------------------------------|--------------------------|
| POST   | `/api/Board/columns`                           | CreateColumnCommand     | `{ boardId, title, position? }`                    | `ApiResponse<ColumnDto>` |
| PUT    | `/api/Board/columns/{id}`                      | UpdateColumnCommand     | `{ title?, position? }`                            | `ApiResponse<ColumnDto>` |
| DELETE | `/api/Board/columns/{id}`                      | Delete column           | —                                                  | `ApiResponse<bool>`      |
| PUT    | `/api/Board/columns/reorder`                   | ReorderColumnsCommand   | `{ columnIds: string[] }`                          | `ApiResponse<bool>`      |

### Cards

| Method | Route                                          | Command/Description     | Request Body / Params                              | Returns                  |
|--------|------------------------------------------------|-------------------------|----------------------------------------------------|--------------------------|
| POST   | `/api/Board/cards`                             | CreateCardCommand       | `{ columnId, title, description?, position? }`     | `ApiResponse<CardDto>`   |
| PUT    | `/api/Board/cards/{id}`                        | UpdateCardCommand       | `{ title?, description?, dueDate? }`               | `ApiResponse<CardDto>`   |
| DELETE | `/api/Board/cards/{id}`                        | Delete card             | —                                                  | `ApiResponse<bool>`      |
| PUT    | `/api/Board/cards/move`                        | MoveCardCommand         | `{ cardId, targetColumnId, position }`             | `ApiResponse<CardDto>`   |
| PUT    | `/api/Board/cards/reorder`                     | ReorderCardsCommand     | `{ columnId, cardIds: string[] }`                  | `ApiResponse<bool>`      |
| PUT    | `/api/Board/cards/assign`                      | AssignCardCommand       | `{ cardId, userId? }`                              | `ApiResponse<CardDto>`   |

### Labels

| Method | Route                                          | Command/Description         | Request Body / Params                  | Returns                      |
|--------|------------------------------------------------|-----------------------------|----------------------------------------|------------------------------|
| POST   | `/api/Board/labels`                            | CreateLabelCommand          | `{ boardId, name, color }`             | `ApiResponse<LabelDto>`      |
| POST   | `/api/Board/cards/labels`                      | AddLabelToCardCommand       | `{ cardId, labelId }`                  | `ApiResponse<bool>`          |
| DELETE | `/api/Board/cards/labels`                      | RemoveLabelFromCardCommand  | `{ cardId, labelId }`                  | `ApiResponse<bool>`          |
| DELETE | `/api/Board/labels/{id}`                       | Delete label                | —                                      | `ApiResponse<bool>`          |

### Card Comments

| Method | Route                                          | Command/Description         | Request Body / Params                  | Returns                          |
|--------|------------------------------------------------|-----------------------------|----------------------------------------|----------------------------------|
| POST   | `/api/Board/cards/comments`                    | AddCardCommentCommand       | `{ cardId, content }`                  | `ApiResponse<CardCommentDto>`    |
| DELETE | `/api/Board/cards/comments/{commentId}`        | Delete card comment         | —                                      | `ApiResponse<bool>`              |

### Card Attachments

| Method | Route                                                  | Command/Description             | Request Body / Params              | Returns                                |
|--------|--------------------------------------------------------|---------------------------------|------------------------------------|----------------------------------------|
| POST   | `/api/Board/cards/attachments`                         | AddCardAttachmentCommand        | `{ cardId, fileName, fileUrl }`    | `ApiResponse<CardAttachmentDto>`       |
| DELETE | `/api/Board/cards/attachments/{attachmentId}`          | Delete attachment               | —                                  | `ApiResponse<bool>`                    |

### Activity & Members

| Method | Route                                                    | Description                    | Returns                                |
|--------|----------------------------------------------------------|--------------------------------|----------------------------------------|
| GET    | `/api/Board/{boardId}/activity`                          | Get board activity log         | `ApiResponse<List<ActivityDto>>`       |
| GET    | `/api/Board/workspace/{workspaceId}/members`             | Get board-eligible members     | `ApiResponse<List<BoardMemberDto>>`    |

---

## Chat Controller

**Prefix:** `/api/Chat`
**Class-level auth:** `[Authorize]`

### Channels

| Method | Route                                                              | Command/Description     | Request Body / Params                    | Returns                            |
|--------|--------------------------------------------------------------------|-------------------------|------------------------------------------|------------------------------------|
| GET    | `/api/Chat/workspaces/{workspaceId}/channels`                     | List workspace channels | —                                        | `ApiResponse<List<ChannelDto>>`    |
| GET    | `/api/Chat/channels/{id}`                                          | Get channel by ID       | —                                        | `ApiResponse<ChannelDto>`          |
| POST   | `/api/Chat/channels`                                               | CreateChannelCommand    | `{ workspaceId, name, description?, isPrivate? }` | `ApiResponse<ChannelDto>`  |
| PUT    | `/api/Chat/channels/{id}`                                          | UpdateChannelCommand    | `{ name?, description? }`                | `ApiResponse<ChannelDto>`          |
| DELETE | `/api/Chat/channels/{id}`                                          | Delete channel          | —                                        | `ApiResponse<bool>`                |
| POST   | `/api/Chat/channels/{channelId}/join`                              | Join channel            | —                                        | `ApiResponse<bool>`                |
| POST   | `/api/Chat/channels/{channelId}/leave`                             | Leave channel           | —                                        | `ApiResponse<bool>`                |

### Messages

| Method | Route                                                              | Command/Description     | Request Body / Query Params                              | Returns                              |
|--------|--------------------------------------------------------------------|-------------------------|----------------------------------------------------------|--------------------------------------|
| GET    | `/api/Chat/channels/{channelId}/messages`                          | Get channel messages    | Query: `limit?`, `before?`                                | `ApiResponse<List<MessageDto>>`      |
| POST   | `/api/Chat/channels/{channelId}/messages`                          | SendMessageCommand      | `{ content }`                                             | `ApiResponse<MessageDto>`            |
| PUT    | `/api/Chat/messages/{messageId}`                                    | EditMessageCommand      | `{ content }`                                             | `ApiResponse<MessageDto>`            |
| DELETE | `/api/Chat/messages/{messageId}`                                    | Delete message          | —                                                         | `ApiResponse<bool>`                  |
| POST   | `/api/Chat/messages/{messageId}/pin`                                | Pin/unpin message       | Query: `pinned` (boolean)                                 | `ApiResponse<bool>`                  |
| GET    | `/api/Chat/channels/{channelId}/pinned`                             | Get pinned messages     | —                                                         | `ApiResponse<List<MessageDto>>`      |
| GET    | `/api/Chat/channels/{channelId}/members`                            | Get channel members     | —                                                         | `ApiResponse<List<ChatMemberDto>>`   |

### Reactions

| Method | Route                                                              | Command/Description     | Request Body / Query Params              | Returns              |
|--------|--------------------------------------------------------------------|-------------------------|------------------------------------------|----------------------|
| POST   | `/api/Chat/messages/{messageId}/reactions`                         | AddReactionCommand      | `{ emoji }`                              | `ApiResponse<ReactionDto>` |
| DELETE | `/api/Chat/messages/{messageId}/reactions`                         | Remove reaction         | Query: `emoji`                           | `ApiResponse<bool>`  |
| POST   | `/api/Chat/channels/{channelId}/read`                              | Mark channel as read    | —                                        | `ApiResponse<bool>`  |

### Direct Messages (DMs)

| Method | Route                                                                      | Command/Description           | Request Body / Query Params               | Returns                                  |
|--------|----------------------------------------------------------------------------|-------------------------------|-------------------------------------------|------------------------------------------|
| GET    | `/api/Chat/workspaces/{workspaceId}/conversations`                        | List DM conversations         | —                                         | `ApiResponse<List<ConversationDto>>`     |
| POST   | `/api/Chat/workspaces/{workspaceId}/conversations`                        | GetOrCreateConversationQuery  | `{ participantId }`                       | `ApiResponse<ConversationDto>`           |
| GET    | `/api/Chat/conversations/{conversationId}/messages`                       | Get DM messages               | Query: `limit?`                           | `ApiResponse<List<DirectMessageDto>>`    |
| POST   | `/api/Chat/conversations/{conversationId}/messages`                       | SendDirectMessageCommand      | `{ content }`                             | `ApiResponse<DirectMessageDto>`          |
| PUT    | `/api/Chat/dm/{messageId}`                                                | EditDirectMessageCommand      | `{ content }`                             | `ApiResponse<DirectMessageDto>`          |
| DELETE | `/api/Chat/dm/{messageId}`                                                | Delete DM                     | —                                         | `ApiResponse<bool>`                      |
| POST   | `/api/Chat/dm/{messageId}/reactions`                                      | AddDmReactionCommand          | `{ emoji }`                               | `ApiResponse<DmReactionDto>`             |
| DELETE | `/api/Chat/dm/{messageId}/reactions`                                      | Remove DM reaction            | Query: `emoji`                            | `ApiResponse<bool>`                      |
| POST   | `/api/Chat/conversations/{conversationId}/read`                           | Mark conversation as read     | —                                         | `ApiResponse<bool>`                      |

---

## File Controller

**Prefix:** `/api/File`
**Class-level auth:** `[Authorize]`

| Method | Route                                                       | Command/Description     | Request Body / Params                                                                                          | Returns                          |
|--------|-------------------------------------------------------------|-------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------|
| POST   | `/api/File/upload`                                          | Upload file             | Form: `file`, `workspaceId`, `folderPath?`, `description?`, `tags?`                                              | `ApiResponse<DriveFileDto>`      |
| GET    | `/api/File/workspace/{workspaceId}`                         | List workspace files    | Query: `folderPath?`, `search?`, `fileType?`, `page?`, `pageSize?`                                               | `ApiResponse<List<DriveFileDto>>`|
| GET    | `/api/File/{fileId}`                                        | Get file by ID          | —                                                                                                               | `ApiResponse<DriveFileDto>`      |
| GET    | `/api/File/{fileId}/preview`                                | Get file preview        | —                                                                                                               | `ApiResponse<FilePreviewDto>`    |
| PUT    | `/api/File/{fileId}`                                        | UpdateFileCommand       | `{ fileName?, description?, tags? }`                                                                             | `ApiResponse<DriveFileDto>`      |
| DELETE | `/api/File/{fileId}`                                        | Delete file (soft)      | —                                                                                                               | `ApiResponse<bool>`              |
| POST   | `/api/File/{fileId}/restore`                                | Restore trashed file    | —                                                                                                               | `ApiResponse<DriveFileDto>`      |
| POST   | `/api/File/{fileId}/move`                                   | Move file               | Query: `targetFolderPath`                                                                                        | `ApiResponse<DriveFileDto>`      |
| GET    | `/api/File/folders/{workspaceId}`                           | List folders            | Query: `parentPath?`                                                                                             | `ApiResponse<List<DriveFolderDto>>` |
| POST   | `/api/File/folders`                                         | CreateFolderCommand     | `{ workspaceId, name, parentPath? }`                                                                             | `ApiResponse<DriveFolderDto>`    |
| DELETE | `/api/File/folders/{folderId}`                              | Delete folder           | Query: `recursive?` (boolean)                                                                                    | `ApiResponse<bool>`              |
| GET    | `/api/File/stats/{workspaceId}`                             | Storage stats           | —                                                                                                               | `ApiResponse<StorageStatsDto>`   |
| GET    | `/api/File/trash/{workspaceId}`                             | List trashed files      | —                                                                                                               | `ApiResponse<List<DriveFileDto>>`|

---

## Notification Controller

**Prefix:** `/api/Notification`
**Class-level auth:** `[Authorize]`

| Method | Route                                | Command/Description     | Request Body / Query Params                                  | Returns                                |
|--------|--------------------------------------|-------------------------|--------------------------------------------------------------|----------------------------------------|
| GET    | `/api/Notification`                  | List notifications      | Query: `userId?`, `unreadOnly?`, `page?`, `pageSize?`        | `ApiResponse<List<NotificationDto>>`   |
| GET    | `/api/Notification/summary`          | Notification summary    | Query: `userId?`                                             | `ApiResponse<NotificationSummaryDto>`  |
| POST   | `/api/Notification`                  | CreateNotificationCommand | `{ userId, title, message, type, link? }`                  | `ApiResponse<NotificationDto>`        |
| PUT    | `/api/Notification/{id}/read`        | Mark as read            | —                                                            | `ApiResponse<bool>`                   |
| POST   | `/api/Notification/read-all`         | Mark all as read        | Query: `userId?`                                             | `ApiResponse<bool>`                   |
| DELETE | `/api/Notification/{id}`             | Delete notification     | —                                                            | `ApiResponse<bool>`                   |

---

## Search Controller

**Prefix:** `/api/Search`
**Class-level auth:** `[Authorize]`

| Method | Route       | Description              | Query Params                                              | Returns  |
|--------|-------------|--------------------------|-----------------------------------------------------------|----------|
| GET    | `/api/Search` | Global search           | `q` (required), `workspaceId`, `category?`, `limit?`     | `object` |

---

## Analytics Controller

**Prefix:** `/api/Analytics`
**Class-level auth:** `[Authorize]`

| Method | Route                                                          | Description                       | Query Params         | Returns  |
|--------|----------------------------------------------------------------|-----------------------------------|----------------------|----------|
| GET    | `/api/Analytics/workspace/{workspaceId}`                       | Workspace analytics overview      | —                    | `object` |
| GET    | `/api/Analytics/workspace/{workspaceId}/growth`                | Workspace growth over time        | Query: `months?`     | `object` |
| GET    | `/api/Analytics/workspace/{workspaceId}/members/top`           | Top members by activity           | Query: `limit?`      | `object` |
| GET    | `/api/Analytics/workspace/{workspaceId}/tasks/status`          | Task status distribution          | —                    | `object` |
| GET    | `/api/Analytics/workspace/{workspaceId}/documents/timeline`    | Document creation timeline        | Query: `months?`     | `object` |
| GET    | `/api/Analytics/workspace/{workspaceId}/messages/timeline`     | Message volume timeline           | Query: `months?`     | `object` |

---

## Audit Controller

**Prefix:** `/api/Audit`
**Class-level auth:** `[Authorize]`

| Method | Route       | Description                | Query Params                                                        | Returns  |
|--------|-------------|----------------------------|---------------------------------------------------------------------|----------|
| GET    | `/api/Audit` | Query audit log entries   | `workspaceId?`, `action?`, `entityType?`, `page?`, `pageSize?`     | `object` |

---

## AI Controller

**Prefix:** `/api/AI`
**Class-level auth:** `[Authorize]`

| Method | Route                     | Command/Description       | Request Body                                                              | Returns  |
|--------|---------------------------|---------------------------|---------------------------------------------------------------------------|----------|
| POST   | `/api/AI/summarize`       | Summarize text/content    | `SummarizeRequest: { text }`                                              | `object` |
| POST   | `/api/AI/meeting-notes`   | Generate meeting notes    | `MeetingNotesRequest: { transcript }`                                     | `object` |
| POST   | `/api/AI/rewrite`         | Rewrite content           | `RewriteRequest: { text, style? }`                                        | `object` |
| POST   | `/api/AI/tasks`           | Extract tasks from text   | `TaskListRequest: { text }`                                               | `object` |
| POST   | `/api/AI/action-items`    | Extract action items      | `ActionItemsRequest: { text }`                                            | `object` |
| POST   | `/api/AI/chat`            | AI assistant chat         | `AIRequest: { message, context? }`                                        | `object` |

---

## Admin Controller

**Prefix:** `/api/Admin`
**Class-level auth:** `[Authorize]`

### Overview

| Method | Route              | Description       | Returns  |
|--------|--------------------|-------------------|----------|
| GET    | `/api/Admin/overview` | Platform overview | `object` |

### User Management

| Method | Route                       | Description       | Request Body / Query Params                                  | Returns  |
|--------|-----------------------------|-------------------|--------------------------------------------------------------|----------|
| GET    | `/api/Admin/users`          | List all users    | Query: `search?`, `page?`, `pageSize?`                       | `object` |
| GET    | `/api/Admin/users/{id}`     | Get user by ID    | —                                                            | `object` |
| PUT    | `/api/Admin/users`          | Update user       | `UpdateUserRequest: { id, email?, displayName?, role?, isActive? }` | `object` |
| DELETE | `/api/Admin/users/{id}`     | Delete user       | —                                                            | `object` |

### Workspace Management

| Method | Route                          | Description          | Request Body / Query Params                                  | Returns  |
|--------|--------------------------------|----------------------|--------------------------------------------------------------|----------|
| GET    | `/api/Admin/workspaces`        | List all workspaces  | Query: `search?`, `page?`, `pageSize?`                       | `object` |
| GET    | `/api/Admin/workspaces/{id}`   | Get workspace by ID  | —                                                            | `object` |
| PUT    | `/api/Admin/workspaces`        | Update workspace     | `UpdateWorkspaceRequest: { id, name?, description?, isArchived? }` | `object` |
| DELETE | `/api/Admin/workspaces/{id}`   | Delete workspace     | —                                                            | `object` |

### Document Management

| Method | Route                          | Description          | Request Body / Query Params                                  | Returns  |
|--------|--------------------------------|----------------------|--------------------------------------------------------------|----------|
| GET    | `/api/Admin/documents`         | List all documents   | Query: `workspaceId?`, `search?`, `page?`, `pageSize?`       | `object` |
| GET    | `/api/Admin/documents/{id}`    | Get document by ID   | —                                                            | `object` |
| DELETE | `/api/Admin/documents/{id}`    | Delete document      | —                                                            | `object` |

### System

| Method | Route               | Description         | Returns  |
|--------|---------------------|---------------------|----------|
| GET    | `/api/Admin/storage`  | Storage statistics  | `object` |
| GET    | `/api/Admin/health`   | System health       | `object` |
| GET    | `/api/Admin/audit`    | Audit log           | `object` |

Query params for `/api/Admin/audit`: `action?`, `userId?`, `workspaceId?`, `page?`, `pageSize?`

---

## SignalR Hubs

SyncSpace provides real-time communication through three SignalR hubs.

| Hub URL                   | Hub Class            | Purpose                                  | Auth     |
|---------------------------|----------------------|------------------------------------------|----------|
| `/hubs/documents`         | `DocumentHub`        | Real-time document collaboration (cursors, edits, presence) | Required |
| `/hubs/chat`              | `ChatHub`            | Real-time messaging (channels, DMs, typing indicators) | Required |
| `/hubs/notifications`     | `NotificationHub`    | Push notifications                       | Required |

### Connection

Connect to a hub using the JWT access token as a query parameter or via an access token factory:

```
/hubs/chat?access_token=<your-jwt-token>
```

### Client Methods

Each hub exposes methods for the client to invoke and server-to-client callbacks. Refer to the hub source code or client SDK for the full method list.

---

## Error Responses

All error responses follow the standard `ApiResponse<T>` envelope with `success: false`.

| HTTP Status | Meaning                                              |
|-------------|------------------------------------------------------|
| `400`       | Bad Request — validation errors or malformed input.  |
| `401`       | Unauthorized — missing or invalid/expired token.     |
| `403`       | Forbidden — authenticated but not authorized.        |
| `404`       | Not Found — resource does not exist.                 |
| `409`       | Conflict — duplicate resource or state conflict.     |
| `429`       | Too Many Requests — rate limit exceeded.             |
| `500`       | Internal Server Error — unexpected server failure.   |

### Example Error

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

---

## Rate Limiting

Rate limiting is enforced on authentication and sensitive endpoints. Limits are applied per IP address.

| Endpoint Category         | Limit                          |
|---------------------------|--------------------------------|
| Auth (register, login)    | 10 requests per minute         |
| Token refresh             | 20 requests per minute         |
| AI endpoints              | 30 requests per minute         |
| File upload               | 20 requests per minute         |
| Admin endpoints           | 60 requests per minute         |
| All other endpoints       | 120 requests per minute        |

When a rate limit is exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header.
