import json
import base64
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple

from boto3.dynamodb.conditions import Key
from app.config.database import db_client

DEFAULT_PAGE_SIZE = 25


def encode_cursor(key: Dict[str, Any]) -> str:
    return base64.urlsafe_b64encode(json.dumps(key, default=str).encode()).decode()


def decode_cursor(cursor: str) -> Dict[str, Any]:
    return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())


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

    # ── Point read (always O(1), always preferred) ──────────────
    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        response = self.table.get_item(Key={self.key_field: item_id})
        return response.get("Item")

    # ── Writes ──────────────────────────────────────────────────
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

    # ── Paginated scan ──────────────────────────────────────────
    def scan_page(
        self,
        *,
        limit: int = DEFAULT_PAGE_SIZE,
        cursor: Optional[str] = None,
        **scan_kwargs,
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Single-page scan with Limit + ExclusiveStartKey.
        Extra kwargs (FilterExpression, ExpressionAttributeValues, …) are
        forwarded directly to table.scan().
        Returns (items, next_cursor | None).
        """
        params: Dict[str, Any] = {"Limit": limit, **scan_kwargs}
        if cursor:
            params["ExclusiveStartKey"] = decode_cursor(cursor)

        response = self.table.scan(**params)
        items = response.get("Items", [])
        last_key = response.get("LastEvaluatedKey")
        return items, encode_cursor(last_key) if last_key else None

    def scan_all(
        self, *, page_size: int = DEFAULT_PAGE_SIZE, **scan_kwargs
    ) -> List[Dict[str, Any]]:
        """Drain every page. Use ONLY for bounded small tables
        (experiences, projects — typically < 50 rows)."""
        all_items: List[Dict[str, Any]] = []
        cursor: Optional[str] = None
        while True:
            items, cursor = self.scan_page(
                limit=page_size, cursor=cursor, **scan_kwargs
            )
            all_items.extend(items)
            if cursor is None:
                break
        return all_items

    # ── GSI query ───────────────────────────────────────────────
    def query_index(
        self,
        *,
        index_name: str,
        key_condition,
        limit: int = DEFAULT_PAGE_SIZE,
        cursor: Optional[str] = None,
        scan_forward: bool = True,
        **query_kwargs,
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Query a Global Secondary Index with pagination.
        Returns (items, next_cursor | None).
        """
        params: Dict[str, Any] = {
            "IndexName": index_name,
            "KeyConditionExpression": key_condition,
            "Limit": limit,
            "ScanIndexForward": scan_forward,
            **query_kwargs,
        }
        if cursor:
            params["ExclusiveStartKey"] = decode_cursor(cursor)

        response = self.table.query(**params)
        items = response.get("Items", [])
        last_key = response.get("LastEvaluatedKey")
        return items, encode_cursor(last_key) if last_key else None
