# Deployment Guide

> Last updated: 2026-02-24

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

The seed script is **fully idempotent** — it retries connecting to DynamoDB (up to 30 attempts, 2s apart), uses `DescribeTable` to skip existing tables, and conditional `put_item` with deterministic UUIDs to skip existing rows. Safe to run multiple times.

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

### Backend

| Variable              | Local Default              | Cloud (Lambda)               | Description                           |
|-----------------------|----------------------------|------------------------------|---------------------------------------|
| `DEPLOY_ENV`          | `local`                    | `cloud`                      | Controls DynamoDB client mode         |
| `DYNAMODB_ENDPOINT`   | `http://localhost:8000`    | *(not set — uses IAM role)*  | Local DynamoDB endpoint               |
| `AWS_DEFAULT_REGION`  | `us-east-1`               | `us-east-1`                  | AWS region                            |
| `AWS_ACCESS_KEY_ID`   | `local`                    | *(not set — uses IAM role)*  | Only for local DynamoDB               |
| `AWS_SECRET_ACCESS_KEY`| `local`                   | *(not set — uses IAM role)*  | Only for local DynamoDB               |
| `JWT_SECRET_KEY`      | `change-me-in-production`  | **REQUIRED** (env var)       | JWT signing secret (HS256)            |
| `JWT_ALGORITHM`       | `HS256`                    | `HS256`                      | JWT signing algorithm                 |
| `JWT_EXPIRE_MINUTES`  | `1440`                     | `1440`                       | Token expiration (24h default)        |
| `ADMIN_EMAILS`        | *(empty)*                  | **REQUIRED** (env var)       | Comma-separated admin email whitelist |
| `CORS_ORIGINS`        | `http://localhost:3000`    | **REQUIRED** (frontend URL)  | Comma-separated allowed origins       |
| `COOKIE_SECURE`       | `false`                    | `true`                       | `true` in production (HTTPS only)     |
| `COOKIE_SAMESITE`     | `lax`                      | `none`                       | `none` for cross-origin Lambda URL    |
| `COOKIE_NAME`         | `access_token`             | `access_token`               | Name of the httpOnly JWT cookie       |

### Frontend (set in `docker-compose.yml` or `frontend-portal/.env`)

| Variable              | Default                 | Description                          |
|-----------------------|-------------------------|--------------------------------------|
| `REACT_APP_API_URL`   | `http://localhost:8080` | Backend API base URL                 |
| `WATCHPACK_POLLING`   | `true`                  | Enable file-watch polling in Docker  |

---

## Seed Admin Account

A pre-configured admin account is created by the seed script on every startup. The password is **never hardcoded in source** — it is read from the `SEED_ADMIN_PASSWORD` environment variable.

| Field    | Source                                  |
|----------|-----------------------------------------|
| Email    | `SEED_ADMIN_EMAIL` env (default: `zhouzejun1147@gmail.com`) |
| Name     | `SEED_ADMIN_NAME` env (default: `ZZ`)  |
| Password | `SEED_ADMIN_PASSWORD` env (**required**, set in `.env`) |
| Role     | `admin`                                 |

### Setup

1. Create a `.env` file in the project root (already in `.gitignore`):
   ```bash
   SEED_ADMIN_PASSWORD=your-secure-password-here
   ```
2. `docker compose up --build` reads `.env` automatically and passes it to the backend container.
3. Password is bcrypt-hashed before insertion into DynamoDB.

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

## Cloud Deployment (AWS Lambda + DynamoDB)

### Architecture

```
Browser → Lambda Function URL (HTTPS) → Mangum → FastAPI → Cloud DynamoDB
```

### Free Tier (Always Free — perpetual, not 12-month)

| Service   | Free Allowance                                    |
|-----------|---------------------------------------------------|
| Lambda    | 1M requests/month + 400K GB-seconds compute       |
| DynamoDB  | 25 GB storage + 25 RCU / 25 WCU (provisioned)     |
| Function URL | Free (no API Gateway charges)                  |

A personal portfolio site will cost effectively **$0.00/month**.

### Prerequisites

- AWS CLI configured (`aws configure`)
- Python 3.11+ with pip
- `zip` utility

### Interactive Deploy

The deploy script prompts for all required values — no need to pre-export env vars. No AWS account info or secrets are ever hardcoded in source code.

```bash
cd backend-service
bash scripts/deploy-lambda.sh
```

