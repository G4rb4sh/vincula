-- Añadir campos de consentimiento para grabación y livestreaming
ALTER TABLE users ADD COLUMN IF NOT EXISTS recording_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS livestream_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMP;

-- Añadir comentarios para documentación
COMMENT ON COLUMN users.recording_consent IS 'Consentimiento del usuario para grabación automática de llamadas';
COMMENT ON COLUMN users.livestream_consent IS 'Consentimiento del usuario para que sus llamadas puedan ser vistas en vivo';
COMMENT ON COLUMN users.consent_accepted_at IS 'Fecha y hora cuando el usuario aceptó los términos de consentimiento';

-- Añadir campos para gestión de relaciones familiares (necesario para permisos de visualización)
CREATE TABLE IF NOT EXISTS family_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- 'parent', 'child', 'spouse', 'sibling', 'other'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, family_member_id)
);

-- Añadir índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_family_relationships_patient ON family_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_family_member ON family_relationships(family_member_id);

-- Añadir campo para almacenar información de grabaciones en la tabla de llamadas
ALTER TABLE calls ADD COLUMN IF NOT EXISTS is_recording BOOLEAN DEFAULT FALSE;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS is_livestreaming BOOLEAN DEFAULT FALSE;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_started_at TIMESTAMP;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS egress_id VARCHAR(255); -- ID de LiveKit Egress para la grabación

-- Crear tabla para almacenar múltiples grabaciones por llamada
CREATE TABLE IF NOT EXISTS call_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    recording_url VARCHAR(500),
    recording_size_bytes BIGINT,
    duration_seconds INTEGER,
    storage_type VARCHAR(20) DEFAULT 'local', -- 'local' o 's3'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'recording', 'completed', 'failed'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_recordings_call ON call_recordings(call_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status);

