# API Specification

> Last updated: 2026-02-19

**Base URL**: `http://localhost:8080`
**Interactive Docs**: `http://localhost:8080/docs` (Swagger UI) | `http://localhost:8080/redoc` (ReDoc)

---

## Authentication

### POST `/api/auth/register`

Create a new account. **Open to everyone.** Role is assigned automatically:
- Email in `ADMIN_EMAILS` → `role: "admin"`
- Any other email → `role: "user"`

**Request Body**:
```json
{
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "password": "securepassword123"
}
```

**Validation**: `password` min 8 chars, `display_name` min 1 / max 100 chars.

**Response** `200` (also sets `Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "display_name": "Jane Doe",
    "role": "user",
    "created_at": "2026-02-19T00:00:00"
  }
}
```

> Note: `access_token` is also returned in the body for reference, but the **primary transport** is the httpOnly cookie. The frontend ignores the body token.

**Errors**: `400` email already exists | `422` validation error

---

### POST `/api/auth/login`

Authenticate an existing user (admin or regular).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `200`: Same structure as register response (also sets httpOnly cookie).

**Errors**: `401` invalid credentials

---

### POST `/api/auth/logout`

Clears the httpOnly `access_token` cookie.

**Auth**: None (idempotent — safe to call even if not logged in)

**Response** `200`:
```json
{
  "detail": "Logged out."
}
```

---

### GET `/api/auth/me`

Get current authenticated user info. Works for any logged-in user.

**Auth**: `require_auth` (any role)

**Response** `200`:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "role": "user",
  "created_at": "2026-02-19T00:00:00"
}
```

---

## JWT Token

**Algorithm**: HS256
**Expiration**: 24 hours (configurable via `JWT_EXPIRE_MINUTES`)
**Signed with**: `JWT_SECRET_KEY` env var

**Payload**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "display_name": "ZZ",
  "exp": 1771613728
}
```

**Client-side storage**: JWT is stored in an **httpOnly cookie** (`access_token`) — inaccessible to JavaScript. `localStorage["user"]` stores the user object (for UI rendering only).

**How it's sent**: The browser automatically attaches the `access_token` cookie on every request (Axios `withCredentials: true`). The middleware also accepts `Authorization: Bearer <token>` header as a fallback for API testing tools (curl, Swagger).

**Logout**: `POST /api/auth/logout` clears the cookie server-side.

---

## Experiences (Public Read, Admin Write)

### GET `/api/experiences`
List all experiences, ordered by `order` field.

**Auth**: None

**Response** `200`:
```json
{
  "experiences": [
    {
      "experience_id": "uuid",
      "company": "Amazon Web Services",
      "role": "SDE Intern",
      "location": "Seattle, WA",
      "start_date": "Jun. 2025",
      "end_date": "Aug. 2025",
      "bullets": ["Built...", "Developed..."],
      "logo_url": null,
      "order": 0
    }
  ],
  "count": 3
}
```

### GET `/api/experiences/{experience_id}`
**Auth**: None

### POST `/api/experiences`
**Auth**: `require_admin`

### PUT `/api/experiences/{experience_id}`
**Auth**: `require_admin`. Partial updates supported.

### DELETE `/api/experiences/{experience_id}`
**Auth**: `require_admin`. Returns `204`.

---

## Projects (Public Read, Admin Write)

### GET `/api/projects`
List all projects, ordered by `order` field.

**Auth**: None

**Response** `200`:
```json
{
  "projects": [
    {
      "project_id": "uuid",
      "title": "Research Paper Search Engine",
      "tech_stack": "Python, AWS Bedrock, Milvus, MapReduce",
      "date_range": "Feb. 2025 – May 2025",
      "bullets": ["Reused...", "Generated..."],
      "github_url": null,
      "live_url": null,
      "cover_image_url": null,
      "order": 0
    }
  ],
  "count": 1
}
```

### GET `/api/projects/{project_id}` — None
### POST `/api/projects` — `require_admin`
### PUT `/api/projects/{project_id}` — `require_admin`
### DELETE `/api/projects/{project_id}` — `require_admin`, returns `204`

---

## Blog (Public Read, Admin Write)

### GET `/api/blog`
List published blog posts, newest first.

**Auth**: None (public)

### GET `/api/blog/all`
List all posts including drafts.

**Auth**: `require_admin`

### GET `/api/blog/{post_id}`
Get a single blog post.

**Auth**: None (public)

### POST `/api/blog`
Create a new blog post.

**Auth**: `require_admin`

**Request Body**:
```json
{
  "title": "My Blog Post",
  "summary": "A brief summary...",
  "content": "## Full markdown content...",
  "tags": ["AWS", "Python"],
  "cover_image_url": null
}
```

### PUT `/api/blog/{post_id}`
**Auth**: `require_admin`. Partial updates supported.

### DELETE `/api/blog/{post_id}`
**Auth**: `require_admin`. Returns `204`.

---

## Comments (Public Read, Auth Write)

### GET `/api/blog/{post_id}/comments`
List all comments for a blog post, oldest first.

**Auth**: None (public)

**Response** `200`:
```json
{
  "comments": [
    {
      "comment_id": "uuid",
      "post_id": "uuid",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "display_name": "Jane Doe",
      "content": "Great article!",
      "created_at": "2026-02-19T12:00:00"
    }
  ],
  "count": 1
}
```

### POST `/api/blog/{post_id}/comments`
Create a comment on a blog post.

**Auth**: `require_auth` (any logged-in user)

**Request Body**:
```json
{
  "content": "Great article!"
}
```

**Validation**: `content` min 1 / max 2000 chars.

### DELETE `/api/blog/{post_id}/comments/{comment_id}`
Delete a comment. Comment owner or admin only.

**Auth**: `require_auth` (owner check + admin override in service layer)

Returns `204` | `403` not your comment | `404` not found

---

## Health

### GET `/api/health`
**Auth**: None

**Response** `200`:
```json
{
  "status": "healthy",
  "service": "PersonalSite API"
}
```

---

## Auth Middleware Reference

| Guard           | Who can access           | Token source                              | Used on                              |
|-----------------|--------------------------|-------------------------------------------|--------------------------------------|
| `require_admin` | Admin users only         | httpOnly cookie or Bearer header          | Blog write, Experience/Project write |
| `require_auth`  | Any logged-in user       | httpOnly cookie or Bearer header          | Post comments, delete own comments, `/me` |
| `optional_auth` | Anyone (payload or None) | httpOnly cookie or Bearer header (if any) | (available but not currently used) |
| *(none)*        | Public / anonymous       | n/a                                       | Blog read, Experience/Project read, Comments read, Health |

All three auth guards read the JWT from the `access_token` httpOnly cookie first. If no cookie is present, they fall back to the `Authorization: Bearer` header. This supports both browser usage (cookie) and API testing (header).

---

## Error Formats

**Standard error** (401, 403, 404):
```json
{
  "detail": "Human-readable error message"
}
```

**Validation error** (422):
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "password"],
      "msg": "String should have at least 8 characters",
      "input": "12345",
      "ctx": { "min_length": 8 }
    }
  ]
}
```

The frontend `extractErrorMessage()` utility handles both formats gracefully.
