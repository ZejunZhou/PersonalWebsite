"""
Database seed script — creates DynamoDB tables and inserts initial data.
Run: python scripts/seed_db.py
"""

import sys
import os
import time
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


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

TABLE_DEFINITIONS = [
    {
        "TableName": "Users",
        "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
        "AttributeDefinitions": [{"AttributeName": "user_id", "AttributeType": "S"}],
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
        "AttributeDefinitions": [{"AttributeName": "comment_id", "AttributeType": "S"}],
        "BillingMode": "PAY_PER_REQUEST",
    },
]

SEED_EXPERIENCES = [
    {
        "experience_id": str(uuid.uuid4()),
        "company": "Amazon Web Services",
        "role": "Software Development Engineer Intern",
        "location": "Seattle, WA",
        "start_date": "Jun. 2025",
        "end_date": "Aug. 2025",
        "order": 0,
        "bullets": [
            "Built a scalable distributed preprocessing pipeline for Bedrock Knowledge Base on AWS ECS and S3, leveraging Batch Inference to process 300,000+ documents across 100 AWS accounts and cut costs for non-latency-sensitive workloads",
            "Developed custom LLM-based prompts to validate and hierarchically classify documents during batch inference, filtering out noisy files and organizing data to improve downstream RAG retrieval accuracy",
            "Integrated DynamoDB and updated S3 metadata to persist validation and classification results, enabling RAG retrieval filtering and fault-tolerant, reproducible evaluation across prompt strategies",
            "Conducted regression testing with multiple prompt strategies, demonstrating up to 7.7% reduction in inaccuracies and up to 12% improvement in preferred answers within the agent evaluation workflow",
        ],
    },
    {
        "experience_id": str(uuid.uuid4()),
        "company": "Biren Technology",
        "role": "DevOps Engineer Intern",
        "location": "Shanghai, China",
        "start_date": "Jun. 2024",
        "end_date": "Aug. 2024",
        "order": 1,
        "bullets": [
            "Implemented a heartbeat-based GPU health check in Golang on Kubernetes GPU cluster supporting model training workloads, preventing assignment of unhealthy GPUs during container allocation and reducing GPU application failures by nearly 30% in testing",
            "Developed structured logging around allocation and developed a custom kubectl plugin to retrieve GPU metrics (count, IDs, status), streamlining infrastructure monitoring and reducing manual operations",
        ],
    },
    {
        "experience_id": str(uuid.uuid4()),
        "company": "The People and Robots Laboratory",
        "role": "Full-stack Software Engineer",
        "location": "Madison, WI",
        "start_date": "Sep. 2023",
        "end_date": "May 2024",
        "order": 2,
        "bullets": [
            "Developed a React.js interface for modeling Colored Petri Nets with Flask APIs and a Cassandra backend, enabling creation, simulation, and analysis of complex Human-Computer Interaction",
            "Containerized the application with Docker, ensuring reproducible deployment across research environments and reducing setup overhead for researchers",
            'Publication: First author of "Statewise: A Petri Net-Based Visual Editor for Specifying Robotic Systems", accepted at the AAAI Symposium Series (2024)',
        ],
    },
]

SEED_PROJECTS = [
    {
        "project_id": str(uuid.uuid4()),
        "title": "Research Paper Search Engine",
        "tech_stack": "Python, AWS Bedrock, Milvus, MapReduce",
        "date_range": "Feb. 2025 \u2013 May 2025",
        "order": 0,
        "bullets": [
            "Reused a custom MapReduce pipeline to preprocess and segment 5,000+ arXiv papers into paragraphs with metadata (URL, title, preview text), creating a structured index for retrieval",
            "Generated vector embeddings for each paragraph using Bedrock Cohere Embed v3 and stored results in Milvus, enabling semantic similarity search across the collection of research papers",
            "Implemented query processing in Python with cosine similarity ranking and deduplication, returning top-10 results with metadata in a Google-style UI",
        ],
    },
]

SEED_ADMIN = {
    "user_id": str(uuid.uuid4()),
    "email": "zhouzejun1147@gmail.com",
    "display_name": "ZZ",
    "hashed_password": pwd_context.hash("1234567890!"),
    "role": "admin",
    "created_at": datetime.utcnow().isoformat(),
}

SEED_BLOG_POSTS = [
    {
        "post_id": str(uuid.uuid4()),
        "title": "Building Scalable Data Pipelines on AWS",
        "summary": "Lessons learned from building a distributed preprocessing pipeline at AWS, processing 300K+ documents across 100 accounts.",
        "content": "## Introduction\n\nDuring my internship at Amazon Web Services, I worked on building a scalable distributed preprocessing pipeline for the Bedrock Knowledge Base team...\n\n## Architecture\n\nThe pipeline leveraged AWS ECS for compute orchestration and S3 for data storage...\n\n## Key Takeaways\n\n1. **Batch inference** is significantly more cost-effective for non-latency-sensitive workloads\n2. **DynamoDB** provides excellent fault-tolerance for tracking pipeline state\n3. **Regression testing** across prompt strategies is essential for measuring RAG quality improvements",
        "tags": ["AWS", "Distributed Systems", "RAG", "LLM"],
        "author_email": "zhouzejun1147@gmail.com",
        "author_name": "ZZ",
        "is_published": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
]


def create_tables():
    existing = [t.name for t in db_client.resource.tables.all()]
    for table_def in TABLE_DEFINITIONS:
        if table_def["TableName"] in existing:
            print(f"  Table '{table_def['TableName']}' already exists, skipping.")
            continue
        db_client.resource.create_table(**table_def)
        print(f"  Created table '{table_def['TableName']}'")


def seed_data():
    users_table = db_client.get_table("Users")
    users_table.put_item(Item=SEED_ADMIN)
    print(f"  Seeded admin user: {SEED_ADMIN['email']}")

    exp_table = db_client.get_table("Experiences")
    for exp in SEED_EXPERIENCES:
        exp_table.put_item(Item=exp)
    print(f"  Seeded {len(SEED_EXPERIENCES)} experiences")

    proj_table = db_client.get_table("Projects")
    for proj in SEED_PROJECTS:
        proj_table.put_item(Item=proj)
    print(f"  Seeded {len(SEED_PROJECTS)} projects")

    blog_table = db_client.get_table("BlogPosts")
    for post in SEED_BLOG_POSTS:
        blog_table.put_item(Item=post)
    print(f"  Seeded {len(SEED_BLOG_POSTS)} blog posts")


if __name__ == "__main__":
    print("Creating DynamoDB tables...")
    create_tables()
    print("Seeding initial data...")
    seed_data()
    print("Done!")
