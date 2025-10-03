CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    color VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL 
);

CREATE TABLE Events (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,
    event_datetime TIMESTAMPTZ NOT NULL,
    event_endtime TIMESTAMPTZ NOT NULL,
    event_location VARCHAR(255) ON DELETE CASCADE,
    description TEXT ON DELETE CASCADE,
    picture_url VARCHAR(255),
    capacity INT,
    Price_field INT,
    user_id INT NOT NULL ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE EventCategories (
    event_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (event_id, category_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);


CREATE TABLE EventAttendees (
    attendee_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('RSVPed', 'Maybe', 'Not Going') NOT NULL DEFAULT 'Not Going',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);



