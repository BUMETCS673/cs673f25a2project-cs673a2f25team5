# Backend Guide

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

---


## Backend Architecture

The backend will be structured in 4 main layers: model, router, service, and database. This layered architecture promotes separation of concerns, maintainability, and scalability. The backend is built using FastAPI with Python and connects to a PostgreSQL database through SQLAlchemy ORM. Please see a detailed description of each layer in the sections below.

---


### Architecture Overview

The following diagram illustrates the overall backend architecture and the relationships between the different layers:

![Backend Architecture Diagram](../../docs/Diagrams/Backend%20Architecture%20Diagram.png)

---


### Model Layer

The model layer will contain the main models used by the REST API, implemented using Pydantic for data validation and serialization. This will help the team define the models needed for each of the endpoints, including Events, Users, Attendees, and utility models for operations like JSON Patch. Defining them in separate files as objects allows the team to address the minimal information needed to create entities while offering flexibility to add fields to models without having to update larger amounts of code, as the models defined are passed from function to function. Each entity follows a consistent pattern with Base, Create, and Read models, providing clear contracts for API requests and responses. The models include comprehensive validation logic to ensure data integrity at the application level before reaching the database.

---


### Router Layer

FastAPI strongly encourages the router layer as a best practice. This layer allows the entry point for the endpoints to be separated from the FastAPI app configuration, as well as from the service main logic. The routers are organized by domain (events, users, attendees) and include a dedicated health check router for database connectivity monitoring. Each router defines endpoints without containing business logic – instead, it consists of the endpoint definition, request/response models, and a call to the service layer which contains each endpoint's logic. This type of structure encourages separation of responsibility between the different layers/components and enforces that developers first have the models and routers in place before jumping into the service logic, which can be cumbersome if the endpoint body, query, or path parameters are not thought carefully beforehand. The routers also handle HTTP-specific concerns such as status codes, error responses, and API documentation through FastAPI's automatic OpenAPI generation.

---


### Service Layer

The service layer will take care of the functionality each endpoint needs to provide. Triggered by the routers, the service functions will ensure data sanity and consistency, apply business rules and validation logic, add any necessary modifications, and make use of the database layer to select, create, update, or delete information in the database. This layer encapsulates all domain-specific business logic, such as event capacity validation, user permission checks, and attendee status management. Once all the logic for each respective endpoint is completed, the service logic will return the information the router is expected to return to the user in order to minimize the logic contained in each router. The service layer also coordinates complex operations that may involve multiple database entities and ensures that business rules are consistently applied across different endpoints.

---


### Database Layer

This layer is responsible for setting up and maintaining the connection to the PostgreSQL database as well as managing all database interactions. Built on top of SQLAlchemy's async engine, this layer provides a robust foundation for database operations. This layer will contain all inserts, updates, selects, and deletes needed to handle events, users, and attendees through well-defined CRUD operations. The team will wrap all database interactions in transactions in order to avoid data corruption and inconsistencies if an error occurs midway through an SQL statement execution. This is possible as transactions support the rollback feature which allows databases to return to the previous clean state before the error occurred. The database layer also includes connection pooling for optimal performance, health monitoring capabilities, and proper error handling to ensure system reliability.

---


### Request Flow

The following sequence diagram illustrates how a typical request flows through the backend architecture:

![Backend Flow Diagram](../../docs/Diagrams/Backend%20Flow%20Diagram.png)