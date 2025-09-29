from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

# from app.db import events as db
from app.routes import events as route_events
from app.routes import users as route_users

# db.init_db()

event_manager_app = FastAPI(
    title="Event Manager API",
    description="Track, plan, and manage events",
    version="0.1.0",
)

event_manager_app.include_router(route_events.router)
event_manager_app.include_router(route_users.router)

instrumentator = Instrumentator().instrument(event_manager_app)


@event_manager_app.on_event("startup")
async def _startup():
    instrumentator.expose(event_manager_app)
