-- =============================================================================
--  SOS Mulher — Schema de Referência (PostgreSQL / MySQL)
--  Execute este arquivo manualmente no seu banco ANTES de iniciar o backend.
--
--  PostgreSQL:
--    psql -U postgres -d sos_mulher -f schema.sql
--
--  MySQL:
--    mysql -u root -p sos_mulher < schema.sql
--    (substitua BOOLEAN por TINYINT(1) e SERIAL por BIGINT AUTO_INCREMENT)
--
--  H2 (em memória):
--    Não é necessário — o backend/src/main/resources/schema.sql é lido
--    automaticamente pelo Spring Boot ao iniciar.
-- =============================================================================

-- ── Usuárias ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    phone                VARCHAR(50)  NOT NULL,
    email                VARCHAR(255),
    cpf                  VARCHAR(20)  UNIQUE,
    gender               VARCHAR(50),
    password_hash        VARCHAR(255),
    onboarding_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Contatos de emergência ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    phone        VARCHAR(50)  NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Posts da comunidade ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name  VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Configurações por usuária ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gps_enabled           BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    camera_mic_enabled    BOOLEAN DEFAULT FALSE,
    discrete_mode         BOOLEAN DEFAULT FALSE,
    biometrics_enabled    BOOLEAN DEFAULT FALSE,
    coercion_code         VARCHAR(20),
    sos_timer             VARCHAR(10) DEFAULT '1500',
    photo_url             VARCHAR(500),
    high_contrast         BOOLEAN DEFAULT FALSE,
    large_text            BOOLEAN DEFAULT FALSE,
    reduce_motion         BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Alertas SOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    status         VARCHAR(50)  NOT NULL DEFAULT 'pending',
    timer_duration INTEGER      NOT NULL DEFAULT 30,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Notificações de alerta ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_notifications (
    id             SERIAL PRIMARY KEY,
    alert_id       INTEGER     NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    contact_id     INTEGER     NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
    channel        VARCHAR(50) NOT NULL,
    response_digit VARCHAR(5),
    sent_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);
