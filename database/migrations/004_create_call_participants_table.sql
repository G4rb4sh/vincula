CREATE TABLE call_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    participant_type VARCHAR(20) CHECK (participant_type IN ('patient', 'employee', 'observer')),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    is_silent_observer BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);