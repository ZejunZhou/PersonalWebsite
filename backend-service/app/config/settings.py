from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "PersonalSite API"
    debug: bool = True

    dynamodb_endpoint: str = "http://localhost:8000"
    aws_default_region: str = "us-east-1"
    aws_access_key_id: str = "local"
    aws_secret_access_key: str = "local"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    cookie_name: str = "access_token"
    cookie_secure: bool = False  # True in production (requires HTTPS)
    cookie_samesite: str = "lax"

    admin_emails: str = "admin@example.com"
    cors_origins: str = "http://localhost:3000"

    @property
    def admin_email_list(self) -> List[str]:
        return [e.strip() for e in self.admin_emails.split(",")]

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
