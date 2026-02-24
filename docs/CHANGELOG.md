# Changelog

> All notable changes to this project are documented here.

## [1.6.0] - 2026-02-23

### Added
- **AWS Lambda deployment**: `handler.py` (Mangum adapter) + `scripts/deploy-lambda.sh` interactive deploy script for Lambda + Function URL
- **`DEPLOY_ENV` toggle**: Single env var (`local` / `cloud`) controls DynamoDB client mode — local uses explicit endpoint + dummy creds, cloud uses default boto3 credential chain (IAM role)

### Changed
- **`settings.py`**: Added `deploy_env` field with `is_cloud` property; all sensitive defaults clearly marked for override
- **`database.py`**: Branches on `settings.is_cloud` — cloud mode skips `endpoint_url` and uses IAM role credentials
- **`seed_db.py`**: Detects `DEPLOY_ENV=cloud` and skips Docker wait loop; verifies cloud connectivity directly
- **`docker-compose.yml`**: Now explicitly sets `DEPLOY_ENV=local`
- **`.gitignore`**: Added `lambda.zip` and `.build/` artifacts

### Documentation
- Rewrote `DEPLOYMENT.md` with full cloud deployment guide, free tier reference, and updated production checklist

---

## [1.5.0] - 2026-02-23

### Added
- **GSI `gsi_email` on Users table**: Replaces full-table scan with O(1) query on every login/register
- **GSI `gsi_post_id` on Comments table**: Queries comments by `post_id` + `created_at` sort key instead of scanning all comments
- **Cursor-based pagination**: Blog (`GET /api/blog`, `GET /api/blog/all`) and comment (`GET /api/blog/{post_id}/comments`) endpoints now accept `?limit=&cursor=` query params and return `next_cursor` in the response
- **`BaseService.scan_page()`**: Paginated scan with `Limit` + `ExclusiveStartKey`, forwarded as base64-encoded cursor
- **`BaseService.scan_all()`**: Drains all pages internally — explicitly marked for bounded small tables only
- **`BaseService.query_index()`**: GSI query helper with pagination support
- **Brown University GRA experience**: Added as the first experience entry (Sep. 2025 – Present) with PHI extraction, RAG, RoBERTa/Llama research bullets
- **Second blog post**: "Reducing PHI Extraction Errors with Hybrid NER and RAG"
- **Categorized Technical Skills UI**: HomePage skills section redesigned into three columns — Languages, Cloud & Developer Tools, Frameworks/Databases — with colored icons and hover effects
- **i18n `skillCategory.*` keys**: New translation keys for skill categories in both English and Chinese

### Changed
- **Seed script is now fully idempotent**: Uses `DescribeTable` (not `list_tables`) to check table existence; uses `ConditionExpression="attribute_not_exists(pk)"` on all inserts; deterministic UUIDs (`uuid5`) for seed data so re-runs are no-ops
- **`auth_service._get_user_by_email()`**: Replaced full-table scan with GSI query on `gsi_email`
- **`comment_service.get_by_post()`**: Replaced full-table scan + filter with GSI query on `gsi_post_id`
- **`blog_service.get_published_posts/get_all_posts()`**: Now return `(items, next_cursor)` tuple with paginated scan
- **`experience_service/project_service.get_ordered()`**: Now uses `scan_all()` (paginated internally) instead of bare `table.scan()`
- **`BaseService`**: Removed bare `get_all()` method; replaced with `scan_page()` and `scan_all()`
- **`BlogPostListResponse` / `CommentListResponse`**: Added `next_cursor: Optional[str]` field
- **Seed data**: Experience bullets updated to match latest resume; 4 experiences (was 3), 2 blog posts (was 1)
- **Homepage `techStack` label**: Changed from "Tech Stack" to "Technical Skills" (技术技能)

### Documentation
- Rewrote `DATABASE_DESIGN.md` with GSI tables, operation pattern reference, cursor pagination notes
- Updated all docs (ARCHITECTURE, API_SPEC, CODEBASE_GUIDE, DEPLOYMENT, README) to reflect v1.5.0 changes

---

## [1.4.0] - 2026-02-20

### Added
- **Blog Edit Page** (`BlogEditPage.tsx`): Admins can now edit existing blog posts via a pre-filled form at `/blog/:postId/edit`
- **Experience Admin CRUD**: New `ExperienceCreatePage` and `ExperienceEditPage` pages; ExperiencePage now shows Add/Edit/Delete buttons for admins
- **Project Admin CRUD**: New `ProjectCreatePage` and `ProjectEditPage` pages; ProjectsPage now shows Add/Edit/Delete buttons for admins
- **Markdown Rendering**: Blog post content is now rendered as Markdown using `react-markdown` + `remark-gfm` with styled headings, code blocks, tables, blockquotes, and links
- **New i18n Keys**: Added `blogEdit.*`, `expAdmin.*`, `projAdmin.*` translation keys to both `en.json` and `zh.json`
- **New Routes**: `/blog/:postId/edit`, `/experience/new`, `/experience/:id/edit`, `/projects/new`, `/projects/:id/edit`

### Changed
- `BlogDetailPage.tsx`: Added Edit button (admin only) next to delete button; content now rendered via ReactMarkdown with GFM support
- `ExperiencePage.tsx`: Added admin CRUD buttons (Add Experience, Edit, Delete per card)
- `ProjectsPage.tsx`: Added admin CRUD buttons (Add Project, Edit, Delete per card)
- `App.tsx`: Added 5 new routes for all create/edit pages

### Dependencies
- Added `react-markdown`, `remark-gfm` to frontend

---

## [1.3.0] - 2026-02-19

