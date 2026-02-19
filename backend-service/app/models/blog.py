from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BlogPostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    summary: str = Field(..., max_length=500)
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    cover_image_url: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    is_published: Optional[bool] = None


class BlogPostResponse(BlogPostBase):
    post_id: str
    author_email: str
    author_name: str
    is_published: bool
    created_at: str
    updated_at: str


class BlogPostListResponse(BaseModel):
    posts: List[BlogPostResponse]
    count: int
