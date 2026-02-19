from pydantic import BaseModel, Field
from typing import List, Optional


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    user_email: str
    display_name: str
    content: str
    created_at: str


class CommentListResponse(BaseModel):
    comments: List[CommentResponse]
    count: int
