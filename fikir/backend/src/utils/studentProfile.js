import { pool } from '../config/db.js';

export async function ensureStudentProfile(userId) {
  const existing = await pool.query('SELECT id FROM studentProfiles WHERE user_id = $1 LIMIT 1', [userId]);
  if (existing.rowCount > 0) {
    return;
  }
  await pool.query(
    `
      INSERT INTO studentProfiles (user_id, preferences, onboarding_status, diagnostic_results, initial_study_plan)
      VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb)
    `,
    [userId, JSON.stringify({}), 'pending', JSON.stringify({}), JSON.stringify({})]
  );
}
