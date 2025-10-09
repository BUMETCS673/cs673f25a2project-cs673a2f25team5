from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.db import db
from app.routes import attendees as route_attendees
from app.routes import db as route_db
from app.routes import events as route_events
from app.routes import users as route_users

instrumentator = Instrumentator()


@asynccontextmanager
async def lifespan(app: FastAPI):
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

# Include routers for different endpoints
event_manager_app.include_router(route_attendees.router)
event_manager_app.include_router(route_events.router)
event_manager_app.include_router(route_users.router)

# Health check endpoint
event_manager_app.include_router(route_db.router)

# Setup Prometheus instrumentation
instrumentator.instrument(event_manager_app).expose(
    event_manager_app, include_in_schema=True, tags=["Monitor"]
)
