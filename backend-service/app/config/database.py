import boto3
from app.config.settings import settings


class DynamoDBClient:
    """Singleton DynamoDB client.

    local  -> explicit endpoint_url + dummy credentials (Docker local DynamoDB)
    cloud  -> default boto3 credential chain (Lambda IAM role / AWS CLI profile)
    """

    _instance = None
    _resource = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def resource(self):
        if self._resource is None:
            if settings.is_cloud:
                self._resource = boto3.resource(
                    "dynamodb",
                    region_name=settings.aws_default_region,
                )
            else:
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
