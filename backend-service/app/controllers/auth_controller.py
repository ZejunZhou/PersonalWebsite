from fastapi import APIRouter, HTTPException, Depends, Response

from app.config.settings import settings
from app.models.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import auth_service
from app.middleware.auth import require_auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _set_token_cookie(response: Response, token: str):
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, response: Response):
    try:
        result = auth_service.register(user_data)
        _set_token_cookie(response, result.access_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    try:
        result = auth_service.login(credentials.email, credentials.password)
        _set_token_cookie(response, result.access_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return {"detail": "Logged out."}


@router.get("/me", response_model=UserResponse)
async def get_current_user(payload=Depends(require_auth)):
    user = auth_service._get_user_by_email(payload["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        created_at=user["created_at"],
    )
