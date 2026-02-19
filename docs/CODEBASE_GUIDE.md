# Codebase Guide — Folder-by-Folder

> Last updated: 2026-02-19
>
> This document explains every folder and key file in the project so a new developer can orient quickly.

---

## Root

```
PersonalWebSite/
├── docker-compose.yml    # Defines all 3 services (DynamoDB, backend, frontend)
│                         # with volume mounts for hot-reload development
├── README.md             # Project overview, quick start, feature summary
└── docs/                 # All development documentation (you are here)
```

---

## `docs/` — Development Documentation

| File                 | Purpose                                                    |
|----------------------|------------------------------------------------------------|
| `ARCHITECTURE.md`    | System diagram, OOP patterns, auth flow, permission model  |
| `API_SPEC.md`        | Every REST endpoint with request/response examples         |
| `DATABASE_DESIGN.md` | All 5 DynamoDB tables with schemas and access patterns     |
| `DEPLOYMENT.md`      | Docker setup, env vars, seed admin, production checklist   |
| `CODEBASE_GUIDE.md`  | This file — folder-by-folder orientation                   |
| `CHANGELOG.md`       | Version history with detailed change descriptions          |

---

## `backend-service/` — Python FastAPI Backend

```
backend-service/
├── main.py                    # FastAPI app entry point — creates app, registers
│                              # CORS middleware, and includes all route files
├── requirements.txt           # Python dependencies with pinned versions
├── Dockerfile                 # Container image (python:3.11-slim based)
│
├── app/                       # Application package
│   ├── __init__.py
│   │
│   ├── config/                # ── Configuration Layer ──
│   │   ├── settings.py        # Pydantic Settings class: reads env vars for
│   │   │                      # DB endpoint, JWT secret, admin emails, CORS,
│   │   │                      # cookie settings. Single `settings` instance.
│   │   └── database.py        # DynamoDB client singleton (boto3 resource).
│   │                          # `db_client.get_table("TableName")` used everywhere.
│   │
│   ├── models/                # ── Data Models (Pydantic) ──
│   │   │                      # Define request/response shapes with validation.
│   │   │                      # No business logic here — pure data contracts.
│   │   ├── user.py            # UserCreate, UserLogin, UserResponse, TokenResponse
│   │   ├── blog.py            # BlogPostCreate/Update/Response, BlogPostListResponse
│   │   ├── comment.py         # CommentCreate, CommentResponse, CommentListResponse
│   │   ├── experience.py      # ExperienceCreate/Update/Response, ExperienceListResponse
│   │   └── project.py         # ProjectCreate/Update/Response, ProjectListResponse
│   │
│   ├── services/              # ── Business Logic Layer (OOP) ──
│   │   │                      # All domain logic lives here. Controllers call services.
│   │   ├── base_service.py    # Abstract base class: generic get/create/update/delete
│   │   │                      # for any DynamoDB table. Subclasses define table_name
│   │   │                      # and key_field. Builds UpdateExpression dynamically.
│   │   ├── auth_service.py    # Standalone (not BaseService). Handles register, login,
│   │   │                      # bcrypt hashing/verify, JWT create/verify. Singleton.
│   │   ├── blog_service.py    # Extends BaseService. create_post, update_post,
│   │   │                      # get_published_posts, get_all_posts.
│   │   ├── comment_service.py # Extends BaseService. create_comment, get_by_post,
│   │   │                      # delete_comment (with owner/admin permission check).
│   │   ├── experience_service.py  # Extends BaseService. get_ordered, create/update.
│   │   └── project_service.py     # Extends BaseService. get_ordered, create/update.
│   │
│   ├── controllers/           # ── Route Handlers (API Endpoints) ──
│   │   │                      # Thin layer: parse request → call service → return response.
│   │   │                      # Each file is a FastAPI APIRouter with a URL prefix.
│   │   ├── auth_controller.py     # /api/auth/*  — login, register, logout, me
│   │   │                          # Sets/clears httpOnly cookie on login/logout.
│   │   ├── blog_controller.py     # /api/blog/*  — CRUD for blog posts
│   │   ├── comment_controller.py  # /api/blog/{post_id}/comments/*  — CRUD for comments
│   │   ├── experience_controller.py # /api/experiences/*  — CRUD for experiences
│   │   ├── project_controller.py    # /api/projects/*  — CRUD for projects
│   │   └── health_controller.py     # /api/health  — simple health check
│   │
│   ├── middleware/            # ── Auth Guards (FastAPI Dependencies) ──
│   │   └── auth.py            # Three dependency functions injected via Depends():
│   │                          #   require_auth  — any logged-in user
│   │                          #   require_admin — admin role only
│   │                          #   optional_auth — returns payload or None
│   │                          # Reads JWT from httpOnly cookie first, then
│   │                          # falls back to Authorization: Bearer header.
│   │
│   └── utils/                 # ── Shared Utilities ──
│       └── (empty)            # Reserved for future helpers (e.g. pagination, S3 upload)
│
├── scripts/
│   └── seed_db.py             # Run at container startup. Waits for DynamoDB,
│                              # creates all 5 tables, inserts seed admin + data.
│
└── tests/                     # Reserved for pytest unit/integration tests
    └── __init__.py
```

### Key patterns to understand:

