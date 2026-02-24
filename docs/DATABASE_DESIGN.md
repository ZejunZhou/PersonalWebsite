# Database Design — DynamoDB

> Last updated: 2026-02-23

## Overview

The application uses Amazon DynamoDB with **5 tables**. All tables use simple primary keys (partition key only) with `PAY_PER_REQUEST` billing. Two tables have Global Secondary Indexes (GSIs) for efficient query access patterns. DynamoDB runs locally via Docker in-memory mode (`-inMemory`).

## Tables

### Users

Stores all user accounts (both admin and regular users).

| Attribute        | Type   | Key  | Description                          |
|------------------|--------|------|--------------------------------------|
| `user_id`        | String | PK   | UUID v5 (seed) / v4 (runtime)       |
| `email`          | String |      | Unique email address                 |
| `display_name`   | String |      | User's display name                  |
| `hashed_password`| String |      | bcrypt hash (cost factor 12)         |
| `role`           | String |      | `"admin"` or `"user"`                |
| `created_at`     | String |      | ISO 8601 timestamp                   |

**GSI `gsi_email`**:

| Attribute | Key Type  | Purpose                          |
|-----------|-----------|----------------------------------|
| `email`   | HASH (PK) | O(1) user lookup by email        |

Projection: `ALL`

**Access Patterns**:
- Get user by ID → `get_item(user_id)` (point read)
- Find user by email → `query(gsi_email, email=...)` (GSI query, replaces full-table scan)

**Seed Data**: One admin account is pre-seeded with a deterministic UUID.

---

### BlogPosts

Stores blog articles with metadata. Publicly readable, admin-only write.

| Attribute        | Type    | Key  | Description                    |
|------------------|---------|------|--------------------------------|
| `post_id`        | String  | PK   | UUID v5 (seed) / v4 (runtime) |
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
- List published posts → paginated `scan_page(Limit, ExclusiveStartKey)` with `FilterExpression(is_published=true)`, sorted by `created_at` desc in-app
- List all posts including drafts → paginated `scan_page(Limit, ExclusiveStartKey)` (admin only)
- Get single post by ID → `get_item(post_id)` (point read)

**Seed Data**: 2 blog posts (AWS pipelines, PHI extraction research)

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

**GSI `gsi_post_id`**:

| Attribute    | Key Type    | Purpose                                  |
|--------------|-------------|------------------------------------------|
| `post_id`    | HASH (PK)   | Partition comments by blog post          |
| `created_at` | RANGE (SK)  | Sort comments chronologically            |

Projection: `ALL`

**Access Patterns**:
- List comments for a post → `query(gsi_post_id, post_id=..., ScanIndexForward=True)` (GSI query, O(comments-per-post) not O(all-comments))
- Get single comment by ID → `get_item(comment_id)` (for deletion authorization check)

---

### Experiences

Stores professional work experience entries. Publicly readable, admin-only write.

| Attribute        | Type   | Key  | Description                    |
|------------------|--------|------|--------------------------------|
| `experience_id`  | String | PK   | UUID v5 (seed) / v4 (runtime) |
| `company`        | String |      | Company name                   |
| `role`           | String |      | Job title                      |
| `location`       | String |      | City, State/Country            |
| `start_date`     | String |      | e.g. `"Jun. 2025"`            |
| `end_date`       | String |      | e.g. `"Aug. 2025"` or `"Present"` |
| `bullets`        | List   |      | List of description strings    |
| `logo_url`       | String |      | Optional company logo URL      |
| `order`          | Number |      | Display order (0 = first)      |

**Access Patterns**:
- List all experiences ordered → `scan_all()` (drains all pages internally), sorted by `order` in-app. Small-table pattern (bounded < 50 rows).
- Get single experience by ID → `get_item(experience_id)` (point read)

**Seed Data**: 4 experiences (Brown University GRA, AWS, Biren Technology, People & Robots Lab)

---

### Projects

