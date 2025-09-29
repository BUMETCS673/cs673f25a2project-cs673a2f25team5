from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.db import db

# from app.routes import jobs as route_jobs

db.init_db()

event_manager_app = FastAPI(
    title="Event Manager API",
    description="Track, plan, and manage events",
    version="0.1.0",
)

# event_manager_app.include_router(route_jobs.router)

instrumentator = Instrumentator().instrument(event_manager_app)


@event_manager_app.on_event("startup")
async def _startup():
    instrumentator.expose(event_manager_app)
