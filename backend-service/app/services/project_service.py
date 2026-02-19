import uuid
from typing import List, Dict, Any, Optional

from app.services.base_service import BaseService
from app.models.project import ProjectCreate, ProjectUpdate


class ProjectService(BaseService):

    @property
    def table_name(self) -> str:
        return "Projects"

    @property
    def key_field(self) -> str:
        return "project_id"

    def create_project(self, data: ProjectCreate) -> Dict[str, Any]:
        item = {"project_id": str(uuid.uuid4()), **data.model_dump()}
        return self.create(item)

    def update_project(self, proj_id: str, data: ProjectUpdate) -> Optional[Dict[str, Any]]:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return self.update(proj_id, updates)

    def get_ordered(self) -> List[Dict[str, Any]]:
        items = self.get_all()
        return sorted(items, key=lambda x: int(x.get("order", 0)))


project_service = ProjectService()
