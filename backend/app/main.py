from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine


def create_app(*, init_db: bool = True) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if init_db:
            Base.metadata.create_all(bind=engine)
        yield

    application = FastAPI(
        title=settings.app_name,
        description="Inventory & Order Management System API for Ethara AI Assessment",
        version="1.0.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix="/api/v1")

    @application.get("/health")
    def health_check():
        return {"status": "healthy", "service": settings.app_name}

    return application


app = create_app()
