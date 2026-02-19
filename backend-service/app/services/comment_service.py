import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.services.base_service import BaseService
from app.models.comment import CommentCreate


class CommentService(BaseService):

    @property
    def table_name(self) -> str:
        return "Comments"

    @property
    def key_field(self) -> str:
        return "comment_id"

    def create_comment(
        self, post_id: str, data: CommentCreate, user_id: str, user_email: str, display_name: str
    ) -> Dict[str, Any]:
        item = {
            "comment_id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": user_id,
            "user_email": user_email,
            "display_name": display_name,
            "content": data.content,
            "created_at": datetime.utcnow().isoformat(),
        }
        return self.create(item)

    def get_by_post(self, post_id: str) -> List[Dict[str, Any]]:
        response = self.table.scan(
            FilterExpression="post_id = :pid",
            ExpressionAttributeValues={":pid": post_id},
        )
        items = response.get("Items", [])
        return sorted(items, key=lambda x: x.get("created_at", ""))

    def delete_comment(self, comment_id: str, user_id: str, is_admin: bool) -> bool:
        comment = self.get_by_id(comment_id)
        if not comment:
            return False
        if not is_admin and comment["user_id"] != user_id:
            raise PermissionError("You can only delete your own comments.")
        self.delete(comment_id)
        return True


comment_service = CommentService()
