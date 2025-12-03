# Event Manager AI Coding Instructions

## Architecture Overview

Event Manager is a full-stack event hosting and discovery platform with three main components:

1. **Frontend**: Next.js 15 App Router (TypeScript) at `code/frontend/`
2. **Backend**: FastAPI (Python 3.11+) REST API at `code/backend/`
3. **Database**: PostgreSQL with schema in `db/init/02_event_manager_db_schema.sql`

**Data Flow**: Frontend → Clerk Auth → Backend API (protected by Clerk JWT) → PostgreSQL

## Critical Backend Patterns

### Three-Layer Architecture (Routes → Service → DB)

Every endpoint follows this strict separation:

```python
# routes/events.py - HTTP layer, validation, OpenAPI docs
async def list_events(filter_expression, offset, limit) -> PaginatedEvents:
    return await events_service.get_events_service(filter_expression, offset, limit)

# service/events.py - Business logic, error handling
async def get_events_service(filter_expression, offset, limit) -> PaginatedEvents:
    filters = [parse_filter(f) for f in (filter_expression or [])]
    events, total = await events_db.get_events_db(filters, offset, limit)
    return PaginatedEvents(items=events, total=total, offset=offset, limit=limit)

# db/events.py - Raw database operations
async def get_events_db(filters, offset, limit) -> tuple[list[EventRead], int]:
    # SQLAlchemy async queries
```

**Always maintain this separation** - routes handle HTTP, service has business rules, db executes queries.

### Filter System (`field:operator:value`)

Endpoints accept filters like `event_name:ilike:Party%` or `user_id:eq:<uuid>`. The parsing flow:

1. `routes/` receives `filter_expression: list[str]` query params
2. `service/filter_helper.py::parse_filter()` validates format and converts UUIDs for ID fields
3. `db/filters.py::FilterOperation` maps operators (`eq`, `ilike`, etc.) to SQL operators
4. DB layer applies filters to SQLAlchemy queries

**UUID fields** (`user_id`, `event_id`, `category_id`, `attendee_id`) auto-convert to UUID type. Invalid UUIDs raise `InvalidFilterFormatError`.

### Authentication (Clerk JWT)

- `app/main.py` applies `Depends(get_current_user)` globally to all routes via `dependencies=[...]`
- Public routes (health checks, Prometheus metrics) live in a separate `public_app` mounted at root
- `app/auth.py::verify_clerk_token()` validates JWTs using Clerk's JWKS endpoint
- Toggle auth with `CLERK_AUTH_ENABLED=False` for local testing without tokens

**Frontend integration**: `services/events.ts` includes `Authorization: Bearer ${token}` where `token = await getToken()` from Clerk.

### Testing Strategy

Tests use **SQLite in-memory** databases via `aiosqlite` (not PostgreSQL):

```python
@pytest_asyncio.fixture(scope="session")
async def test_engine(test_db_file: str):
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", ...)
    db.engine = engine  # Swap engine for tests
```

- Tests in `test/test_*_success_cases.py` and `test_*_failure_cases.py`
- Run: `uv run tox -e test` (or `uv run tox -e coverage` for reports)
- Each test resets the database via `setup_test_db` fixture

## Critical Frontend Patterns

### Server Actions Pattern

All API calls are **Server Actions** (`"use server"`) in `src/services/`:

```typescript
// services/events.ts
"use server";
export async function createEvent(payload: EventCreatePayload): Promise<EventResponse> {
  const { getToken } = await auth();
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(EventCreatePayloadSchema.parse(payload)),
  });
  // Error handling and Zod parsing
}
```

**Never call backend APIs directly from client components** - always go through server actions with Clerk token.

### Route Protection Middleware

`src/middleware.ts` uses Clerk's `clerkMiddleware`:

- Protected routes: `/discover`, `/create-events`, `/events/*` require `await auth.protect()`
- Bypass: `/api/webhooks/clerk` (webhook validation), and E2E mode (`NEXT_PUBLIC_E2E=1`)

### Styling with Tailwind v4

- Global tokens in `src/app/globals.css` with `@theme inline` syntax
- Prefer utility classes; component-scoped CSS only when utilities can't express design
- Responsive breakpoints: `sm:`, `md:`, `lg:` instead of media queries
- Framer Motion for animations; use `PageTransitions` wrapper (already in `layout.tsx`)

## Developer Workflows

### Backend Development

```bash
cd code/backend
uv run uvicorn app.main:event_manager_app --reload  # Dev server at :8000
uv run tox -e test                                  # Run tests
uv run tox -e lint                                  # Ruff linting
uv run ruff format                                  # Auto-format
uv run ruff check --fix                             # Fix lint issues
```

**Database connection**: Set `POSTGRES_*` env vars in `.env` or use defaults (localhost:5432, user: postgres).

### Frontend Development

```bash
cd code/frontend
npm run dev           # Next.js dev server at :3000
npm run test          # Jest tests
npm run cypress:open  # E2E tests
```

**Environment vars**: `NEXT_PUBLIC_BACKEND_URL` (backend API base), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

### Docker Compose

Full stack: `docker-compose -f docker-compose.dev.yaml up` (requires `.env` with all Clerk/DB vars).

## JSON Patch Operations

Backend supports PATCH with JSON Patch format (`models/patch.py`):

```python
PatchRequest(patch={
    UUID("event-id"): JSONPatchOperation(op="replace", path="/event_name", value="New Name")
})
```

Used for bulk attendee status updates (`routes/attendees.py::patch_attendees`).

## AI Code Attribution Comments

**All files** include attribution headers:

```python
"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""
```

Update percentages when modifying files. Framework code = auto-generated by Next.js, FastAPI, etc.

## Key Conventions

- **Backend**: Use `async`/`await` for all DB operations; raise `HTTPException` in service layer
- **Frontend**: Server components by default; add `"use client"` only when needed (hooks, browser APIs)
- **Error Handling**: Service layer catches DB errors and converts to `HTTPException`; frontend shows toasts via `sonner`
- **Naming**: UUIDs for all primary keys; `snake_case` backend, `camelCase` frontend
- **Imports**: Backend uses absolute imports (`from app.models...`); frontend uses `@/` alias (`@/services/...`)

## Database Schema Essentials

- **Users**: `user_id` (UUID), `email` (CITEXT UNIQUE), Clerk integration via webhook (`api/webhooks/clerk/route.ts`)
- **Events**: Foreign keys to `Users.user_id` (organizer) and `Categories.category_id`
- **EventAttendees**: Many-to-many with `status` ENUM ('RSVPed', 'Maybe', 'Not Going')
- **Cascade Deletes**: Deleting a user or event cascades to attendees

## Common Pitfalls

❌ **Don't** call backend APIs from client components directly  
✅ **Do** use server actions in `services/` with Clerk tokens

❌ **Don't** mix business logic into routes or DB layers  
✅ **Do** keep service layer pure for testability

❌ **Don't** use PostgreSQL-specific features in tests (they run on SQLite)  
✅ **Do** use compatible SQL or mock DB-specific code

❌ **Don't** hardcode `http://localhost:8000` in frontend  
✅ **Do** use `BACKEND_URL` from `services/config.ts`
