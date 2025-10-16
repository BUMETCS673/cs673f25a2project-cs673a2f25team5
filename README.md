# Event Manager and Planner Project Overview

Modern social event discovery and hosting tools span a wide range from casual invite pages to full ticketing stacks. Many existing tools are either too heavy (enterprise ticketing) or too casual (single-use invite pages), and they often trade off privacy, discoverability, and simplicity. Our project aims to fill a middle ground: a lightweight, privacy-conscious event hosting and discovery website that makes it quick to create attractive event pages, manage RSVPs, and integrate with calendars — while remaining easy to extend. The purpose is to let organizers create event pages and guest lists quickly, let guests RSVP and share the event, and provide organizers lightweight analytics and collaboration tools for running events.

# Project Structure / Architecture

The event manager app aims to help individuals and organizations manage and track their events. In order to do so, the team's proposed solution is a full stack application. The team plans to provide this service through a website connected to a backend REST API that provides the needed endpoints for the user to manage and RSVP to events, among other functionalities. The frontend is built using Next.js with TypeScript to deliver a responsive and user-friendly interface for event management. The backend will be composed of 3 main components: the REST API, the SQL database, and monitoring services. The REST API will provide all the functionality needed by the frontend through various endpoints to enable users to control their events. The SQL database will provide a storage solution for information within the application. Additionally, the application integrates Clerk authentication services to handle user management and security, while Prometheus monitoring ensures system reliability and performance tracking. Please see the figure below for a diagram of the full stack application's design.

![Architecture Diagram](./docs/Diagrams/Event%20Manager%20Overall%20Architecture.png)

## Frontend