### Security
- **JWT storage moved to httpOnly cookie**: Token is no longer in `localStorage` — prevents XSS token theft
- Backend sets `Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax; Path=/` on login/register
- Auth middleware reads JWT from cookie first, falls back to `Authorization: Bearer` header for API tools
- Frontend `api.ts` uses `withCredentials: true` (browser sends cookie automatically)
- Frontend no longer stores or reads JWT in JavaScript — only the `user` object is in `localStorage` for UI

### Added
- **`POST /api/auth/logout`**: New endpoint that clears the httpOnly cookie server-side
- **`CODEBASE_GUIDE.md`**: New documentation with folder-by-folder explanation of backend and frontend structure
- **Cookie settings** in `Settings`: `cookie_name`, `cookie_secure`, `cookie_samesite` (configurable via env vars)

### Changed
- `AuthContext.tsx`: removed `token` from state; `isAuthenticated` is now based on `!!user` instead of `!!token`; `logout()` calls `POST /api/auth/logout` before clearing state
- `api.ts`: removed `Authorization` header interceptor; added `withCredentials: true`; added `logout()` method
- `middleware/auth.py`: rewritten to use `Request` object — reads cookie via `request.cookies`, falls back to header
- `auth_controller.py`: `login()` and `register()` now call `response.set_cookie()`; new `logout()` endpoint
- Updated all documentation (ARCHITECTURE, API_SPEC, DEPLOYMENT) to reflect httpOnly cookie approach

---

## [1.2.0] - 2026-02-19

### Added
- **Blog comments system**: new `Comments` DynamoDB table, `CommentService`, and REST endpoints (`GET`/`POST`/`DELETE` on `/api/blog/{post_id}/comments`)
- **Regular user registration**: anyone can register; role auto-assigned (`admin` for whitelisted emails, `user` for others)
- **`require_auth` middleware**: validates JWT for any logged-in user (not just admin)
- **`isAdmin` flag** in frontend AuthContext for role-based UI rendering
- **Comment UI** on blog detail page: avatar, display name, timestamp, delete button (owner/admin only)
- **Login prompt** for unauthenticated users in comment section ("Log in to leave a comment")

### Changed
- **Navbar button**: "Admin" renamed to "Login"
- **Login page**: title changed from "Admin Portal" to "Welcome", subtitle updated
- **Blog "New Post" button**: now only visible to admin (was visible to all authenticated users)
- **Blog delete button**: now only visible to admin
- **JWT payload**: now includes `display_name` field for use in comments and blog posts
- **Blog `create_post`**: uses `display_name` from JWT instead of email as `author_name`

### Fixed
- **Auth registration**: removed admin-only email whitelist restriction; any email can register

## [1.1.0] - 2026-02-19

### Added
- **Seed admin account**: `zhouzejun1147@gmail.com` / `ZZ` pre-inserted into Users table with bcrypt-hashed password
- **Frontend Dockerfile**: containerized React app for Docker Compose
- **Volume mounts**: `docker-compose.yml` maps source code into containers for hot-reload
- **`WATCHPACK_POLLING`**: enabled for webpack file watching in Docker

### Changed
- **DynamoDB**: switched from `-dbPath` with volume to `-inMemory` mode (fixes SQLite permission error)
- **Backend Dockerfile**: seed script moved from `RUN` (build-time) to `CMD` (runtime) so DynamoDB is available
- **Backend CMD**: added `--reload` flag to uvicorn for hot-reload via volume mount
- **`docker-compose.yml`**: all 3 services start with one command; frontend added as a service
- **`requirements.txt`**: pinned `bcrypt==4.0.1` for passlib compatibility; added `pydantic[email]`

### Fixed
- **DynamoDB healthcheck**: removed `curl`-based healthcheck (not available in DynamoDB Local image); replaced with Python retry loop in seed script
- **Frontend error handling**: added `extractErrorMessage()` utility to safely render FastAPI 422 validation errors (array of objects) instead of crashing React

### Changed (Blog Access)
- **`GET /api/blog`**: changed from admin-only to public (no auth required)
- **`GET /api/blog/{post_id}`**: changed from admin-only to public
- **Blog list page**: removed "Admin Access Required" lock screen; posts visible to everyone
- **Blog detail page**: removed auth gate; anyone can read posts
- **`ADMIN_EMAILS`**: updated default to `zhouzejun1147@gmail.com`
- **Seed blog post**: `author_email` and `author_name` updated to match seed admin

## [1.0.0] - 2026-02-18

### Added

**Backend Service (Python / FastAPI)**
- FastAPI application with auto-generated OpenAPI docs
- OOP service architecture with abstract `BaseService` for DynamoDB CRUD
- `AuthService` with JWT authentication and bcrypt password hashing
- `BlogService` for blog post lifecycle management
- `ExperienceService` for work experience entries
- `ProjectService` for project portfolio entries
- Admin-only middleware with email whitelist registration
- Health check endpoint
- CORS configuration
- DynamoDB seed script with sample data

**Frontend Portal (React / TypeScript)**
- React 18 SPA with TypeScript
- Material UI dark theme with custom palette
- React Router v6 with page-based routing
- Auth context with JWT token management
- Responsive navbar with mobile drawer
- Home page: hero section, skill highlights, tech stack chips
- Experience page: timeline cards with company details and bullet points
- Projects page: project cards with tech stack chips and external links
- Blog section: post listing, creation, and detail view
- Login page: tabbed login/register form
- Footer with Font Awesome social icons
- Axios API client with automatic token injection and 401 handling

**Infrastructure**
- Docker Compose with DynamoDB Local and backend service
- Backend Dockerfile
- Comprehensive documentation (Architecture, API Spec, DB Design, Deployment)

**Database**
- DynamoDB tables: Users, BlogPosts, Experiences, Projects
- Seed data: 3 experiences, 1 project, 1 blog post based on resume content
