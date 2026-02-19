# Deployment Guide

> Last updated: 2026-02-19

## Full Stack Launch (Docker Compose)

### Prerequisites

| Tool            | Version | Purpose                     |
|-----------------|---------|------------------------------|
| Docker          | 24+     | Container runtime            |
| Docker Compose  | 2.0+    | Multi-container orchestration|

### One Command Start

```bash
docker compose up --build
```

This starts all three services:

| Service          | Container Name          | Port    | Description                        |
|------------------|-------------------------|---------|------------------------------------|
| DynamoDB Local   | `personalsite-dynamodb` | `:8000` | In-memory DynamoDB                 |
| Backend          | `personalsite-backend`  | `:8080` | FastAPI + uvicorn (with `--reload`)|
| Frontend         | `personalsite-frontend` | `:3000` | React dev server (webpack HMR)     |

### Service Startup Order

```
dynamodb-local (starts first, in-memory mode)
     │
     ▼  depends_on
  backend (wait_for_dynamodb → seed_db.py → uvicorn --reload)
     │
     ▼  depends_on
  frontend (npm start)
```

The backend's CMD is:
```sh
python scripts/seed_db.py && uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

The seed script retries connecting to DynamoDB (up to 30 attempts, 2s apart) before creating tables and inserting data.

### Hot-Reload (Volume Mounts)

Source code is volume-mapped into containers for live editing without rebuild:

```yaml
backend:
  volumes:
    - ./backend-service:/app        # Entire backend dir → container
  # uvicorn --reload watches for file changes

frontend:
  volumes:
    - ./frontend-portal/src:/app/src       # Source code
    - ./frontend-portal/public:/app/public # Static assets
  environment:
    - WATCHPACK_POLLING=true        # Required for Docker file watching
```

**Effect**: Edit any file locally → changes are instantly reflected in the running containers. No `docker compose build` needed for code changes.

**When you DO need to rebuild**: Only when `requirements.txt` or `package.json` change (new dependencies).

### Stop & Clean

```bash
docker compose down       # stop containers
docker compose down -v    # stop + remove volumes (N/A since in-memory)
```

---

## Environment Variables

### Backend (set in `docker-compose.yml` or `backend-service/.env`)

| Variable              | Default                    | Description                           |
|-----------------------|----------------------------|---------------------------------------|
| `DYNAMODB_ENDPOINT`   | `http://localhost:8000`    | DynamoDB endpoint URL                 |
| `AWS_DEFAULT_REGION`  | `us-east-1`               | AWS region                            |
| `AWS_ACCESS_KEY_ID`   | `local`                   | AWS access key (any value for local)  |
| `AWS_SECRET_ACCESS_KEY`| `local`                   | AWS secret key (any value for local)  |
| `JWT_SECRET_KEY`      | `change-me-in-production` | Secret for signing JWT tokens (HS256) |
| `JWT_ALGORITHM`       | `HS256`                   | JWT signing algorithm                 |
| `JWT_EXPIRE_MINUTES`  | `1440`                    | Token expiration (24h default)        |
| `ADMIN_EMAILS`        | `zhouzejun1147@gmail.com` | Comma-separated admin email whitelist |
| `CORS_ORIGINS`        | `http://localhost:3000`   | Comma-separated allowed CORS origins  |
| `COOKIE_SECURE`       | `false`                   | Set `true` in production (HTTPS only) |
| `COOKIE_SAMESITE`     | `lax`                     | Cookie SameSite attribute             |
| `COOKIE_NAME`         | `access_token`            | Name of the httpOnly JWT cookie       |

### Frontend (set in `docker-compose.yml` or `frontend-portal/.env`)

| Variable              | Default                 | Description                          |
|-----------------------|-------------------------|--------------------------------------|
| `REACT_APP_API_URL`   | `http://localhost:8080` | Backend API base URL                 |
| `WATCHPACK_POLLING`   | `true`                  | Enable file-watch polling in Docker  |

---

## Seed Admin Account

A pre-configured admin account is created by the seed script on every startup:

| Field    | Value                        |
|----------|------------------------------|
| Email    | `zhouzejun1147@gmail.com`    |
| Name     | `ZZ`                         |
| Password | `1234567890!`                |
| Role     | `admin`                      |

Password is bcrypt-hashed before insertion. You can login immediately at `/login` with these credentials.

---

## Registering New Users

**Regular users**: Anyone can register at `/login` → Register tab. They receive `role: "user"` and can view content + post comments.

**Admin users**: Register with an email in the `ADMIN_EMAILS` list to receive `role: "admin"`. Or use the API:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"zhouzejun1147@gmail.com","password":"1234567890!","display_name":"ZZ"}'
```

---

## Local Development (without Docker)

For development without Docker for frontend/backend:

```bash
# Terminal 1 — DynamoDB only
docker compose up -d dynamodb-local

# Terminal 2 — Backend
cd backend-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scripts/seed_db.py
uvicorn main:app --reload --port 8080

# Terminal 3 — Frontend
cd frontend-portal
npm install && npm start
```

---

## Production Considerations

- [ ] Replace `JWT_SECRET_KEY` with a strong random secret (e.g. `openssl rand -hex 32`)
- [ ] Configure `ADMIN_EMAILS` with real admin emails
- [ ] Point `DYNAMODB_ENDPOINT` to AWS DynamoDB (remove `endpoint_url` for production)
- [ ] Remove seed admin password from code, use a secure onboarding flow
- [ ] Set `CORS_ORIGINS` to production frontend URL
- [ ] Set `COOKIE_SECURE=true` so cookie is only sent over HTTPS
- [ ] Consider `COOKIE_SAMESITE=strict` if frontend and API share the same domain
- [ ] Enable HTTPS (TLS termination via ALB or Nginx)
- [ ] Add rate limiting middleware
- [ ] Set up CloudWatch / structured logging
- [ ] Consider GSIs for `Comments.post_id` and `BlogPosts.is_published` if data grows