Stores personal/research project entries. Publicly readable, admin-only write.

| Attribute        | Type   | Key  | Description                    |
|------------------|--------|------|--------------------------------|
| `project_id`     | String | PK   | UUID v5 (seed) / v4 (runtime) |
| `title`          | String |      | Project name                   |
| `tech_stack`     | String |      | Comma-separated tech list      |
| `date_range`     | String |      | e.g. `"Feb. 2025 – May 2025"` |
| `bullets`        | List   |      | Description bullet points      |
| `github_url`     | String |      | Optional GitHub link           |
| `live_url`       | String |      | Optional live demo link        |
| `cover_image_url`| String |      | Optional image URL             |
| `order`          | Number |      | Display order (0 = first)      |

**Access Patterns**:
- List all projects ordered → `scan_all()` (drains all pages internally), sorted by `order` in-app. Small-table pattern (bounded < 50 rows).
- Get single project by ID → `get_item(project_id)` (point read)

**Seed Data**: 1 project (Research Paper Search Engine)

---

## GSI Summary

| Table    | GSI Name       | PK          | SK           | Replaces                        |
|----------|----------------|-------------|--------------|----------------------------------|
| Users    | `gsi_email`    | `email`     | —            | Full-table scan on login/register |
| Comments | `gsi_post_id`  | `post_id`   | `created_at` | Full-table scan + filter per post |

Experiences, Projects, and BlogPosts do not have GSIs — they are small bounded tables where a paginated scan is the correct trade-off.

---

## DynamoDB Operation Patterns

The service layer enforces three distinct operation types:

| Method            | When to use                                     | Cost model          |
|-------------------|-------------------------------------------------|---------------------|
| `get_by_id()`     | Always — point reads are O(1) and optimal       | 0.5 RCU per 4KB     |
| `query_index()`   | When a GSI exists for the access pattern        | O(matched items)    |
| `scan_page()`     | Blog/comment listing with pagination            | O(items evaluated)  |
| `scan_all()`      | Only for bounded small tables (exp, projects)   | O(all items)        |

All scan operations use `Limit` + `ExclusiveStartKey` pagination internally. There are **no unbounded full-table scans** in the codebase.

---

## Design Notes

1. **GSIs for hot access patterns**: `gsi_email` eliminates the full-table scan on every login. `gsi_post_id` scopes comment queries to a single post.
2. **Paginated scans everywhere**: Even `scan_all()` (for tiny tables) internally pages through with `Limit` to handle the 1MB DynamoDB response cap.
3. **Cursor-based pagination**: API endpoints return an opaque `next_cursor` (base64-encoded `LastEvaluatedKey`) for stateless pagination.
4. **No unbounded scans**: Blog and comment list endpoints enforce `Limit` (max 100 / 200 respectively) via FastAPI `Query()` validation.
5. **PAY_PER_REQUEST**: On-demand billing, ideal for dev and low-traffic sites.
6. **In-Memory Mode**: DynamoDB Local runs with `-inMemory` flag. Data is ephemeral — the seed script recreates tables and data on every container start.
7. **No Foreign Key Enforcement**: DynamoDB has no FK constraints. `Comments.post_id` and `Comments.user_id` are application-level references validated in the service layer.

## Table Creation & Seeding

Tables are created and seeded automatically when the backend container starts:

```bash
# Happens automatically in Docker CMD:
python scripts/seed_db.py && uvicorn main:app ...
```

The seed script is **fully idempotent** (safe to run multiple times):
1. Waits for DynamoDB to be reachable (retry loop, 2s interval, 30 max retries)
2. Creates tables using `DescribeTable` to detect existing tables (skips if already present)
3. Inserts seed data using `ConditionExpression="attribute_not_exists(pk)"` to skip existing rows
4. Uses deterministic UUIDs (`uuid5` with a fixed namespace) so the same seed data always maps to the same primary key

Seed data: 1 admin user, 4 experiences, 1 project, 2 blog posts.
