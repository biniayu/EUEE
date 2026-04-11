import { pool } from '../config/db.js';

function mapRow(r) {
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    type: r.type,
    isRead: Boolean(r.read_flag),
    createdAt: r.created_at,
  };
}

export async function listNotifications(req, res) {
  const userId = req.user.sub;
  try {
    if (req.query.lite === '1' || req.query.lite === 'true') {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND read = FALSE`,
        [userId]
      );
      return res.json({ success: true, unreadCount: rows[0]?.c ?? 0 });
    }

    let limit = Number(req.query.limit);
    if (!Number.isFinite(limit) || limit < 1) limit = 40;
    limit = Math.min(100, Math.floor(limit));

    const { rows } = await pool.query(
      `
        SELECT id, title, message, type, read AS read_flag, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY read ASC, created_at DESC
        LIMIT $2
      `,
      [userId, limit]
    );

    const { rows: uc } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    return res.json({
      success: true,
      unreadCount: uc[0]?.c ?? 0,
      notifications: rows.map(mapRow),
    });
  } catch (err) {
    console.error('listNotifications:', err);
    return res.status(500).json({ success: false, error: 'Failed to load notifications.' });
  }
}

export async function markNotificationRead(req, res) {
  const userId = req.user.sub;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, error: 'Invalid notification id.' });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 AND read = FALSE`,
      [id, userId]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, error: 'Notification not found or already read.' });
    }
    return res.json({ success: true, id });
  } catch (err) {
    console.error('markNotificationRead:', err);
    return res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
}

export async function markAllNotificationsRead(req, res) {
  const userId = req.user.sub;
  try {
    await pool.query(`UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE`, [userId]);
    return res.json({ success: true });
  } catch (err) {
    console.error('markAllNotificationsRead:', err);
    return res.status(500).json({ success: false, error: 'Failed to mark all read.' });
  }
}
