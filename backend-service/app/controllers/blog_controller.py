from fastapi import APIRouter, HTTPException, Depends

from app.models.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse, BlogPostListResponse
from app.services.blog_service import blog_service
from app.middleware.auth import require_admin

router = APIRouter(prefix="/api/blog", tags=["Blog"])


@router.get("", response_model=BlogPostListResponse)
async def list_posts():
    """Public — list all published blog posts."""
    posts = blog_service.get_published_posts()
    return BlogPostListResponse(posts=posts, count=len(posts))


@router.get("/all", response_model=BlogPostListResponse)
async def list_all_posts(admin=Depends(require_admin)):
    """Admin only — list all posts including drafts."""
    posts = blog_service.get_all_posts()
    return BlogPostListResponse(posts=posts, count=len(posts))


@router.get("/{post_id}", response_model=BlogPostResponse)
async def get_post(post_id: str):
    """Public — get a single published blog post."""
    post = blog_service.get_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found.")
    return post


@router.post("", response_model=BlogPostResponse, status_code=201)
async def create_post(data: BlogPostCreate, admin=Depends(require_admin)):
    post = blog_service.create_post(data, author_email=admin["email"], author_name=admin.get("display_name", admin["email"]))
    return post


@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_post(post_id: str, data: BlogPostUpdate, admin=Depends(require_admin)):
    existing = blog_service.get_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found.")
    updated = blog_service.update_post(post_id, data)
    return updated


@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: str, admin=Depends(require_admin)):
    existing = blog_service.get_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found.")
    blog_service.delete(post_id)