1. **Service inheritance**: `BlogService(BaseService)` — only needs to define `table_name`, `key_field`, and domain methods. Generic CRUD is inherited.
2. **Dependency injection**: Controllers use `admin=Depends(require_admin)` to guard endpoints. The resolved payload (`{ sub, email, role, display_name }`) is passed as a parameter.
3. **Cookie auth**: `_extract_token()` in middleware reads the `access_token` httpOnly cookie. Falls back to Bearer header for API testing tools (Swagger, curl).

---

## `frontend-portal/` — React TypeScript SPA

```
frontend-portal/
├── Dockerfile                 # Container image (node:18-alpine), runs npm start
├── package.json               # Dependencies: React, MUI, Router, Axios, FontAwesome
├── tsconfig.json              # TypeScript configuration
│
├── public/                    # Static files served as-is
│   ├── index.html             # SPA entry HTML (single <div id="root">)
│   ├── favicon.ico
│   └── manifest.json
│
└── src/
    ├── index.tsx              # ReactDOM.createRoot → renders <App />
    ├── App.tsx                # Top-level component: ThemeProvider → AuthProvider
    │                          # → Router → Navbar + Routes + Footer
    ├── react-app-env.d.ts     # CRA TypeScript reference
    │
    ├── theme/                 # ── MUI Theme ──
    │   └── theme.ts           # Dark mode palette, Inter font, custom component
    │                          # overrides (Button, Card, Chip). Used via ThemeProvider.
    │
    ├── context/               # ── React Context ──
    │   └── AuthContext.tsx     # Global auth state: user, isAuthenticated, isAdmin.
    │                          # login/register call API → store user in localStorage
    │                          # (NOT token — token is in httpOnly cookie).
    │                          # logout calls POST /api/auth/logout → clears cookie.
    │                          # On mount, reads localStorage user + validates via /me.
    │
    ├── services/              # ── API Client ──
    │   └── api.ts             # Singleton ApiClient class wrapping Axios.
    │                          # - withCredentials: true (sends cookies automatically)
    │                          # - 401 interceptor: clears user, redirects to /login
    │                          # - All API methods grouped by domain
    │                          # - extractErrorMessage() for FastAPI error parsing
    │
    ├── components/            # ── Reusable UI Components ──
    │   └── layout/
    │       ├── Navbar.tsx     # Sticky top bar with nav links + Login/Logout button.
    │       │                  # Responsive: desktop buttons / mobile hamburger drawer.
    │       └── Footer.tsx     # Copyright + social links (GitHub, LinkedIn, Email)
    │                          # using Font Awesome icons.
    │
    ├── pages/                 # ── Route-Level Pages ──
    │   │                      # Each folder = one route. Contains the main page component.
    │   │
    │   ├── Home/
    │   │   └── HomePage.tsx   # Hero section ("Building Scalable Systems & Products"),
    │   │                      # 4 highlight cards, tech stack chips.
    │   │
    │   ├── Experience/
    │   │   └── ExperiencePage.tsx  # Fetches GET /api/experiences, renders timeline
    │   │                          # cards with company, role, location, date, bullets.
    │   │
    │   ├── Projects/
    │   │   └── ProjectsPage.tsx   # Fetches GET /api/projects, renders cards with
    │   │                          # tech stack chips, GitHub/live links, bullets.
    │   │
    │   ├── Blog/
    │   │   ├── BlogPage.tsx       # Lists published posts (public). "New Post" button
    │   │   │                      # only visible if isAdmin.
    │   │   ├── BlogDetailPage.tsx # Single post view + full comments section.
    │   │   │                      # Delete post button (admin only).
    │   │   │                      # Comment form (logged-in users) or "Log in" prompt.
    │   │   │                      # Delete comment (owner or admin).
    │   │   └── BlogCreatePage.tsx # Form: title, summary, tags, content. Admin only.
    │   │
    │   └── Login/
    │       └── LoginPage.tsx  # Tabbed Login / Register form. On success, redirects
    │                          # to /blog. Uses extractErrorMessage for validation errors.
    │
    └── hooks/                 # ── Custom Hooks ──
        └── (empty)            # Reserved for future hooks (e.g. useDebounce, usePagination)
```

### Key patterns to understand:

1. **Auth state**: `useAuth()` hook provides `{ user, isAuthenticated, isAdmin, login, register, logout }`. Token is never in JS — it's in the httpOnly cookie, sent automatically by the browser.
2. **Conditional rendering**: `{isAdmin && <Button>New Post</Button>}` hides admin-only UI from regular users.
3. **API calls**: All go through `apiClient.methodName()`. Cookies are sent automatically via `withCredentials: true`.
4. **Error handling**: `extractErrorMessage(err, "fallback")` safely converts FastAPI's error responses (string or validation array) into a displayable string.

---

## Data Flow Example: User Posts a Comment

```
1. User types comment, clicks Send
2. BlogDetailPage calls apiClient.createComment(postId, text)
3. Axios POST /api/blog/{id}/comments with { content }
   └─ Browser automatically attaches access_token httpOnly cookie
4. FastAPI routes to comment_controller.create_comment()
   └─ Depends(require_auth) → middleware reads cookie → decodes JWT
5. comment_service.create_comment() → DynamoDB put_item
6. Response 201 { comment_id, post_id, user_id, display_name, content, created_at }
7. BlogDetailPage appends new comment to state → re-renders
```
