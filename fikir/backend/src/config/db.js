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
