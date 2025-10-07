# Event Manager and Planner Project Overview

## Project Overview - TODO

## High Level Requirements - TODO

# 📁 Project Structure

```
cs673f25a2project-cs673a2f25team5/
├── code/                                       # event manager code
│   ├── backend/                                # event manager backend code
│   │   ├── app/                                # fastapi app code
│   │   │   ├── db/                             # code for the db layer of the app
│   │   │   ├── models/                         # code for the models used in the app
│   │   │   ├── routes/                         # code for the routers (endpoints) of the app
│   │   │   ├── service/                        # code for the actual service logic of the app endpoints
│   │   │   ├── __init__.py                     # init file
│   │   │   ├── main.py                         # entry point for the fastapi app
│   │   │   └── config.py                       # database url config
│   │   ├── test/                               # backend unit and integration (end to end) tests
│   │   ├── .python.version                     # python version used for the backend
│   │   ├── pyproject.toml                      # tool configurations (uv, etc)
│   │   ├── requirements.txt                    # event manager backend dependencies
│   │   ├── requirements-test.txt               # event manager backend test dependencies
│   │   ├── tox.ini                             # tox environment definitions
│   │   └── uv.lock                             # uv overall definitions
│   └── frontend/                               # event manager frontend code
|       ├── src                                 # source code
│       |  └── app/                             # app Router pages (layout.tsx, page.tsx)
|       |  │   ├── globals.css                   # style sheet that should persist across all pages
|       |  │   ├── api                          # route for all api calls
|       |  │   │ └── webhooks                   # route for access webhooks
|       |  │   │   └── clerk                    # route for clerks webhook
|       |  │   │      └── route.ts              # typescript code to intercept webhook from clerk
|       |  │   ├── favicon.ico                  # icons for metadata of the web application
|       |  │   ├── globals.css                  # where global css variables can be declared and imports for tailwind
|       |  │   ├── layout.tsx                   # root layout of the application
|       |  │   └── page.tsx                     # landing page of the application
|       |  ├── component/                       # Folder to keep al reusable components
|       |  ├── helper/                          # Reusable helper functions
|       |  |    └── fetchTimeout                # Timeout to avoid hanging requests
|       |  └── middleware.ts                    # run code before a request is completed (used for protected/public routes)
│       ├── public/                             # static assets
│       ├── eslint.config.mjs                   # configuration file for ESLint and prettier
│       ├── next.config.ts                      # output: "standalone"
│       ├── package.json                        # metadata for the project
│       ├── package-lock.json                   # records the exact version of every package installed in node_modules
│       ├── postcss.config.mjs                  # defines how PostCSS should process CSS files
│       └── tsconfig.json                       # defines how the compiler should compile the project's TS files into JS
├── db/                                         # database setup (docker compose, schema, ...)
|   ├── init/                                   # files used to initialize the database as part of the docker compose up
|   |   ├── 01_add_extensions.sql               # sql extensions that need to be added to postgressql
|   |   └── 02_event_manager_db_schema.sql      # event manager db schema to create all tables
|   └── db-compose-docker.yaml                  # docker compose file to start the postgres and pgadmin container and needed volumes
├── docs/                                       # event manager plan, proposal, and design docs, ...
├── .gitignore                                  # files or folder to be ignored by git
├── .gitleaks.toml                              # gitleaks configuration (allowlist)
├── Dockerfile.backend                          # dockerfile with definitions to build the backend image
├── Dockerfile.frontend                         # dockerfile with definitions to build the frontend image
├── team.md                                     # team members brief introduction
└── README.md                                   # project documentation
```

## 🧰 Prerequisites

- **Node.js 20.x** (Frontend)
- **npm** (Frontend)
- **Python 3.11** (Backend)
- **uv** (`pip install uv`) and **tox** (`pip install tox`) (Backend)
- **Docker** (optional, for containerized runs)

# Project Setup

## Overall Quick Setup and Run - TODO

## Frontend Setup

This is a Next.js project bootstrapped with create-next-app.

```bash
cd code/frontend
npm ci
npm run dev     # Starts Next.js (Turbopack) on http://localhost:3000
Scripts (from package.json):
dev – next dev --turbopack
build – next build --turbopack
start – next start
lint – eslint
```

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

## Authentication Setup (Clerk)

### Required environment variables

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

### Webhook flow

- Clerk sends `user.created` events to `POST /api/webhooks/clerk`.
- The handler verifies the signature with `verifyWebhook` using
  `CLERK_WEBHOOK_SIGNING_SECRET` and logs errors for invalid payloads.
- Valid events trigger a POST to `${BACKEND_URL}/create-user/` with the user's
  name and primary email to keep the backend in sync.
- Ensure your FastAPI service exposes this endpoint; the webhook responds with a
  `500` status if the sync call fails.

### Route protection

`code/frontend/src/middleware.ts` uses `clerkMiddleware` to guard `/discover`
and `/onboarding` while leaving `/api/webhooks/clerk` and static assets
unauthenticated. The global layout (`code/frontend/src/app/layout.tsx`) renders
sign-in/up buttons for unauthenticated visitors and a `UserButton` once signed
in.

### GitHub Actions secrets

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

### Run CI Tasks with Tox

#### Run tests

```bash
uv run tox -e test
```

#### Test coverage

```bash
uv run tox -e test
```

#### Run Ruff linter

```bash
uv run tox -e lint
```

#### Check formatting with Ruff

```bash
uv run tox -e format
```

### Manual Ruff Usage

If you want to run Ruff directly:

#### Format the code

```bash
uv run ruff format .
```

#### Check for lint issues

```bash
uv run ruff check .
```

### Using UV

This project uses [`uv`](https://github.com/astral-sh/uv) for:

- Creating fast virtual environments (`uv venv`)
- Installing packages (`uv pip install`)
- Installing dependencies in Tox (`installer = uv`)

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

### Secret Scanning (Gitleaks)

This repo uses **Gitleaks** to stop secrets (API keys, tokens, etc.) from landing in the codebase.

- **Where it runs:** part of the GitHub Actions workflow in '.github/workflows/backend-ci.yml'
- **Config:** '.gitleaks.toml' (reduces false positives by ignoring docs/caches and obvious dummy tokens)
- **Output:** results are uploaded to **Security → Code scanning alerts** and PRs get inline annotations
- **Permissions:** the workflow grants 'security-events: write' to upload SARIF; it uses the auto-provided 'secrets.GITHUB_TOKEN'

#### Setup

1. Add repo secret **'GITLEAKS_LICENSE_KEY'** (Repo → Settings → Secrets and variables → Actions).
2. Keep '.gitleaks.toml' at repo root so the scanner picks it up.

## 🗺️ Roadmap - TODOs

Project Overview & High-Level Requirements:

- Add product scope & detailed user stories.
- Frontend Tests: Add a test runner (Vitest/Jest) and coverage job in frontend-ci.yml.
- Docker-compose: Add docker-compose file to bundle frontend and backend Dockerfiles
- Env/Config Docs: Document required environment variables for prod runs.

## Useful Links

- [Tox Documentation](https://tox.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [UV Project](https://github.com/astral-sh/uv)
- [Next.js](https://nextjs.org/docs)
- [Pip Audit](https://github.com/pypa/pip-audit)
- [Semgrep](https://github.com/semgrep/semgrep)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
