# Personal Website — Portfolio & Blog Platform

> Last updated: 2026-02-19

A full-stack personal website built with a **React** frontend and **Python (FastAPI)** backend, backed by **Amazon DynamoDB**. Features a portfolio showcase, blog with comments, and role-based access control.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Material UI 7, React Router 6 |
| Backend    | Python 3.11+, FastAPI, Pydantic v2      |
| Database   | Amazon DynamoDB (Local via Docker)       |
| Auth       | JWT (HS256, bcrypt, httpOnly cookie)      |
| DevOps     | Docker, Docker Compose (volume mounts)   |
| Icons      | Font Awesome 6, MUI Icons               |

## Project Structure

```
PersonalWebSite/
├── docs/                        # Development documentation
│   ├── ARCHITECTURE.md          # System design, auth flow, permission model
│   ├── API_SPEC.md              # REST API specification (all endpoints)
│   ├── DATABASE_DESIGN.md       # DynamoDB 5-table schema
│   ├── DEPLOYMENT.md            # Docker setup, env vars, seed admin
│   ├── CODEBASE_GUIDE.md        # Folder-by-folder developer orientation
│   └── CHANGELOG.md             # Version history (1.0.0 → 1.3.0)
├── backend-service/             # Python FastAPI backend
│   ├── app/
│   │   ├── config/              # Settings (pydantic-settings), DB client
│   │   ├── models/              # Pydantic models (User, Blog, Comment, etc.)
│   │   ├── services/            # Business logic (OOP, BaseService pattern)
│   │   ├── controllers/         # Route handlers (auth, blog, comments, etc.)
│   │   ├── middleware/          # Auth guards (require_auth, require_admin)
│   │   └── utils/               # Shared utilities
│   ├── scripts/seed_db.py       # Creates tables & seeds data + admin user
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend-portal/             # React SPA frontend
│   ├── src/
│   │   ├── components/layout/   # Navbar, Footer
│   │   ├── pages/               # Home, Experience, Projects, Blog, Login
│   │   ├── services/api.ts      # Axios API client + error utilities
│   │   ├── context/             # AuthContext (user, isAdmin — token in httpOnly cookie)
│   │   └── theme/               # MUI dark theme
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml           # All 3 services + volume mounts
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose

### One Command Launch

```bash
docker compose up --build
```

| Service   | URL                        | Description                          |
|-----------|----------------------------|--------------------------------------|
| Frontend  | `http://localhost:3000`    | React SPA                            |
| Backend   | `http://localhost:8080`    | FastAPI (Swagger at `/docs`)         |
| DynamoDB  | `http://localhost:8000`    | Local DynamoDB (in-memory)           |

The backend auto-creates 5 DynamoDB tables and seeds experience/project/blog data + an admin account on startup.

### Seed Admin Setup

Create a `.env` file in the project root (gitignored):

```bash
SEED_ADMIN_PASSWORD=your-secure-password-here
```

The seed script reads the password from this env var — it is **never hardcoded in source code**. Email and display name default to `zhouzejun1147@gmail.com` / `ZZ` (configurable via `SEED_ADMIN_EMAIL` and `SEED_ADMIN_NAME`).

### Hot-Reload Development

Source code is volume-mapped into Docker containers. Edit files locally and changes appear instantly — no rebuild needed.

## Features

- **Portfolio Showcase**: Experience timeline, project cards, skills overview
- **Blog System**: Public read, admin-only write, markdown content
- **Comment System**: Any logged-in user can comment; owner/admin can delete
- **User Registration**: Open registration, role-based access (admin vs user)
- **JWT Authentication**: bcrypt passwords, HS256 tokens in httpOnly cookies (XSS-safe)
- **Responsive Design**: Mobile-first dark theme with Material UI
- **API Documentation**: Auto-generated Swagger/ReDoc via FastAPI

## Permission Model

| Action                | Anonymous | User | Admin |
|-----------------------|-----------|------|-------|
| View portfolio/blog   | Yes       | Yes  | Yes   |
| Post comments         | No        | Yes  | Yes   |
| Delete own comments   | —         | Yes  | Yes   |
| Manage blog/content   | No        | No   | Yes   |

## Documentation

| Document | What it covers |
|----------|---------------|
| [Architecture](docs/ARCHITECTURE.md) | System diagram, OOP patterns, JWT flow, permission model, cookie auth |
| [API Spec](docs/API_SPEC.md) | All REST endpoints with request/response examples, auth middleware reference |
| [Database Design](docs/DATABASE_DESIGN.md) | 5 DynamoDB tables with schemas, access patterns, seed data |
| [Deployment](docs/DEPLOYMENT.md) | Docker setup, env vars, volume mounts, hot-reload, production checklist |
| [Codebase Guide](docs/CODEBASE_GUIDE.md) | Folder-by-folder explanation of backend & frontend structure |
| [Changelog](docs/CHANGELOG.md) | Version history with all changes (1.0.0 → 1.3.0) |

## License

MIT
