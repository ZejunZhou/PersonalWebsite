import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config.settings import settings
from app.config.database import db_client
from app.models.user import UserCreate, UserInDB, UserResponse, TokenResponse


class AuthService:
    """Handles user registration, authentication, and JWT token management."""

    TABLE_NAME = "Users"

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.table = db_client.get_table(self.TABLE_NAME)

    def _hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def _verify_password(self, plain: str, hashed: str) -> bool:
        return self.pwd_context.verify(plain, hashed)

    def _create_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    def _get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        response = self.table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email},
        )
        items = response.get("Items", [])
        return items[0] if items else None

    def register(self, user_data: UserCreate) -> TokenResponse:
        existing = self._get_user_by_email(user_data.email)
        if existing:
            raise ValueError("User with this email already exists.")

        role = "admin" if user_data.email in settings.admin_email_list else "user"
        user_id = str(uuid.uuid4())
        user_in_db = UserInDB(
            user_id=user_id,
            email=user_data.email,
            display_name=user_data.display_name,
            hashed_password=self._hash_password(user_data.password),
            role=role,
        )
        self.table.put_item(Item=user_in_db.model_dump())

        token = self._create_token({"sub": user_id, "email": user_data.email, "role": role, "display_name": user_data.display_name})
        user_resp = UserResponse(
            user_id=user_id,
            email=user_data.email,
            display_name=user_data.display_name,
            role=role,
            created_at=user_in_db.created_at,
        )
        return TokenResponse(access_token=token, user=user_resp)

    def login(self, email: str, password: str) -> TokenResponse:
        user = self._get_user_by_email(email)
        if not user or not self._verify_password(password, user["hashed_password"]):
            raise ValueError("Invalid email or password.")

        token = self._create_token({"sub": user["user_id"], "email": email, "role": user["role"], "display_name": user["display_name"]})
        user_resp = UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            display_name=user["display_name"],
            role=user["role"],
            created_at=user["created_at"],
        )
        return TokenResponse(access_token=token, user=user_resp)

    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            return payload
        except JWTError:
            raise ValueError("Invalid or expired token.")


auth_service = AuthService()
