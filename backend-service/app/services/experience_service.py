import uuid
from typing import List, Dict, Any, Optional

from app.services.base_service import BaseService
from app.models.experience import ExperienceCreate, ExperienceUpdate


class ExperienceService(BaseService):

    @property
    def table_name(self) -> str:
        return "Experiences"

    @property
    def key_field(self) -> str:
        return "experience_id"

    def create_experience(self, data: ExperienceCreate) -> Dict[str, Any]:
        item = {"experience_id": str(uuid.uuid4()), **data.model_dump()}
        return self.create(item)

    def update_experience(self, exp_id: str, data: ExperienceUpdate) -> Optional[Dict[str, Any]]:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return self.update(exp_id, updates)

    def get_ordered(self) -> List[Dict[str, Any]]:
        items = self.get_all()
        return sorted(items, key=lambda x: int(x.get("order", 0)))


experience_service = ExperienceService()
