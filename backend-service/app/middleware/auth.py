from fastapi import Depends, HTTPException, Request, status

from app.config.settings import settings
from app.services.auth_service import auth_service


def _extract_token(request: Request) -> str:
    """Extract JWT from httpOnly cookie, falling back to Authorization header."""
    token = request.cookies.get(settings.cookie_name)
    if token:
        return token

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")


async def require_auth(request: Request):
    """Validates JWT for any logged-in user."""
    token = _extract_token(request)
    try:
        return auth_service.verify_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")


async def require_admin(request: Request):
    """Validates JWT and ensures the user has admin role."""
    token = _extract_token(request)
    try:
        payload = auth_service.verify_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")

    return payload


async def optional_auth(request: Request):
    """Optionally validates JWT — returns payload or None."""
    try:
        token = _extract_token(request)
        return auth_service.verify_token(token)
    except (HTTPException, ValueError):
        return None
