from pydantic import BaseModel, Field
from typing import Optional, List


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    tech_stack: str = Field(..., max_length=500)
    date_range: str = Field(..., description="e.g. Feb. 2025 – May 2025")
    bullets: List[str] = Field(..., min_length=1)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    order: int = Field(default=0)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    tech_stack: Optional[str] = None
    date_range: Optional[str] = None
    bullets: Optional[List[str]] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    order: Optional[int] = None


class ProjectResponse(ProjectBase):
    project_id: str


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    count: int
