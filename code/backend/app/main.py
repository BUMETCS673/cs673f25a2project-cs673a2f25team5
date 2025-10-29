"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.db import db
from app.models.exceptions import ValidateFieldError
from app.routes import attendees as route_attendees
from app.routes import categories as route_categories
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


# Exception handlers for custom validation errors
@event_manager_app.exception_handler(ValidateFieldError)
async def validate_field_error_handler(request: Request, exc: ValidateFieldError):
    """Handle custom validation field errors and return 422 status."""
    return JSONResponse(
        status_code=422, content={"detail": [{"type": "value_error", "msg": str(exc)}]}
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
event_manager_app.include_router(route_categories.router)
event_manager_app.include_router(route_events.router)
event_manager_app.include_router(route_users.router)

# Health check endpoint
event_manager_app.include_router(route_db.router)

# Setup Prometheus instrumentation
instrumentator.instrument(event_manager_app).expose(
    event_manager_app, include_in_schema=True, tags=["Monitor"]
)
