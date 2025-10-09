-- Add constraints for Categories table since the categories are not part of the backend business logic
ALTER TABLE Categories
    -- Make category names unique (case insensitive)
    ADD CONSTRAINT unique_category_name 
        UNIQUE (LOWER(category_name)),
        
    -- Normalize category name (no leading/trailing spaces)
    ADD CONSTRAINT check_category_name 
        CHECK (category_name = TRIM(category_name) AND LENGTH(category_name) > 0);
