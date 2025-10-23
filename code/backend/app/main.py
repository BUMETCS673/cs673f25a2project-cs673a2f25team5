"""
AI-generated code: 10%

Human code: 90%

Framework-generated code: 0%
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.auth import get_current_user
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
    # Apply authentication globally to all routes
    # This ensures every endpoint requires a valid Google OAuth token
    dependencies=[Depends(get_current_user)],
)

event_manager_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers for different endpoints
event_manager_app.include_router(route_attendees.router)
event_manager_app.include_router(route_events.router)
event_manager_app.include_router(route_users.router)

# Create a separate app for public routes (no authentication required)
public_app = FastAPI(
    title="Event Manager Public API",
    description="Public endpoints that don't require authentication",
    version="0.1.0",
)

# Health check endpoint (public - no authentication)
public_app.include_router(route_db.router)

# Setup Prometheus instrumentation (public - no authentication)
instrumentator.instrument(public_app).expose(
    public_app, include_in_schema=False, tags=["Monitor"]
)

# Mount the public app at the root (it will handle public routes first)
event_manager_app.mount("/", public_app)
