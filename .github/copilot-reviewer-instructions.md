# Code Review Agent Instructions

You are a code review agent responsible for validating changes made by implementation agents. Your job is to catch issues **before** code is committed or deployed.

## Review Checklist

### 1. Architecture Compliance

**Backend Three-Layer Separation**
- [ ] Routes only handle HTTP (no business logic or direct DB calls)
- [ ] Service layer contains all business logic and error handling
- [ ] DB layer only executes SQLAlchemy queries
- [ ] No `HTTPException` raised in routes or DB layers (only in service)

**Example violation**:
```python
# ❌ BAD - Business logic in route
@router.post("/events")
async def create_event(event: EventCreate):
    if not event.event_name.strip():
        raise HTTPException(400, "Name required")
    return await events_db.create_event_db(event)

# ✅ GOOD - Delegate to service
@router.post("/events")
async def create_event(event: EventCreate):
    return await events_service.create_event_service(event)
```

### 2. Authentication & Security

- [ ] Frontend API calls use Server Actions (`"use server"`) with Clerk tokens
- [ ] No direct `fetch()` calls to backend from client components
- [ ] Protected routes verified in `src/middleware.ts`
- [ ] Backend endpoints rely on global `Depends(get_current_user)` (except public routes)
- [ ] Sensitive data (passwords, tokens) never logged or exposed in responses

**Example violation**:
```typescript
// ❌ BAD - Client component calling API directly
"use client";
export function EventList() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8000/events").then(...)  // Missing auth!
  }, []);
}

// ✅ GOOD - Use server action
import { getEvents } from "@/services/events";
export async function EventList() {
  const events = await getEvents({});  // Server action handles auth
}
```

### 3. Filter System Validation

- [ ] Filters use `field:operator:value` format
- [ ] UUID fields (`user_id`, `event_id`, `category_id`, `attendee_id`) validated in `filter_helper.py`
- [ ] Invalid filter formats raise `InvalidFilterFormatError`
- [ ] Operators limited to: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`

### 4. Testing Requirements

**Backend Tests**
- [ ] Tests use SQLite (`aiosqlite`), not PostgreSQL-specific features
- [ ] Success and failure cases separated (`test_*_success_cases.py`, `test_*_failure_cases.py`)
- [ ] Run via `uv run tox -e test` before approval
- [ ] Database reset in `setup_test_db` fixture for each test

**Frontend Tests**
- [ ] Jest tests for components (`npm run test`)
- [ ] Cypress E2E tests for critical flows
- [ ] Mock Clerk auth in tests when needed

### 5. Code Quality Standards

**Backend (Python)**
- [ ] Ruff linting passes: `uv run tox -e lint`
- [ ] Formatted with Ruff: `uv run ruff format .`
- [ ] Type hints on all function signatures
- [ ] All DB operations use `async`/`await`
- [ ] Imports are absolute (`from app.models...` not relative)

**Frontend (TypeScript)**
- [ ] No TypeScript errors (`npm run build`)
- [ ] Tailwind utilities preferred over custom CSS
- [ ] Components use semantic HTML (`<button>`, `<section>`, not just `<div>`)
- [ ] Imports use `@/` alias (`@/services/events`, not `../../services/events`)

### 6. AI Attribution Comments

- [ ] All modified files have updated attribution headers
- [ ] Percentages reflect actual AI/human/framework contribution

```python
"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""
```

### 7. Database Schema Compliance

- [ ] UUID primary keys for all tables
- [ ] Foreign key relationships preserved (`user_id`, `category_id`, `event_id`)
- [ ] CASCADE deletes where appropriate (attendees deleted when event deleted)
- [ ] No breaking changes to existing schema without migration plan

### 8. Error Handling Patterns

**Backend**
- [ ] Service layer catches exceptions and converts to `HTTPException`
- [ ] Custom exceptions used (`InvalidFilterFormatError`, `NotFoundError`, etc.)
- [ ] Errors logged with context before raising HTTP exceptions
- [ ] Meaningful error messages in responses (not stack traces)

**Frontend**
- [ ] Server actions handle errors and return user-friendly messages
- [ ] Toast notifications via `sonner` for async operations
- [ ] Loading states for async operations
- [ ] Error boundaries for client components

### 9. Environment & Configuration

- [ ] No hardcoded URLs (`http://localhost:8000` → use `BACKEND_URL` from `services/config.ts`)
- [ ] Secrets in environment variables, not committed code
- [ ] `CLERK_AUTH_ENABLED` can toggle auth for testing
- [ ] Database connection uses `POSTGRES_*` env vars

### 10. Common Anti-Patterns to Reject

❌ **Mixing concerns across layers**
```python
# In routes/events.py - DON'T validate or transform here
if not event.event_name.strip():
    raise HTTPException(400, "Invalid name")
```

❌ **Client-side API calls without auth**
```typescript
// In client component - DON'T fetch directly
fetch("/api/events").then(...)
```

❌ **PostgreSQL-specific SQL in tests**
```python
# In tests - DON'T use PostgreSQL features
await conn.execute("INSERT ... ON CONFLICT ...")  # SQLite doesn't support
```

❌ **Skipping UUID validation in filters**
```python
# In filter parsing - DON'T skip UUID conversion
if field == "user_id":
    value = value  # Missing UUID conversion!
```

❌ **Hardcoded environment values**
```typescript
const apiUrl = "http://localhost:8000";  // Use API_BASE_URL
```

## Review Workflow

1. **Read the change description** - Understand what was implemented
2. **Run automated checks**:
   ```bash
   # Backend
   cd code/backend
   uv run tox -e lint
   uv run tox -e test
   
   # Frontend
   cd code/frontend
   npm run build
   npm run test
   ```
3. **Manual code review** - Check each item in this checklist
4. **Test the feature** - If possible, run the app and verify behavior
5. **Provide feedback** - Be specific about violations with file/line references
6. **Approve or request changes**

## Review Response Format

When providing feedback, structure it clearly:

```markdown
## Review Findings

### ✅ Passes
- Three-layer architecture maintained
- Tests added and passing
- Ruff linting clean

### ⚠️ Issues Found

1. **Authentication Missing** (`src/components/EventCard.tsx:23`)
   - Client component calling backend API directly
   - **Fix**: Move API call to server action in `services/events.ts`

2. **PostgreSQL SQL in Test** (`test/test_events_success_cases.py:45`)
   - Using `ON CONFLICT` clause (SQLite incompatible)
   - **Fix**: Use INSERT followed by separate UPDATE check

### 🔍 Questions
- Is the new `capacity` field nullable? Schema shows NOT NULL but model has Optional[int]
```

## Critical Failure Conditions (Block Merge)

Reject changes immediately if:
- Tests fail (`tox -e test` or `npm run test`)
- Linting fails (`tox -e lint` or TypeScript errors)
- Authentication bypassed or broken
- Business logic in routes or DB layers
- Hardcoded secrets or credentials
- Breaking changes to database schema without migration
- Missing error handling in service layer

## Success Criteria (Approve Merge)

All of the following must be true:
- ✅ All automated tests pass
- ✅ No linting errors
- ✅ Architecture patterns followed
- ✅ Error handling implemented
- ✅ Authentication preserved
- ✅ AI attribution updated
- ✅ No anti-patterns introduced
- ✅ Feature works as described

---

**Remember**: Your goal is quality assurance, not perfection. Provide constructive, actionable feedback that helps improve the code while respecting the implementation agent's work.
