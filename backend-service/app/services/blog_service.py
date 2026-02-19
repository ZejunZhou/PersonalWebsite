import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.services.base_service import BaseService
from app.models.blog import BlogPostCreate, BlogPostUpdate


class BlogService(BaseService):
    """Manages blog post lifecycle — CRUD operations and publishing."""

    @property
    def table_name(self) -> str:
        return "BlogPosts"

    @property
    def key_field(self) -> str:
        return "post_id"

    def create_post(self, data: BlogPostCreate, author_email: str, author_name: str) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat()
        item = {
            "post_id": str(uuid.uuid4()),
            "author_email": author_email,
            "author_name": author_name,
            "is_published": True,
            "created_at": now,
            "updated_at": now,
            **data.model_dump(),
        }
        return self.create(item)

    def update_post(self, post_id: str, data: BlogPostUpdate) -> Optional[Dict[str, Any]]:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        updates["updated_at"] = datetime.utcnow().isoformat()
        return self.update(post_id, updates)

    def get_published_posts(self) -> List[Dict[str, Any]]:
        response = self.table.scan(
            FilterExpression="is_published = :pub",
            ExpressionAttributeValues={":pub": True},
        )
        items = response.get("Items", [])
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    def get_all_posts(self) -> List[Dict[str, Any]]:
        items = self.get_all()
        return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)


blog_service = BlogService()
