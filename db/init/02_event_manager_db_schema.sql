CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    color VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL 
);

CREATE TABLE IF NOT EXISTS Categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS Events (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,
    event_datetime TIMESTAMPTZ NOT NULL,
    event_endtime TIMESTAMPTZ NOT NULL,
    event_location VARCHAR(255),
    description TEXT,
    picture_url VARCHAR(255),
    capacity INT,
    Price_field INT,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);



CREATE TYPE attendee_status AS ENUM ('RSVPed', 'Maybe', 'Not Going');
CREATE TABLE IF NOT EXISTS EventAttendees (
    attendee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status attendee_status DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TYPE invitation_status AS ENUM ('Active', 'Expired', 'Revoked');
CREATE TABLE IF NOT EXISTS Invitations (
    invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    status invitation_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


CREATE TYPE payment_status AS ENUM
  ('created', 'processing', 'succeeded', 'failed', 'canceled');
CREATE TABLE IF NOT EXISTS Payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    currency   VARCHAR(10)   NOT NULL DEFAULT 'usd',
    status payment_status NOT NULL DEFAULT 'created',
    stripe_checkout_session_id VARCHAR(128),
    stripe_payment_intent_id   VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
