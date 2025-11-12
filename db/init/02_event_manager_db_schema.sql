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


CREATE TABLE IF NOT EXISTS Payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for each payment
  event_id   UUID NOT NULL REFERENCES Events(event_id) ON DELETE CASCADE, -- Event the payment is for
  user_id    UUID NOT NULL REFERENCES Users(user_id)  ON DELETE CASCADE, -- User who made the payment
  amount_usd NUMERIC(10,2) NOT NULL, -- Payment amount in USD (25.00) 
  currency   VARCHAR(10)   NOT NULL DEFAULT 'usd', -- Currency code (default = 'usd') [For multi currency option for future]
  status     VARCHAR(20)   NOT NULL DEFAULT 'created', -- created|processing|succeeded|failed|canceled
  -- Stripe’s unique ID for the checkout session (the hosted page where the user clicked “Pay”).
  stripe_checkout_session_id VARCHAR(128), -- Stripe checkout session ID (for reference) [Used to link the local payment record with the Stripe-hosted checkout page] 
  -- Stripe’s ID for the actual payment transaction (used for verifying payment success/failure).
  stripe_payment_intent_id   VARCHAR(128), -- Stripe payment intent ID (for verification) [Used to verify the final payment status (succeeded, failed, etc.) via webhooks.]
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
