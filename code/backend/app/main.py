from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.db import db

# from app.routes import jobs as route_jobs
from app.routes import db as route_db

# Initialize Prometheus
instrumentator = Instrumentator()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database
    await db.init_db()
    yield
    # Shutdown: Clean up resources if needed
    pass


event_manager_app = FastAPI(
    title="Event Manager API",
    description="Track, plan, and manage events",
    version="0.1.0",
    lifespan=lifespan,
)

# Setup Prometheus instrumentation
instrumentator.instrument(event_manager_app).expose(
    event_manager_app, include_in_schema=True, tags=["Monitor"]
)

# event_manager_app.include_router(route_jobs.router)
event_manager_app.include_router(route_db.router)
