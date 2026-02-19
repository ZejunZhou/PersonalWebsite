from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from boto3.dynamodb.conditions import Key
from app.config.database import db_client


class BaseService(ABC):
    """
    Abstract base service providing standard CRUD operations on a DynamoDB table.
    Subclasses must define `table_name` and `key_field`.
    """

    @property
    @abstractmethod
    def table_name(self) -> str:
        ...

    @property
    @abstractmethod
    def key_field(self) -> str:
        ...

    @property
    def table(self):
        return db_client.get_table(self.table_name)

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        response = self.table.get_item(Key={self.key_field: item_id})
        return response.get("Item")

    def get_all(self) -> List[Dict[str, Any]]:
        response = self.table.scan()
        return response.get("Items", [])

    def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        self.table.put_item(Item=item)
        return item

    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not updates:
            return self.get_by_id(item_id)

        expr_parts = []
        expr_names = {}
        expr_values = {}

        for i, (key, value) in enumerate(updates.items()):
            placeholder = f"#attr{i}"
            val_placeholder = f":val{i}"
            expr_parts.append(f"{placeholder} = {val_placeholder}")
            expr_names[placeholder] = key
            expr_values[val_placeholder] = value

        response = self.table.update_item(
            Key={self.key_field: item_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return response.get("Attributes")

    def delete(self, item_id: str) -> bool:
        self.table.delete_item(Key={self.key_field: item_id})
        return True
