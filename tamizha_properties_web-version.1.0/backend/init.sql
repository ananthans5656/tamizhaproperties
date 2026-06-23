-- Tamizha Properties — Database Schema
-- Run automatically by PostgreSQL when the db container starts fresh.
-- All statements use IF NOT EXISTS so re-runs are safe and existing data is preserved.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255),
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20),
  password_hash TEXT,
  role          VARCHAR(50) DEFAULT 'user',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Default admin account (password: Admin@123)
-- bcrypt hash for "Admin@123" with 10 rounds
INSERT INTO users (name, email, phone, password_hash, role)
SELECT 'Admin', 'admin@tamizhaproperties.com', '9999999999',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@tamizhaproperties.com');

-- ─── properties ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(500),
  description       TEXT,
  price             NUMERIC(15,2),
  location          TEXT,
  type              VARCHAR(100),
  status            VARCHAR(50) DEFAULT 'Draft',
  images            TEXT[],
  district          VARCHAR(100),
  sqft              INTEGER,
  ground            NUMERIC(10,4),
  price_label       VARCHAR(50),
  img_type          VARCHAR(50),
  plot_type         VARCHAR(100),
  is_featured       BOOLEAN DEFAULT FALSE,
  is_rera_verified  BOOLEAN DEFAULT FALSE,
  video_url         TEXT,
  documents         JSONB DEFAULT '[]',
  amenities         JSONB DEFAULT '[]',
  nearby            JSONB DEFAULT '[]',
  offer_code        TEXT,
  bank_offer        TEXT,
  partner_offer     TEXT,
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  views_count       INTEGER DEFAULT 0,
  leads_count       INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255),
  email             VARCHAR(255),
  phone             VARCHAR(20),
  source            VARCHAR(100),
  status            VARCHAR(50) DEFAULT 'new',
  religion          VARCHAR(100),
  notes             TEXT,
  assigned_to       VARCHAR(255),
  city              VARCHAR(100),
  native_place      VARCHAR(255),
  property_interest VARCHAR(255),
  property_id       INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  login_user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_contact      TIMESTAMPTZ,
  follow_up_date    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── site_visits ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_visits (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  visit_date  TIMESTAMPTZ,
  status      VARCHAR(50) DEFAULT 'scheduled',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  text       TEXT,
  sender     VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        VARCHAR(100),
  target_role VARCHAR(50),
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  visit_id    INTEGER REFERENCES site_visits(id) ON DELETE CASCADE,
  title       VARCHAR(500),
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
