# Event Manager and Planner Project Overview

## Project Overview - TODO

## High Level Requirements - TODO

# 📁 Project Structure

```
cs673f25a2project-cs673a2f25team5/
├── code/                           # event manager code
│   ├── backend/                    # event manager backend code
│   │   ├── app/                    # fastapi app code
│   │   │   ├── db/                 # code for the db layer of the app
│   │   │   ├── models/             # code for the models used in the app
│   │   │   ├── routes/             # code for the routers (endpoints) of the app
│   │   │   ├── service/            # code for the actual service logic of the app endpoints
│   │   │   ├── __init__.py         # init file
│   │   │   ├── main.py             # entry point for the fastapi app
│   │   │   └── config.py           # database url config
│   │   ├── test/                   # backend unit and integration (end to end) tests
│   │   ├── .python.version         # tool configurations (uv, etc)
│   │   ├── pyproject.toml          # tool configurations (uv, etc)
│   │   ├── requirements.txt        # event manager dependencies
│   │   ├── requirements-test.txt   # test dependencies
│   │   ├── tox.ini                 # tox environment definitions
│   │   └── uv.lock                 # tox environment definitions
│   └── frontend/                   # event manager frontend code
│       ├─ src/app/                 # App Router pages (layout.tsx, page.tsx)
│       ├─ public/                  # Static assets
│       ├─ eslint.config.mjs        # Configuration file for ESLint and prettier
│       ├─ next.config.ts           # output: "standalone"
│       ├─ package.json             # Meta data for the project
│       ├─ package-lock.json        # Records the exact version of every package installed in node_modules
│       ├─ postcss.config.mjs       # Defines how PostCSS should process CSS files
│       ├─ tsconfig.json            # Defines how the compiler should compile the project's TS files into JS
│       └─ src/app/globals.css      # Style sheet that should persist across all pages
├── docs/                           # event manager plan, proposal, and design docs
├── .gitignore                      # files or folder to be ignored by git
├── Dockerfile.backend              # dockerfile with definitions to build the backend image
├── team.md                         # team members brief introduction
└── README.md                       # project documentation
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

2. Install dependencies

```bash
npm ci
```

2. Run Next.js application

```bash
npm run dev
```

3. Access Next.js application at http://127.0.0.1:3000

### Run Next.js Application in a Docker Container

1. Build docker image using the Dockerfile.frontend file

```bash
docker build -f Dockerfile.frontend -t event-manager-frontend:latest .
```

2. Run docker container using the image that was just built

```bash
docker run --rm -it -p 3000:3000 event-manager-frontend:latest
```

3. Access Application at http://0.0.0.0:3000

Frontend Container (Next.js Standalone)

The frontend Dockerfile uses Next.js output: "standalone" to copy only the minimal server + dependencies produced by the build.

#### Next.js packs your production server and only the required modules into .next/standalone. This:

- Shrinks container size (no dev deps or full node_modules tree),

- Speeds up cold starts and deploys,

- Keeps the runtime image minimal (great for CI/CD).

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

---

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

---

### Using UV

This project uses [`uv`](https://github.com/astral-sh/uv) for:

- Creating fast virtual environments (`uv venv`)
- Installing packages (`uv pip install`)
- Installing dependencies in Tox (`installer = uv`)

---

## 🗺️ Roadmap - TODOs

Project Overview & High-Level Requirements: Add product scope & detailed user stories.

- Frontend Tests: Add a test runner (Vitest/Jest) and coverage job in frontend-ci.yml.
- Docker Registry: Add image build & push steps to CI for both services.
- Docker-compose: Add docker-compose file to bundle frontend and backend Dockerfiles
- Env/Config Docs: Document required environment variables for prod runs.

### Useful Links

- [Tox Documentation](https://tox.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [UV Project](https://github.com/astral-sh/uv)
- [Next.js](https://nextjs.org/docs)

---
