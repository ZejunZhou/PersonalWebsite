# Database Design — DynamoDB

> Last updated: 2026-02-19

## Overview

The application uses Amazon DynamoDB with **5 tables**. All tables use simple primary keys (partition key only) with `PAY_PER_REQUEST` billing. DynamoDB runs locally via Docker in-memory mode (`-inMemory`).

## Tables

### Users

Stores all user accounts (both admin and regular users).

| Attribute        | Type   | Key  | Description                          |
|------------------|--------|------|--------------------------------------|
| `user_id`        | String | PK   | UUID v4                              |
| `email`          | String |      | Unique email address                 |
| `display_name`   | String |      | User's display name                  |
| `hashed_password`| String |      | bcrypt hash (cost factor 12)         |
| `role`           | String |      | `"admin"` or `"user"`                |
| `created_at`     | String |      | ISO 8601 timestamp                   |

**Access Patterns**:
- Get user by ID (direct lookup)
- Find user by email (scan with filter — acceptable for low user count)

**Seed Data**: One admin account is pre-seeded:
- Email: `zhouzejun1147@gmail.com`
- Display Name: `ZZ`
- Role: `admin`
- Password: bcrypt-hashed at seed time

---

### BlogPosts

Stores blog articles with metadata. Publicly readable, admin-only write.

| Attribute        | Type    | Key  | Description                    |
|------------------|---------|------|--------------------------------|
| `post_id`        | String  | PK   | UUID v4                        |
| `title`          | String  |      | Post title (1–200 chars)       |
| `summary`        | String  |      | Short description (max 500)    |
| `content`        | String  |      | Full content (markdown)        |
| `tags`           | List    |      | List of tag strings            |
| `cover_image_url`| String  |      | Optional cover image URL       |
| `author_email`   | String  |      | Author's email                 |
| `author_name`    | String  |      | Author's display name          |
| `is_published`   | Boolean |      | Publishing status              |
| `created_at`     | String  |      | ISO 8601                       |
| `updated_at`     | String  |      | ISO 8601                       |

**Access Patterns**:
- List all published posts (scan with filter `is_published=true`, sorted by `created_at` desc in app)
- List all posts including drafts (scan, admin only)
- Get single post by ID (direct lookup)

---

### Comments

Stores user comments on blog posts. Any authenticated user can create; owner or admin can delete.

| Attribute        | Type   | Key  | Description                    |
|------------------|--------|------|--------------------------------|
| `comment_id`     | String | PK   | UUID v4                        |
| `post_id`        | String |      | Foreign key to BlogPosts       |
| `user_id`        | String |      | Foreign key to Users           |
| `user_email`     | String |      | Commenter's email              |
| `display_name`   | String |      | Commenter's display name       |
| `content`        | String |      | Comment text (1–2000 chars)    |
| `created_at`     | String |      | ISO 8601                       |

**Access Patterns**:
- List comments for a post (scan with filter `post_id=...`, sorted by `created_at` asc in app)
- Get single comment by ID (for deletion authorization check)

---

### Experiences

Stores professional work experience entries. Publicly readable, admin-only write.

| Attribute        | Type   | Key  | Description                    |
|------------------|--------|------|--------------------------------|
| `experience_id`  | String | PK   | UUID v4                        |
| `company`        | String |      | Company name                   |
| `role`           | String |      | Job title                      |
| `location`       | String |      | City, State/Country            |
| `start_date`     | String |      | e.g. `"Jun. 2025"`            |
| `end_date`       | String |      | e.g. `"Aug. 2025"` or `"Present"` |
| `bullets`        | List   |      | List of description strings    |
| `logo_url`       | String |      | Optional company logo URL      |
| `order`          | Number |      | Display order (0 = first)      |

**Access Patterns**:
- List all experiences ordered (scan, sorted by `order` in app)
- Get single experience by ID

**Seed Data**: 3 experiences (AWS, Biren Technology, People & Robots Lab)

---

### Projects

Stores personal/research project entries. Publicly readable, admin-only write.

| Attribute        | Type   | Key  | Description                    |
|------------------|--------|------|--------------------------------|
| `project_id`     | String | PK   | UUID v4                        |
| `title`          | String |      | Project name                   |
| `tech_stack`     | String |      | Comma-separated tech list      |
| `date_range`     | String |      | e.g. `"Feb. 2025 – May 2025"` |
| `bullets`        | List   |      | Description bullet points      |
| `github_url`     | String |      | Optional GitHub link           |
| `live_url`       | String |      | Optional live demo link        |
| `cover_image_url`| String |      | Optional image URL             |
| `order`          | Number |      | Display order (0 = first)      |

**Access Patterns**:
- List all projects ordered (scan, sorted by `order` in app)
- Get single project by ID

**Seed Data**: 1 project (Research Paper Search Engine)

---

## Design Notes

1. **Simple Key Design**: Low data volume personal site — simple partition keys with no GSIs.
2. **Application-Level Sorting**: Sort operations happen in the Python service layer, not via DynamoDB sort keys.
3. **Scan Operations**: Expected <100 items per table, so full scans are acceptable.
4. **PAY_PER_REQUEST**: On-demand billing, ideal for dev and low-traffic sites.
5. **In-Memory Mode**: DynamoDB Local runs with `-inMemory` flag. Data is ephemeral — the seed script recreates tables and data on every container start.
6. **No Foreign Key Enforcement**: DynamoDB has no FK constraints. `Comments.post_id` and `Comments.user_id` are application-level references validated in the service layer.

## Table Creation & Seeding

Tables are created and seeded automatically when the backend container starts:

```bash
# Happens automatically in Docker CMD:
python scripts/seed_db.py && uvicorn main:app ...
```

The seed script:
1. Waits for DynamoDB to be reachable (retry loop, 2s interval, 30 max retries)
2. Creates all 5 tables (skips existing)
3. Inserts seed admin user (bcrypt-hashed password)
4. Inserts 3 experiences, 1 project, 1 blog post
