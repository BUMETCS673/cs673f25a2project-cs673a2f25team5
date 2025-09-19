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
│   │   ├── pyproject.toml          # tool configurations (uv, etc)
│   │   ├── requirements-agent.txt  # event manager dependencies
│   │   ├── requirements-test.txt   # test dependencies
│   │   ├── tox.ini                 # tox environment definitions
│   │   └── Dockerfile              # dockerfile with definitions to build the backend image
│   └── frontend/                   # event manager frontend code
├── docs/                           # event manager plan, proposal, and design docs
├── .gitignore                      # files or folder to be ignored by git
└── README.md                       # project documentation
```

# Project Setup

## Overall Quick Setup and Run - TODO

## Frontend Setup - TODO

## Backend Setup
A modern Python project setup using:
- [`tox`](https://tox.readthedocs.io/) – for test, lint, and format automation
- [`uv`](https://github.com/astral-sh/uv) – for fast dependency installation and environment management
- [`ruff`](https://docs.astral.sh/ruff/) – for linting and formatting
---

### 🧪 Run Tasks with Tox
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

### 🧊 Using UV
This project uses [`uv`](https://github.com/astral-sh/uv) for:
- Creating fast virtual environments (`uv venv`)
- Installing packages (`uv pip install`)
- Installing dependencies in Tox (`installer = uv`)
---

### 🔗 Useful Links
- [Tox Documentation](https://tox.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [UV Project](https://github.com/astral-sh/uv)
---
