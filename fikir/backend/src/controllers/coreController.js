import { pool } from '../config/db.js';

export async function getSubjects(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, euee_weightage FROM subjects ORDER BY id ASC`
    );
    return res.json({
      success: true,
      subjects: result.rows,
    });
  } catch (err) {
    console.error('getSubjects:', err);
    return res.status(500).json({ success: false, error: 'Failed to load subjects.' });
  }
}
