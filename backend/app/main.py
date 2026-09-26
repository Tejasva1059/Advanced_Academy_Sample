import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.seed_service import seed_database

# Import routers
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.classes import router as classes_router
from app.api.endpoints.students import router as students_router
from app.api.endpoints.subjects import router as subjects_router
from app.api.endpoints.teachers import router as teachers_router
from app.api.endpoints.examinations import router as exams_router
from app.api.endpoints.marks import router as marks_router
from app.api.endpoints.results import router as results_router
from app.api.endpoints.report_cards import router as report_cards_router
from app.api.endpoints.school_settings import router as settings_router
from app.api.endpoints.academic_sessions import router as sessions_router
from app.api.endpoints.audit_logs import router as audit_router
from app.api.endpoints.import_export import router as import_router
from app.api.endpoints.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Automatically seed initial 120 dummy students & config if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Dynamic, Production-Ready School Result Management System with RBAC, Independent Examinations, and A4 Report Cards.",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API endpoints under /api/v1
prefix = settings.API_V1_PREFIX
app.include_router(auth_router, prefix=prefix)
app.include_router(classes_router, prefix=prefix)
app.include_router(students_router, prefix=prefix)
app.include_router(subjects_router, prefix=prefix)
app.include_router(teachers_router, prefix=prefix)
app.include_router(exams_router, prefix=prefix)
app.include_router(marks_router, prefix=prefix)
app.include_router(results_router, prefix=prefix)
app.include_router(report_cards_router, prefix=prefix)
app.include_router(settings_router, prefix=prefix)
app.include_router(sessions_router, prefix=prefix)
app.include_router(audit_router, prefix=prefix)
app.include_router(import_router, prefix=prefix)
app.include_router(users_router, prefix=prefix)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Mount static backend directory for assets/logos
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount static production frontend if built
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {
            "app": settings.APP_NAME,
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
        }
else:
    @app.get("/")
    def root():
        return {
            "app": settings.APP_NAME,
            "version": "1.0.0",
            "status": "online",
            "mode": "offline-capable local/cloud server",
            "docs": "/docs",
        }
