from fastapi import APIRouter, HTTPException, Depends

from app.models.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse, ExperienceListResponse
from app.services.experience_service import experience_service
from app.middleware.auth import require_admin

router = APIRouter(prefix="/api/experiences", tags=["Experiences"])


@router.get("", response_model=ExperienceListResponse)
async def list_experiences():
    """Public endpoint — returns all experiences ordered."""
    items = experience_service.get_ordered()
    return ExperienceListResponse(experiences=items, count=len(items))


@router.get("/{experience_id}", response_model=ExperienceResponse)
async def get_experience(experience_id: str):
    item = experience_service.get_by_id(experience_id)
    if not item:
        raise HTTPException(status_code=404, detail="Experience not found.")
    return item


@router.post("", response_model=ExperienceResponse, status_code=201)
async def create_experience(data: ExperienceCreate, admin=Depends(require_admin)):
    return experience_service.create_experience(data)


@router.put("/{experience_id}", response_model=ExperienceResponse)
async def update_experience(experience_id: str, data: ExperienceUpdate, admin=Depends(require_admin)):
    existing = experience_service.get_by_id(experience_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Experience not found.")
    return experience_service.update_experience(experience_id, data)


@router.delete("/{experience_id}", status_code=204)
async def delete_experience(experience_id: str, admin=Depends(require_admin)):
    existing = experience_service.get_by_id(experience_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Experience not found.")
    experience_service.delete(experience_id)
