import boto3
from app.config.settings import settings


class DynamoDBClient:
    """Singleton DynamoDB client for the application."""

    _instance = None
    _resource = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def resource(self):
        if self._resource is None:
            self._resource = boto3.resource(
                "dynamodb",
                endpoint_url=settings.dynamodb_endpoint,
                region_name=settings.aws_default_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )
        return self._resource

    def get_table(self, table_name: str):
        return self.resource.Table(table_name)


db_client = DynamoDBClient()
