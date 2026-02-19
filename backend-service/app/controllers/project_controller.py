from fastapi import APIRouter, HTTPException, Depends

from app.models.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.services.project_service import project_service
from app.middleware.auth import require_admin

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects():
    """Public endpoint — returns all projects ordered."""
    items = project_service.get_ordered()
    return ProjectListResponse(projects=items, count=len(items))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    item = project_service.get_by_id(project_id)
    if not item:
        raise HTTPException(status_code=404, detail="Project not found.")
    return item


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, admin=Depends(require_admin)):
    return project_service.create_project(data)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, data: ProjectUpdate, admin=Depends(require_admin)):
    existing = project_service.get_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project_service.update_project(project_id, data)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, admin=Depends(require_admin)):
    existing = project_service.get_by_id(project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found.")
    project_service.delete(project_id)
