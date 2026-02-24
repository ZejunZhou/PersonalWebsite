from pydantic_settings import BaseSettings
from typing import List, Literal


class Settings(BaseSettings):
    app_name: str = "PersonalSite API"

    # "local" = Docker Compose + local DynamoDB
    # "cloud" = AWS Lambda   + cloud DynamoDB (IAM role credentials)
    deploy_env: Literal["local", "cloud"] = "local"

    # DynamoDB — only used when deploy_env=local
    dynamodb_endpoint: str = "http://localhost:8000"
    aws_default_region: str = "us-east-1"
    aws_access_key_id: str = "local"
    aws_secret_access_key: str = "local"

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Cookie (cloud deploy should set COOKIE_SECURE=true, COOKIE_SAMESITE=none)
    cookie_name: str = "access_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    admin_emails: str = ""
    cors_origins: str = "http://localhost:3000"

    @property
    def is_cloud(self) -> bool:
        return self.deploy_env == "cloud"

    @property
    def admin_email_list(self) -> List[str]:
        return [e.strip() for e in self.admin_emails.split(",") if e.strip()]

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
