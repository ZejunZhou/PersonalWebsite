import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from boto3.dynamodb.conditions import Key

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

    def get_by_post(
        self, post_id: str, *, limit: int = 50, cursor: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Query GSI gsi_post_id — O(comments-for-post), not O(all-comments)."""
        return self.query_index(
            index_name="gsi_post_id",
            key_condition=Key("post_id").eq(post_id),
            limit=limit,
            cursor=cursor,
            scan_forward=True,
        )

    def delete_comment(self, comment_id: str, user_id: str, is_admin: bool) -> bool:
        comment = self.get_by_id(comment_id)
        if not comment:
            return False
        if not is_admin and comment["user_id"] != user_id:
            raise PermissionError("You can only delete your own comments.")
        self.delete(comment_id)
        return True


comment_service = CommentService()
