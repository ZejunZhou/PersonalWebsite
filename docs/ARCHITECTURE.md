# Architecture Document

> Last updated: 2026-02-19

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                   │
│                 frontend-portal/:3000                    │
│  ┌──────────┐ ┌────────┐ ┌───────┐ ┌─────┐ ┌───────┐  │
│  │  Pages   │ │Context │ │Services│ │Theme│ │ Hooks │  │
│  └──────────┘ └────────┘ └───────┘ └─────┘ └───────┘  │
│       │            │           │                         │
│       │     AuthContext    Axios client                  │
│       │   (user, isAdmin) (withCredentials:true)         │
│       │            │           │                         │
│  httpOnly cookie (JWT)  + user object in localStorage   │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI)                        │
│                backend-service/:8080                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │Controllers │ │ Services │ │     Middleware        │  │
│  │  (Routes)  │ │(Business)│ │ require_auth (any)   │  │
│  │            │ │  OOP     │ │ require_admin (admin) │  │
│  │            │ │          │ │ optional_auth         │  │
│  └────────────┘ └──────────┘ └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ boto3 SDK
┌──────────────────────────▼──────────────────────────────┐
│             DynamoDB (Local via Docker, in-memory)        │
│                        :8000                              │
│  ┌───────┐ ┌──────────┐ ┌───────────┐ ┌────────┐       │
│  │ Users │ │BlogPosts │ │Experiences│ │Projects│       │
│  └───────┘ └──────────┘ └───────────┘ └────────┘       │
│  ┌──────────┐                                            │
│  │ Comments │                                            │
│  └──────────┘                                            │
└──────────────────────────────────────────────────────────┘
```

## 2. Design Principles

### 2.1 Separation of Concerns
- **Controllers** handle HTTP request/response only
- **Services** contain all business logic (OOP, inheriting from `BaseService`)
- **Models** define data shapes with Pydantic validation
- **Middleware** handles cross-cutting concerns (auth guards, CORS)

### 2.2 OOP Service Architecture

All domain services inherit from `BaseService`, which provides generic DynamoDB CRUD:

```
BaseService (ABC)
├── get_by_id()
├── get_all()
├── create()
├── update()
├── delete()
│
├── ExperienceService
│   └── get_ordered(), create_experience(), update_experience()
├── ProjectService
│   └── get_ordered(), create_project(), update_project()
├── BlogService
│   └── get_published_posts(), get_all_posts(), create_post(), update_post()
├── CommentService
│   └── get_by_post(), create_comment(), delete_comment()
└── AuthService (standalone — does not extend BaseService)
    └── register(), login(), verify_token()
```

### 2.3 User Roles & Permission Model

Two roles exist: `admin` and `user`.

| Action                  | Anonymous | User (logged in) | Admin  |
|-------------------------|-----------|------------------|--------|
| View experiences        | Yes       | Yes              | Yes    |
| View projects           | Yes       | Yes              | Yes    |
| View blog posts         | Yes       | Yes              | Yes    |
| View comments           | Yes       | Yes              | Yes    |
| Post comments           | No        | Yes              | Yes    |
| Delete own comments     | —         | Yes              | Yes    |
| Delete any comment      | No        | No               | Yes    |
| Create/edit/delete blog | No        | No               | Yes    |
| Create/edit/delete exp  | No        | No               | Yes    |
| Create/edit/delete proj | No        | No               | Yes    |

Role assignment at registration:
- Email in `ADMIN_EMAILS` env var → `role: "admin"`
- Any other email → `role: "user"`

### 2.4 Authentication & JWT Flow

```
Client (Browser)            Backend (FastAPI)             DynamoDB
  │                              │                            │
  │  POST /api/auth/login        │                            │
  │  { email, password }         │                            │
  │ ─────────────────────►       │                            │
  │                              │  scan Users(email=...)     │
  │                              │ ─────────────────────►     │
  │                              │   ◄─────────────────────   │
  │                              │  verify bcrypt(password)   │
  │                              │  generate JWT              │
  │   ◄─────────────────────     │                            │
  │  Set-Cookie: access_token=jwt│ (httpOnly, SameSite=Lax)   │
  │  { user }                    │                            │
  │                              │                            │
  │  [Store user in localStorage]│                            │
  │  [Cookie stored by browser]  │                            │
  │                              │                            │
  │  GET /api/blog/{id}/comments │                            │
  │  (no cookie needed — public) │                            │
  │ ─────────────────────►       │                            │
  │                              │  scan Comments(post_id=..) │
  │   ◄─────────────────────     │                            │
  │  { comments: [...] }         │                            │
  │                              │                            │
  │  POST /api/blog/{id}/comments│                            │
  │  Cookie: access_token=<jwt>  │                            │
  │ ─────────────────────►       │                            │
  │                              │  decode JWT → payload      │
  │                              │  require_auth: any role OK │
  │                              │  put_item Comments         │
  │   ◄─────────────────────     │                            │
  │  { comment }                 │                            │