Please go to the [frontend readme](https://github.com/BUMETCS673/cs673f25a2project-cs673a2f25team5/blob/main/code/frontend/frontend-README.md) for a detailed explanation of the frontend structure and guidelines followed by the event manager application.

## Backend

Please go to the [backend readme](https://github.com/BUMETCS673/cs673f25a2project-cs673a2f25team5/blob/main/code/backend/backend-README.md) for a detailed explanation of the backend structure and guidelines followed by the event manager application.

## 📁 Overall Folder Structure

```
cs673f25a2project-cs673a2f25team5/
├── code/                                             # event manager code
│   ├── backend/                                      # event manager backend code
│   │   ├── app/                                      # fastapi app code
│   │   │   ├── db/                                   # code for the db layer of the app
│   │   │   │   ├── categories.py                     # database operations for categories
│   │   │   │   ├── db.py                             # database engine and metadata configuration
│   │   │   │   ├── events.py                         # database operations for events
│   │   │   │   ├── filters.py                        # filter operation models for database queries
│   │   │   │   └── users.py                          # database operations for users
│   │   │   ├── models/                               # code for the models used in the app
│   │   │   │   ├── attendees.py                      # pydantic models for event attendees
│   │   │   │   ├── events.py                         # pydantic models for events (EventCreate, EventRead, PaginatedEvents)
│   │   │   │   ├── exceptions.py                     # custom exception classes
│   │   │   │   ├── patch.py                          # pydantic models for PATCH operations
│   │   │   │   └── users.py                          # pydantic models for users (UserCreate, UserRead, PaginatedUsers)
│   │   │   ├── routes/                               # code for the routers (endpoints) of the app
│   │   │   │   ├── __init__.py                       # router initialization
│   │   │   │   ├── attendees.py                      # attendees endpoints (stub)
│   │   │   │   ├── db.py                             # database health check endpoint
│   │   │   │   ├── events.py                         # events endpoints (GET, POST, DELETE, PATCH)
│   │   │   │   └── users.py                          # users endpoints (GET, POST, DELETE, PATCH)
│   │   │   ├── service/                              # code for the actual service logic of the app endpoints
│   │   │   │   ├── __init__.py                       # service initialization
│   │   │   │   ├── events.py                         # business logic for events (validation, error handling)
│   │   │   │   ├── filter_helper.py                  # filter parsing and validation logic
│   │   │   │   └── users.py                          # business logic for users (validation, error handling)
│   │   │   ├── __init_.py                            # init file
│   │   │   ├── main.py                               # entry point for the fastapi app
│   │   │   └── config.py                             # database url config
│   │   ├── test/                                     # backend unit and integration (end to end) tests
│   │   │   ├── test_events_failure_cases.py          # failure test cases for events endpoints
│   │   │   ├── test_events_success_cases.py          # success test cases for events endpoints
│   │   │   ├── test_filter_helper_failure_cases.py   # failure test cases for filter helper
│   │   │   ├── test_filter_helper_success_cases.py   # success test cases for filter helper
│   │   │   ├── test_users_failure_cases.py           # failure test cases for users endpoints
│   │   │   └── test_users_success_cases.py           # success test cases for users endpoints
│   │   ├── .python.version                           # python version used for the backend
│   │   ├── backend-README.md                         # detailed backend documentation
│   │   ├── pyproject.toml                            # tool configurations (uv, pytest, ruff)
│   │   ├── requirements.txt                          # event manager backend dependencies
│   │   ├── requirements-test.txt                     # event manager backend test dependencies
│   │   ├── tox.ini                                   # tox environment definitions
│   │   └── uv.lock                                   # uv overall definitions
│   └── frontend/                                     # event manager frontend code
│       ├── public/                                   # static assets
│       │   ├── file.svg                              # file icon asset
│       │   ├── globe.svg                             # globe icon asset
│       │   ├── next.svg                              # Next.js logo
│       │   ├── vercel.svg                            # Vercel logo
│       │   └── window.svg                            # window icon asset
│       ├── src/                                      # source code
│       │   ├── app/                                  # app Router pages (layout.tsx, page.tsx)
│       │   │   ├── api/                              # route for all api calls
│       │   │   │   └── webhooks/                     # route for access webhooks
│       │   │   │       └── clerk/                    # route for clerks webhook
│       │   │   │           └── route.ts              # typescript code to intercept webhook from clerk
│       │   │   ├── create-events/                    # route for create events page
│       │   │   │   └── page.tsx                      # page component for creating new events
│       │   │   ├── favicon.ico                       # site favicon icon
│       │   │   ├── globals.css                       # where global css variables can be declared and imports for tailwind
│       │   │   ├── layout.tsx                        # root layout component defining global styles
│       │   │   └── page.tsx                          # home page/landing page component
│       │   ├── component/                            # reusable React components
│       │   │   ├── events/                           # event-related components
│       │   │   │   └── CreateEventForm.tsx           # form component for event creation
│       │   │   └── landing/                          # landing page components
│       │   │       ├── BenefitsSection.tsx           # benefits section component for landing page
│       │   │       ├── CallToActionSection.tsx       # CTA section component for landing page
│       │   │       ├── DemoShowcaseSection.tsx       # demo showcase component for landing page
│       │   │       ├── FeatureHighlightsSection.tsx  # feature highlight component for landing page
│       │   │       ├── Heading.tsx                   # section heading component
│       │   │       ├── HeroSection.tsx               # hero section component for landing page
│       │   │       ├── WorkflowStepsSection.tsx      # workflow steps component for landing page
│       │   │       └── landingData.ts                # data/constants for landing page sections
│       │   ├── helpers/                              # reusable helper functions
│       │   │   └── fetchTimeout.ts                   # timeout to avoid hanging requests
│       │   └── middleware.ts                         # run code before a request is completed (used for protected/public routes)
│       ├── eslint.config.mjs                         # configuration file for ESLint and prettier
│       ├── frontend-README.md                        # detailed frontend documentation
│       ├── next.config.ts                            # next.js configuration with output: "standalone"
│       ├── package.json                              # metadata for the project
│       ├── package-lock.json                         # records the exact version of every package installed in node_modules
│       ├── postcss.config.mjs                        # defines how PostCSS should process CSS files
│       └── tsconfig.json                             # defines how the compiler should compile the project's TS files into JS
├── db/                                               # database setup (docker compose, schema, ...)
│   ├── init/                                         # files used to initialize the database as part of the docker compose up
│   │   ├── 01_add_extensions.sql                     # sql extensions that need to be added to postgresql
│   │   └── 02_event_manager_db_schema.sql            # event manager db schema to create all tables
│   ├── database-README.md                            # detailed database documentation
│   └── db-docker-compose.yaml                        # docker compose file to start the postgres and pgadmin container and needed volumes
├── docs/                                             # event manager plan, proposal, and design docs
│   ├── Diagrams/                                     # architecture and design diagrams
│   │   ├── Backend Architecture Diagram.png          # detailed backend architecture
│   │   ├── Backend Flow Diagram.png                  # backend request flow diagram
│   │   ├── Database ERD Diagram.png                  # database entity relationship diagram
│   │   └── Event Manager Overall Architecture.png    # overall system architecture
│   ├── CS673_Database_Schema_team4.pdf               # database schema documentation
│   ├── CS673_MeetingMinutes_team4.docx               # team meeting minutes
│   ├── CS673_ProgressReport_team4.xlsx               # project progress tracking
│   ├── CS673_SPPP_RiskManagement_team4.xlsx          # risk management plan
│   ├── CS673_SPPP_team4.docx                         # software project plan and proposal
│   └── CS673_presentation0_team.pptx                 # project presentation slides
├── .github/                                          # GitHub configuration
│   └── workflows/                                    # GitHub Actions CI/CD workflows
│       ├── backend-ci.yml                            # backend continuous integration (test, lint, security, docker)
│       └── frontend-ci.yml                           # frontend continuous integration (lint, format, docker)
├── .gitignore                                        # files or folders to be ignored by git
├── .gitleaks.toml                                    # gitleaks configuration (allowlist)
├── Dockerfile.backend                                # dockerfile with definitions to build the backend image
├── Dockerfile.frontend                               # dockerfile with definitions to build the frontend image
├── team.md                                           # team members brief introduction
└── README.md                                         # project documentation
```

# Project Setup

## 🧰 Prerequisites

- **Node.js 20.x** (Frontend)
- **npm** (Frontend)
- **Python 3.11** (Backend)
- **uv** (`pip install uv`) (Backend)
- **Docker** (optional, for containerized runs)

## Overall Quick Setup and Run - TODO

## Frontend Setup

This is a Next.js project bootstrapped with create-next-app.

```bash
cd code/frontend
npm ci
npm run dev                       # Starts Next.js (Turbopack) on http://localhost:3000
Scripts (from package.json):
dev – next dev --turbopack
build – next build --turbopack
start – next start
lint – eslint
```

---

### Run Next.js Application locally

1. Access the frontend directory

```bash
cd code/frontend
```

2. Copy the sample environment file and replace the Clerk secrets with values
   from your project. Update `BACKEND_URL` to point at the FastAPI instance.

3. Install dependencies

```bash
npm ci
```

4. Run Next.js application

```bash
npm run dev
```

5. Access Next.js application at http://127.0.0.1:3000

---

### Run Next.js Application in a Docker Container

1. Build the Docker image and supply the Clerk publishable key so the compiled
   assets embed the correct client-side configuration.

```bash
docker build -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your_publishable_key>" \
  -t event-manager-frontend:latest .
```

2. Run docker container using the image that was just built

```bash
docker run --rm -it -p 3000:3000 \
  -e CLERK_SECRET_KEY="<your_secret_key>" \
  -e CLERK_WEBHOOK_SIGNING_SECRET="<your_webhook_secret>" \
  -e CLERK_JWKS_URL="<your_jwks_url>" \
  -e BACKEND_URL="http://backend:8000" \
  event-manager-frontend:latest
```

3. Access Application at http://0.0.0.0:3000

Frontend Container (Next.js Standalone)

The frontend Dockerfile uses Next.js output: "standalone" to copy only the minimal server + dependencies produced by the build.

---

#### Next.js packs your production server and only the required modules into .next/standalone. This:

- Shrinks container size (no dev deps or full node_modules tree),
- Speeds up cold starts and deploys,
- Keeps the runtime image minimal (great for CI/CD).

---

### Authentication Setup (Clerk)

#### Required environment variables

Set the following values in `code/frontend/.env.local` (or export them in your
shell) and mirror them into your CI secrets:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – public key for rendering Clerk widgets.
- `CLERK_SECRET_KEY` – backend API key used by Next.js server components and the
  webhook handler.
- `CLERK_JWKS_URL` – JWKS endpoint for token validation (Clerk dashboard → API
  Keys).
- `CLERK_WEBHOOK_SIGNING_SECRET` – secret provided when you create the webhook
  endpoint inside Clerk.
- `BACKEND_URL` – base URL for the FastAPI service that receives user sync
  requests.
  `code/frontend/.env` contains local development defaults. Copy it to
  `.env.local` and replace the secret values with keys from your Clerk project
  before running the app. `.env.local` is git-ignored—keep real secrets out of the
  repository.

---

#### Webhook flow

- Clerk sends `user.created` events to `POST /api/webhooks/clerk`.
- The handler verifies the signature with `verifyWebhook` using
  `CLERK_WEBHOOK_SIGNING_SECRET` and logs errors for invalid payloads.
- Valid events trigger a POST to `${BACKEND_URL}/create-user/` with the user's
  name and primary email to keep the backend in sync.
- Ensure your FastAPI service exposes this endpoint; the webhook responds with a
  `500` status if the sync call fails.

---

#### Route protection

`code/frontend/src/middleware.ts` uses `clerkMiddleware` to guard `/discover`
and `/onboarding` while leaving `/api/webhooks/clerk` and static assets
unauthenticated. The global layout (`code/frontend/src/app/layout.tsx`) renders
sign-in/up buttons for unauthenticated visitors and a `UserButton` once signed
in.

---

#### GitHub Actions secrets

`.github/workflows/frontend-ci.yml` now pulls Clerk secrets during the `check`
and `docker` jobs. Populate the following repository secrets so CI can build and
publish the frontend image:

- `CLERK_JWKS_URL`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Backend Setup

A modern Python project setup using:

- [`tox`](https://tox.readthedocs.io/) – for test, lint, and format automation
- [`uv`](https://github.com/astral-sh/uv) – for fast dependency installation and environment management
- [`ruff`](https://docs.astral.sh/ruff/) – for linting and formatting

---

### Run FastApi Application / REST Api Locally

1. Access the backend directory

```bash
cd code/backend
```

2. Run fastapi application

```bash
uv run uvicorn app.main:event_manager_app --reload
```

3. Access REST Api at http://127.0.0.1:8000

4. Access REST Api swagger docs at http://127.0.0.1:8000/docs

---

### Run FastApi Application / REST Api in a Docker Container

1. Build docker image using the Dockerfile.backend file

```bash
docker build -f Dockerfile.backend -t event-manager-backend:latest .
```

2. Run docker container using the image that was just built

```bash
docker run --rm -it -p 8000:8000 event-manager-backend:latest
```

3. Access REST Api at http://0.0.0.0:8000

4. Access REST Api swagger docs at http://0.0.0.0:8000/docs

---

### Run CI Tasks with Tox

#### Run tests

```bash
uv run tox -e test
```

---

#### Test coverage

```bash
uv run tox -e coverage
```

---

#### Run Ruff linter

```bash
uv run tox -e lint
```

---

#### Check formatting with Ruff

```bash
uv run tox -e format
```

---

### Manual Ruff Usage

If you want to run Ruff directly:

#### Format the code

```bash
uv run ruff format .
```

---

#### Check for lint issues

```bash
uv run ruff check .
```

## Database Setup

This project uses postgressql as both the local development and production database. Please see below the steps to locally run your own version of the event manager database.
To clarify, the section below uses the DB-docker-compose.yaml file to create the container for the postgres instance which holds the event_manager database as well as the pgadmin container which runs a simple and easy to use web ui to connect to the postgres instance.

1. Run the following command to export all env variables.

```bash
export POSTGRES_USER=test
POSTGRES_PASSWORD=test1234
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
POSTGRES_DB=event_manager
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=adminpass
```

2. Run the following command to get the postgres and pgadmin containers running.

```bash
docker compose -f db/db-docker-compose.yaml --env-file .env up -d --wait
```

3. Access pgadmin web ui at http://localhost:8080

4. Run the following command when you are done with the database to remove the volumes and containers.

```bash
docker compose -f db/db-docker-compose.yaml down -v
```

## Security Setup

### Python Dependency Audit (pip-audit)

```bash
pip install pip-audit
cd code/backend
pip-audit -r requirements.txt
pip-audit -r requirements-test.txt
```

---

### Semgrep Scan

```bash
pip install semgrep
semgrep --version
# Scan backend
semgrep --config p/python code/backend
# Scan Frontend
semgrep --config p/react code/frontend
# Full Project Scan
semgrep ci --config auto
```

---

### Secret Scanning (Gitleaks)

This repo uses **Gitleaks** to stop secrets (API keys, tokens, etc.) from landing in the codebase.

- **Where it runs:** part of the GitHub Actions workflow in '.github/workflows/backend-ci.yml'
- **Config:** '.gitleaks.toml' (reduces false positives by ignoring docs/caches and obvious dummy tokens)
- **Output:** results are uploaded to **Security → Code scanning alerts** and PRs get inline annotations
- **Permissions:** the workflow grants 'security-events: write' to upload SARIF; it uses the auto-provided 'secrets.GITHUB_TOKEN'

#### Setup

1. Add repo secret **'GITLEAKS_LICENSE_KEY'** (Repo → Settings → Secrets and variables → Actions).
2. Keep '.gitleaks.toml' at repo root so the scanner picks it up.

## Useful Links

- [UV Project](https://github.com/astral-sh/uv)
- [Tox Documentation](https://tox.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Next.js](https://nextjs.org/docs)
- [Clerk](https://clerk.com/)
- [Pip Audit](https://github.com/pypa/pip-audit)
- [Semgrep](https://github.com/semgrep/semgrep)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
