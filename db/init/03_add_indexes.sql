-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_users_first_name ON Users(first_name);
CREATE INDEX idx_users_last_name ON Users(last_name);
CREATE INDEX idx_users_full_name ON Users(first_name, last_name);
CREATE INDEX idx_users_created_at ON Users(created_at DESC);


-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_categories_name ON Categories(category_name);


-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_events_user_id ON Events(user_id);
CREATE INDEX idx_events_category_id ON Events(category_id);
CREATE INDEX idx_events_name ON Events(event_name);
CREATE INDEX idx_events_datetime ON Events(event_datetime);
CREATE INDEX idx_events_endtime ON Events(event_endtime);
CREATE INDEX idx_events_datetime_range ON Events(event_datetime, event_endtime);
CREATE INDEX idx_events_location ON Events(event_location);
CREATE INDEX idx_events_created_at ON Events(created_at DESC);
CREATE INDEX idx_events_user_datetime ON Events(user_id, event_datetime DESC);
CREATE INDEX idx_events_category_datetime ON Events(category_id, event_datetime DESC);


-- ============================================================================
-- EVENTATTENDEES TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_eventattendees_event_id ON EventAttendees(event_id);
CREATE INDEX idx_eventattendees_user_id ON EventAttendees(user_id);
CREATE INDEX idx_eventattendees_status ON EventAttendees(status);
CREATE INDEX idx_eventattendees_event_status ON EventAttendees(event_id, status);
CREATE INDEX idx_eventattendees_user_status ON EventAttendees(user_id, status);
CREATE INDEX idx_eventattendees_created_at ON EventAttendees(created_at DESC);
CREATE UNIQUE INDEX idx_eventattendees_event_user_unique ON EventAttendees(event_id, user_id);


-- ============================================================================
-- INVITATIONS TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_invitations_event_id ON Invitations(event_id);
CREATE INDEX idx_invitations_user_id ON Invitations(user_id);
CREATE INDEX idx_invitations_status ON Invitations(status);
CREATE INDEX idx_invitations_expires_at ON Invitations(expires_at);
CREATE INDEX idx_invitations_created_at ON Invitations(created_at DESC);
CREATE INDEX idx_invitations_event_status ON Invitations(event_id, status);
CREATE INDEX idx_invitations_user_status ON Invitations(user_id, status);
CREATE INDEX idx_invitations_status_expires ON Invitations(status, expires_at) WHERE status = 'Active';


-- ============================================================================
-- PAYMENTS TABLE INDEXES
-- ============================================================================

CREATE INDEX idx_payments_event_id ON Payments(event_id);
CREATE INDEX idx_payments_user_id ON Payments(user_id);
CREATE INDEX idx_payments_status ON Payments(status);
CREATE INDEX idx_payments_stripe_session_id ON Payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_stripe_intent_id ON Payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON Payments(created_at DESC);
CREATE INDEX idx_payments_event_status ON Payments(event_id, status);
CREATE INDEX idx_payments_user_status ON Payments(user_id, status);
CREATE INDEX idx_payments_succeeded_created ON Payments(created_at DESC) WHERE status = 'succeeded';
