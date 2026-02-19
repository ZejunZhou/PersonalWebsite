from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.controllers.auth_controller import router as auth_router
from app.controllers.blog_controller import router as blog_router
from app.controllers.experience_controller import router as experience_router
from app.controllers.project_controller import router as project_router
from app.controllers.comment_controller import router as comment_router
from app.controllers.health_controller import router as health_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend API for personal portfolio & blog website",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(blog_router)
app.include_router(comment_router)
app.include_router(experience_router)
app.include_router(project_router)
