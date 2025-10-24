# Database Guide

## Database Design

The Event Manager application's backend leverages a relational database model implemented with PostgreSQL to ensure data integrity, scalability, and efficient query performance. The database schema is designed to support core functionalities such as user management, event creation, categorization, and attendee registration, while maintaining clear relationships and enforcing referential integrity through foreign key constraints.

The design follows industry best practices for normalized relational schemas, enabling flexible querying, easy future extensibility, and robust transaction support. Database migrations and schema evolution are managed through SQL scripts and SQLAlchemy ORM definitions, ensuring consistency across development and production environments.


### Entity Relationship Diagram (ERD)

The following ERD illustrates the primary tables and their relationships within the system:

![Database ERD Diagram](./../docs/Diagrams/Database%20ERD%20Diagram.png)

---


### Tables and Relationships

#### Users

The `Users` table stores all registered user profiles, capturing essential information such as name, email, date of birth, and profile attributes.

**Key fields:**
- `user_id` (UUID, primary key)
- `first_name`, `last_name`
- `email` (unique)
- `date_of_birth`
- `color` (optional profile attribute)
- `created_at`, `updated_at` (timestamps)

Each user may create multiple events and register for any event as an attendee.

---


#### Events

The `Events` table records all planned events, linking each event to its creator (organizer) and its category.

**Key fields:**
- `event_id` (UUID, primary key)
- `event_name`, `event_datetime`, `event_endtime`
- `event_location`, `description`, `picture_url`
- `capacity`, `price_field`
- `user_id` (foreign key, references `Users`)
- `category_id` (foreign key, references `Categories`)
- `created_at`, `updated_at` (timestamps)

Events are uniquely identified and connected to both their organizer and a category, supporting efficient filtering and search.

---


#### EventAttendees

The `EventAttendees` table tracks attendee registrations for each event, enabling RSVP functionality and capturing attendance status.

**Key fields:**
- `attendee_id` (UUID, primary key)
- `event_id` (foreign key, references `Events`)
- `user_id` (foreign key, references `Users`)
- `status_attendee_status` (e.g., RSVPed, Maybe, Not Going)
- `created_at`, `updated_at` (timestamps)

This junction table establishes a many-to-many relationship between users and events, allowing users to register for multiple events and events to have multiple attendees.

---


#### Categories

The `Categories` table enables event categorization, supporting search and organization.

**Key fields:**
- `category_id` (UUID, primary key)
- `category_name`
- `description`

Categories provide a way to group and filter events by type or theme.

---


### Referential Integrity and Constraints

- Foreign key constraints are enforced on `event_id`, `user_id`, and `category_id` fields to maintain data consistency.
- Cascading rules ensure that deleting a user or event appropriately updates related records.
- Unique constraints on primary keys and certain fields (e.g., `email`) prevent duplication.

---


### Design Considerations

- **Scalability**: UUIDs are used as primary keys for distributed scalability and uniqueness.
- **Extensibility**: The schema allows for easy addition of new fields, such as event analytics, ticketing, or payment integration.

The database design ensures reliable data storage and efficient access for all application features, while supporting future enhancements and integrations.

---


## Database Setup

### Database Initialization Files

Database initialization and migrations are managed through SQL scripts located in the `db/init/` directory of the repository. These files are executed during the database setup process, typically as part of the Docker Compose workflow, ensuring all required extensions and tables are created with the proper schema.

- **01_add_extensions.sql**  
  *Purpose*: This script adds necessary PostgreSQL extensions that are required for the application. Extensions might include support for UUID generation, advanced indexing, or other features to optimize database performance and functionality.

- **02_event_manager_db_schema.sql**  
  *Purpose*: This script defines the core schema for the Event Manager application. It creates all tables (`Users`, `Events`, `Categories`, `EventAttendees`), sets up primary and foreign key constraints, and establishes the relationships as outlined in the ERD. It ensures the database structure matches the application's data model and enforces referential integrity.

These initialization files ensure that the database environment is consistent and reproducible across development, staging, and production deployments. Any future additions to the init process like database constraints or indexes will be added in sequential files to ensure the init process for the event_manager database is robust and complete.