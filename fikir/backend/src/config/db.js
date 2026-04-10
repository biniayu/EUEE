import pg from 'pg';

const { Pool } = pg;

function buildConfig() {
  const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
  if (dbUrl) {
    return {
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.DB_HOST || process.env.PG_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.PG_PORT) || 5432,
    database: process.env.DB_NAME || process.env.PG_DATABASE || 'postgres',
    user: process.env.DB_USER || process.env.PG_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || '',
  };
}

export const pool = new Pool(buildConfig());

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS gradeLevel VARCHAR(50),
      ADD COLUMN IF NOT EXISTS stream VARCHAR(100) DEFAULT 'Natural Science',
      ADD COLUMN IF NOT EXISTS targetUniversity VARCHAR(255),
      ADD COLUMN IF NOT EXISTS weakSubjects JSONB DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS studentProfiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preferences JSONB DEFAULT '{}'::jsonb,
      onboarding_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE studentProfiles
      ADD COLUMN IF NOT EXISTS diagnostic_results JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS initial_study_plan JSONB DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON studentProfiles(user_id);
  `);
}