```
=== PersonalSite Lambda Deployment ===

Configure (press Enter to accept defaults):

  AWS Region [us-east-1]:
  Admin emails (comma-sep): you@example.com
  Allowed origins (comma-sep) [http://localhost:3000]: https://your-frontend.com
  Lambda function name [personalsite-api]:
  ...
  Generated JWT_SECRET_KEY (save this — you need it for redeployments):
  a1b2c3d4...

  Seed admin password: ********
```

Already-set env vars are used as defaults (skips the prompt). The script automatically:
1. Creates IAM role with DynamoDB + CloudWatch policies (idempotent)
2. Packages the Lambda zip (~50MB)
3. Creates or updates the Lambda function with env vars
4. Creates a Function URL (free HTTPS endpoint)
5. Runs seed script against cloud DynamoDB (idempotent)

### Updating Code

Re-run the script — it detects the existing function and updates in-place. Pass `SKIP_SEED=true` to skip the DB seed step. Pre-set env vars to skip prompts:

```bash
JWT_SECRET_KEY=<your-key> ADMIN_EMAILS=you@example.com CORS_ORIGINS=https://your-frontend.com \
  SKIP_SEED=true bash scripts/deploy-lambda.sh
```

### How DEPLOY_ENV Works

| `DEPLOY_ENV` | DynamoDB Client                           | Credentials                    |
|--------------|-------------------------------------------|--------------------------------|
| `local`      | `endpoint_url=http://...` + explicit keys | Dummy keys for local DDB       |
| `cloud`      | Default boto3 (no endpoint_url)           | Lambda IAM role / AWS CLI      |

---

## Frontend Deployment (GitHub Pages)

### Architecture

```
Browser → GitHub Pages (static) → React SPA
   │
   └─ API calls → Lambda Function URL (HTTPS) → FastAPI → Cloud DynamoDB
```

The frontend is a static React build deployed to GitHub Pages via GitHub Actions. The backend API URL is injected at build time via the `REACT_APP_API_URL` environment variable.

### How It Works

- **`homepage`** in `package.json` is set to `https://ZejunZhou.github.io/PersonalWebsite`, which tells CRA to generate asset paths relative to that subpath.
- **`BrowserRouter`** uses `basename={process.env.PUBLIC_URL}` so all routes work under `/PersonalWebsite/`.
- **`404.html`** is a copy of `index.html`, generated during `npm run build`. When GitHub Pages encounters an unknown path (e.g. `/PersonalWebsite/blog/123`), it serves `404.html`, which boots React Router and renders the correct route.

### GitHub Actions Workflow

File: `.github/workflows/deploy-frontend.yml`

**Triggers:**
- Push to `main` when any file in `frontend-portal/` changes
- Manual trigger via `workflow_dispatch`

**Required setup in GitHub repo settings:**

1. Go to **Settings → Pages → Source** → select **GitHub Actions**
2. Go to **Settings → Variables and secrets → Actions → Variables** → add:

| Variable | Value | Example |
|----------|-------|---------|
| `REACT_APP_API_URL` | Your Lambda Function URL | `https://abc123.lambda-url.us-east-1.on.aws` |

### Manual Deploy (without GitHub Actions)

```bash
cd frontend-portal
REACT_APP_API_URL=https://your-lambda-url.on.aws npm run build
npx gh-pages -d build
```

This builds the app and pushes the `build/` folder to the `gh-pages` branch.

### Connecting Frontend to Backend

After deploying the backend to Lambda (see above), update two things:

1. **`REACT_APP_API_URL`**: Set to your Lambda Function URL in GitHub repo variables
2. **`CORS_ORIGINS`**: In your Lambda environment, set to `https://ZejunZhou.github.io` (the GitHub Pages origin)

---

## Production Checklist

- [x] ~~GSIs for `Comments.post_id` and `Users.email`~~ — implemented in v1.5.0
- [x] ~~Migrate from scan to GSI query for auth~~ — implemented in v1.5.0
- [x] ~~Paginated scans with Limit + cursor~~ — implemented in v1.5.0
- [x] ~~Idempotent seed script~~ — implemented in v1.5.0
- [x] ~~Lambda deployment support~~ — implemented in v1.6.0
- [x] ~~Deploy frontend to GitHub Pages~~ — implemented in v1.7.0
- [ ] Set `JWT_SECRET_KEY` to a strong random secret (`openssl rand -hex 32`)
- [ ] Set `CORS_ORIGINS` to production frontend URL (`https://ZejunZhou.github.io`)
- [ ] Add rate limiting middleware
- [ ] Set up CloudWatch alarms / structured logging
- [ ] Consider custom domain with Route 53 + ACM certificate
