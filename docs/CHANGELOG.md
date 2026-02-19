# Changelog

> All notable changes to this project are documented here.

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
