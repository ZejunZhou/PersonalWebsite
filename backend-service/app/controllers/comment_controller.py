from fastapi import APIRouter, HTTPException, Depends

from app.models.comment import CommentCreate, CommentResponse, CommentListResponse
from app.services.comment_service import comment_service
from app.services.blog_service import blog_service
from app.middleware.auth import require_auth

router = APIRouter(prefix="/api/blog/{post_id}/comments", tags=["Comments"])


@router.get("", response_model=CommentListResponse)
async def list_comments(post_id: str):
    """Public — list all comments for a blog post."""
    comments = comment_service.get_by_post(post_id)
    return CommentListResponse(comments=comments, count=len(comments))


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(post_id: str, data: CommentCreate, user=Depends(require_auth)):
    """Requires login — any authenticated user can comment."""
    post = blog_service.get_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found.")
    comment = comment_service.create_comment(
        post_id=post_id,
        data=data,
        user_id=user["sub"],
        user_email=user["email"],
        display_name=user.get("display_name", user["email"]),
    )
    return comment


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(post_id: str, comment_id: str, user=Depends(require_auth)):
    """Delete a comment — owner or admin only."""
    try:
        deleted = comment_service.delete_comment(
            comment_id=comment_id,
            user_id=user["sub"],
            is_admin=user.get("role") == "admin",
        )
        if not deleted:
            raise HTTPException(status_code=404, detail="Comment not found.")
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
