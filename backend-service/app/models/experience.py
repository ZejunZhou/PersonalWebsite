from pydantic import BaseModel, Field
from typing import Optional, List


class ExperienceBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., max_length=200)
    start_date: str = Field(..., description="Format: Mon. YYYY")
    end_date: str = Field(..., description="Format: Mon. YYYY or Present")
    bullets: List[str] = Field(..., min_length=1)
    logo_url: Optional[str] = None
    order: int = Field(default=0, description="Display order, lower = first")


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    bullets: Optional[List[str]] = None
    logo_url: Optional[str] = None
    order: Optional[int] = None


class ExperienceResponse(ExperienceBase):
    experience_id: str


class ExperienceListResponse(BaseModel):
    experiences: List[ExperienceResponse]
    count: int
