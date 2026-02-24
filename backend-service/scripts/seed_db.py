"""
Database seed script — creates DynamoDB tables and inserts initial data.
Fully idempotent: safe to run multiple times without duplicating data.
  - Tables: uses DescribeTable to skip existing tables.
  - Rows:   uses deterministic UUIDs + ConditionExpression to skip existing items.
Run: python scripts/seed_db.py
"""

import sys
import os
import time
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from botocore.exceptions import ClientError


def wait_for_dynamodb(max_retries=30, delay=2):
    """Block until DynamoDB is reachable, retrying with backoff."""
    from app.config.database import db_client
    for attempt in range(1, max_retries + 1):
        try:
            list(db_client.resource.tables.all())
            print(f"  DynamoDB is ready (attempt {attempt})")
            return
        except Exception as e:
            print(f"  Waiting for DynamoDB... attempt {attempt}/{max_retries} ({e})")
            time.sleep(delay)
    raise RuntimeError("DynamoDB did not become available in time.")


wait_for_dynamodb()

from passlib.context import CryptContext
from app.config.database import db_client

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Deterministic UUID namespace for seed data ──────────────────
SEED_NS = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")


def seed_id(name: str) -> str:
    return str(uuid.uuid5(SEED_NS, name))


# ── Table definitions (with GSIs) ───────────────────────────────
TABLE_DEFINITIONS = [
    {
        "TableName": "Users",
        "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "email", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "gsi_email",
                "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "BlogPosts",
        "KeySchema": [{"AttributeName": "post_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "post_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Experiences",
        "KeySchema": [{"AttributeName": "experience_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "experience_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Projects",
        "KeySchema": [{"AttributeName": "project_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "project_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
    {
        "TableName": "Comments",
        "KeySchema": [{"AttributeName": "comment_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "comment_id", "AttributeType": "S"},
            {"AttributeName": "post_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "gsi_post_id",
                "KeySchema": [
                    {"AttributeName": "post_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
]

# ── Seed data (deterministic IDs) ───────────────────────────────
SEED_EXPERIENCES = [
    {
        "experience_id": seed_id("experience:brown-gra"),
        "company": "Brown University",
        "role": "Graduate Research Assistant",
        "location": "Providence, RI",
        "start_date": "Sep. 2025",
        "end_date": "Present",
        "order": 0,
        "bullets": [
            "Engineered a hybrid PHI extraction pipeline for real-world discharge notes, reducing False Negative Rate (FNR) from 36.3% to 7%.",
            "Architected a sentence-level RAG error-correction system with Milvus and regex fallbacks to recover missed entities, reducing first-pass FNR to 15%.",
            "Optimized inference latency by replacing first-pass Llama 3.1 8B with a lightweight RoBERTa NER model, routing only suspicious sentences to LLM validation and reducing per-note latency from 3s to 50ms.",
            "Built a synthetic dataset from redacted MIMIC-IV-2 notes; fine-tuned Llama 3.1 8B with LoRA and improved generation quality via an LLM-as-a-Judge feedback loop.",
        ],
    },
    {
        "experience_id": seed_id("experience:aws-sde-intern"),
        "company": "Amazon Web Services",
        "role": "Software Development Engineer Intern",
        "location": "Seattle, WA",
        "start_date": "Jun. 2025",
        "end_date": "Aug. 2025",
        "order": 1,
        "bullets": [
            "Architected a scalable distributed preprocessing pipeline for Bedrock Knowledge Base on AWS ECS and S3, leveraging batch inference to process 300,000+ documents across 100 AWS accounts while reducing cost for non-latency-sensitive workloads.",
            "Developed LLM-based validation and hierarchical classification during batch inference to filter noisy data and improve downstream RAG retrieval accuracy.",
            "Integrated DynamoDB checkpointing and S3 metadata state tracking to enable fault-tolerant execution and reproducible evaluation across prompt strategies.",
            "Engineered an automated regression evaluation framework, achieving up to 7.7% reduction in extraction inaccuracies and 12% improvement in preferred answers.",
        ],
    },
    {
        "experience_id": seed_id("experience:biren-devops"),
        "company": "Biren Technology",
        "role": "DevOps Engineer Intern",
        "location": "Shanghai, China",
        "start_date": "Jun. 2024",
        "end_date": "Aug. 2024",
        "order": 2,
        "bullets": [
            "Implemented a heartbeat-based GPU health check in Golang on a Kubernetes GPU cluster supporting model training workloads, preventing unhealthy GPU allocation during container scheduling and reducing GPU application failures by nearly 30% in testing.",
            "Developed structured allocation logging and a custom kubectl plugin to retrieve GPU metrics (count, IDs, status), streamlining infrastructure monitoring and reducing manual operations.",
        ],
    },
    {
        "experience_id": seed_id("experience:par-lab"),
        "company": "The People and Robots Laboratory",
        "role": "Full-stack Software Engineer",
        "location": "Madison, WI",
        "start_date": "Sep. 2023",
        "end_date": "May 2024",
        "order": 3,
        "bullets": [
            "Developed a React.js interface with Flask APIs and a Cassandra backend for modeling and simulating Colored Petri Nets in HCI research.",
            'Publication: First author of "Statewise: A Petri Net-Based Visual Editor for Specifying Robotic Systems", accepted at the AAAI Symposium Series (2024).',
        ],
    },
]

SEED_PROJECTS = [
    {
        "project_id": seed_id("project:paper-search-engine"),
        "title": "Research Paper Search Engine",
        "tech_stack": "Python, AWS Bedrock, Milvus, MapReduce",
        "date_range": "Feb. 2025 – May 2025",
        "order": 0,
        "bullets": [
            "Reused a custom MapReduce pipeline to preprocess and segment 5,000+ arXiv papers into paragraphs with metadata (URL, title, preview text), creating a structured index for retrieval",
            "Generated vector embeddings for each paragraph using Bedrock Cohere Embed v3 and stored results in Milvus, enabling semantic similarity search across the collection of research papers",
            "Implemented query processing in Python with cosine similarity ranking and deduplication, returning top-10 results with metadata in a Google-style UI",
        ],
    },
]

SEED_ADMIN_EMAIL = os.environ.get("SEED_ADMIN_EMAIL", "zhouzejun1147@gmail.com")
SEED_ADMIN_NAME = os.environ.get("SEED_ADMIN_NAME", "ZZ")
SEED_ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD")

if not SEED_ADMIN_PASSWORD:
    raise RuntimeError("SEED_ADMIN_PASSWORD env var is required. Set it in docker-compose.yml or .env")

SEED_ADMIN = {
    "user_id": seed_id("admin:zhouzejun"),
    "email": SEED_ADMIN_EMAIL,
    "display_name": SEED_ADMIN_NAME,
    "hashed_password": pwd_context.hash(SEED_ADMIN_PASSWORD),
    "role": "admin",
    "created_at": datetime.utcnow().isoformat(),
}

SEED_BLOG_POSTS = [
    {
        "post_id": seed_id("blog:aws-pipelines"),
        "title": "Building Scalable Data Pipelines on AWS",
        "summary": "Lessons learned from building a distributed preprocessing pipeline at AWS, processing 300K+ documents across 100 accounts.",
        "content": "## Introduction\n\nDuring my internship at Amazon Web Services, I worked on building a scalable distributed preprocessing pipeline for the Bedrock Knowledge Base team...\n\n## Architecture\n\nThe pipeline leveraged AWS ECS for compute orchestration and S3 for data storage. We integrated DynamoDB checkpointing and S3 metadata state tracking to enable fault-tolerant execution and reproducible evaluation across prompt strategies.\n\n## Key Takeaways\n\n1. **Batch inference** is significantly more cost-effective for non-latency-sensitive workloads\n2. **DynamoDB checkpointing** provides excellent fault-tolerance for tracking pipeline state\n3. **Automated regression evaluation** across prompt strategies is essential for measuring RAG quality improvements",
        "tags": ["AWS", "Distributed Systems", "RAG", "LLM"],
        "author_email": "zhouzejun1147@gmail.com",
        "author_name": "ZZ",
        "is_published": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "post_id": seed_id("blog:phi-extraction"),
        "title": "Reducing PHI Extraction Errors with Hybrid NER and RAG",
        "summary": "How we cut the False Negative Rate from 36.3% to 7% by combining RoBERTa NER with a sentence-level RAG error-correction system.",
        "content": "## Introduction\n\nIn clinical NLP, missing Protected Health Information (PHI) during de-identification can have serious privacy implications. During my research at Brown University, I worked on building a hybrid extraction pipeline that dramatically reduced our False Negative Rate.\n\n## The Approach\n\nWe replaced the first-pass Llama 3.1 8B model with a lightweight RoBERTa NER model, routing only suspicious sentences to LLM validation. This reduced per-note latency from 3s to 50ms.\n\n## RAG Error-Correction\n\nWe architected a sentence-level RAG system with Milvus and regex fallbacks to recover missed entities, bringing first-pass FNR down to 15%.\n\n## Data & Fine-Tuning\n\nWe built a synthetic dataset from redacted MIMIC-IV-2 notes and fine-tuned Llama 3.1 8B with LoRA, using an LLM-as-a-Judge feedback loop to improve generation quality.",
        "tags": ["NLP", "RAG", "LLM", "Healthcare AI"],
        "author_email": "zhouzejun1147@gmail.com",
        "author_name": "ZZ",
        "is_published": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
]


# ── Helpers ──────────────────────────────────────────────────────
def _table_exists(table_name: str) -> bool:
    try:
        db_client.resource.Table(table_name).load()
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            return False
        raise


def _put_if_absent(table, item, key_field: str) -> bool:
    """Conditional put — inserts only when the primary key does not exist."""
    try:
        table.put_item(
            Item=item,
            ConditionExpression=f"attribute_not_exists({key_field})",
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def create_tables():
    for table_def in TABLE_DEFINITIONS:
        name = table_def["TableName"]
        if _table_exists(name):
            print(f"  Table '{name}' already exists, skipping.")
            continue
        db_client.resource.create_table(**table_def)
        db_client.resource.Table(name).wait_until_exists()
        print(f"  Created table '{name}'")


def seed_data():
    users_table = db_client.get_table("Users")
    if _put_if_absent(users_table, SEED_ADMIN, "user_id"):
        print(f"  Seeded admin user: {SEED_ADMIN['email']}")
    else:
        print("  Admin user already exists, skipping.")

    exp_table = db_client.get_table("Experiences")
    n = sum(1 for exp in SEED_EXPERIENCES if _put_if_absent(exp_table, exp, "experience_id"))
    print(f"  Experiences: {n} new, {len(SEED_EXPERIENCES) - n} existing")

    proj_table = db_client.get_table("Projects")
    n = sum(1 for proj in SEED_PROJECTS if _put_if_absent(proj_table, proj, "project_id"))
    print(f"  Projects: {n} new, {len(SEED_PROJECTS) - n} existing")

    blog_table = db_client.get_table("BlogPosts")
    n = sum(1 for post in SEED_BLOG_POSTS if _put_if_absent(blog_table, post, "post_id"))
    print(f"  Blog posts: {n} new, {len(SEED_BLOG_POSTS) - n} existing")


if __name__ == "__main__":
    print("Creating DynamoDB tables...")
    create_tables()
    print("Seeding initial data...")
    seed_data()
    print("Done!")
