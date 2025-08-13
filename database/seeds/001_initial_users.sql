-- Insertar usuarios iniciales para pruebas
-- Las contraseñas están hasheadas con bcrypt (contraseña: "123456")

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES 
(
    uuid_generate_v4(),
    'patient@vincula.com',
    '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Juan',
    'Pérez',
    'patient',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'doctor@vincula.com',
    '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Ana',
    'García',
    'employee',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'family@vincula.com',
    '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'María',
    'López',
    'family',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'admin@vincula.com',
    '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Carlos',
    'Administrador',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Mostrar información de los usuarios creados
SELECT email, first_name, last_name, role FROM users;