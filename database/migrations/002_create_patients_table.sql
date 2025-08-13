CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    date_of_birth DATE,
    emergency_contact JSONB,
    insurance_info JSONB,
    family_members UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);