```

**JWT Token Details:**

| Field          | Description                              |
|----------------|------------------------------------------|
| `sub`          | User ID (UUID)                           |
| `email`        | User email                               |
| `role`         | `"admin"` or `"user"`                    |
| `display_name` | User's display name                      |
| `exp`          | Expiration timestamp (24h from creation) |

**Where JWT is stored:**
- **Backend**: JWT is never persisted. Stateless — generated on login/register, set as an httpOnly cookie, verified on each request by decoding with `JWT_SECRET_KEY`.
- **Browser**: JWT lives in an **httpOnly cookie** (`access_token`). JavaScript cannot read it — the browser sends it automatically on every request.
- **Frontend localStorage**: Only stores the **user object** (`{ user_id, email, display_name, role, created_at }`) for UI rendering. No token in JS.
- **Automatic sending**: Axios uses `withCredentials: true` so the browser attaches the cookie to every request.
- **Auto-logout**: Axios 401 interceptor clears localStorage user → redirects to `/login`. Logout calls `POST /api/auth/logout` which clears the cookie server-side.

**Cookie settings:**

| Property   | Value                  | Why                                       |
|------------|------------------------|-------------------------------------------|
| `httpOnly` | `true`                 | JS cannot access → prevents XSS theft     |
| `sameSite` | `lax`                  | Sent on same-site requests (localhost dev) |
| `secure`   | `false` (dev)          | Set `true` in production (requires HTTPS) |
| `maxAge`   | 86400s (24h)           | Matches JWT expiration                    |
| `path`     | `/`                    | Cookie sent on all API routes             |

### 2.5 Frontend Architecture

- **AuthContext** (React Context API) provides `{ user, isAuthenticated, isAdmin, login, register, logout }` globally
- **Page-based routing** with React Router v6
- **API service layer** — singleton `ApiClient` class wrapping Axios with interceptors
- **`extractErrorMessage()`** utility to safely parse FastAPI error responses (handles both string `detail` and 422 validation arrays)
- **Material UI** dark theme with Inter font

## 3. Technology Decisions

| Decision           | Choice           | Rationale                                         |
|--------------------|------------------|---------------------------------------------------|
| Backend framework  | FastAPI          | Async, auto-docs, Pydantic integration            |
| Auth mechanism     | JWT (HS256)      | Stateless, no session store needed                |
| Token storage      | httpOnly cookie  | Immune to XSS, auto-sent by browser              |
| Password hashing   | bcrypt (v4.0.1)  | Industry standard, pinned for passlib compat      |
| Database           | DynamoDB         | Matches AWS ecosystem experience, schema-flexible |
| Frontend state     | Context API      | Sufficient for auth; avoids Redux complexity      |
| UI library         | Material UI v7   | Comprehensive component library, theming support  |
| CSS approach       | MUI `sx` prop    | Co-located styles, type-safe, themeable           |
| Dev hot-reload     | Volume mounts    | Docker volumes map source → container for HMR     |

## 4. Security Considerations

- JWT stored in **httpOnly cookie** — JavaScript cannot access the token, preventing XSS token theft
- `POST /api/auth/logout` endpoint clears the cookie server-side
- Passwords hashed with bcrypt before storage (cost factor = default 12)
- JWT tokens expire after 24 hours (configurable via `JWT_EXPIRE_MINUTES`)
- JWT secret key configurable via `JWT_SECRET_KEY` environment variable
- Admin registration uses email whitelist (`ADMIN_EMAILS`) — regular users can register freely
- CORS configured to allow only the frontend origin, with `allow_credentials=True` for cookies
- 401 responses automatically clear frontend user state and redirect to login
- Comment deletion: owners can delete their own; admins can delete any
- Seed admin account created automatically with bcrypt-hashed password
