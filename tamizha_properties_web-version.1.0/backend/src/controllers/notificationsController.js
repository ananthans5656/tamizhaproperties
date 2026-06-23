const pool = require('../db');

exports.getForAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, sv.visit_date, sv.status as visit_status, sv.notes as visit_notes,
             l.name as lead_name, l.phone as lead_phone, l.property_interest as lead_property_interest,
             p.title as property_title, p.location as property_location
      FROM notifications n
      LEFT JOIN site_visits sv ON n.visit_id = sv.id
      LEFT JOIN leads l ON n.lead_id = l.id
      LEFT JOIN properties p ON sv.property_id = p.id
      WHERE n.target_role = 'admin'
      ORDER BY n.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getForUser = async (req, res) => {
  try {
    const { lead_id } = req.query;
    if (!lead_id) return res.json([]);
    const result = await pool.query(`
      SELECT n.*, sv.visit_date, sv.status as visit_status,
             p.title as property_title, p.location as property_location
      FROM notifications n
      LEFT JOIN site_visits sv ON n.visit_id = sv.id
      LEFT JOIN properties p ON sv.property_id = p.id
      WHERE n.target_role = 'user' AND n.lead_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [lead_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const { role, lead_id } = req.body;
    if (role === 'admin') {
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE target_role = 'admin'");
    } else if (lead_id) {
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE target_role = 'user' AND lead_id = $1", [lead_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotifs = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No ids provided' });
    await pool.query(`DELETE FROM notifications WHERE id = ANY($1::uuid[])`, [ids]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptVisit = async (req, res) => {
  const { visitId } = req.params;
  try {
    const visit = await pool.query('SELECT * FROM site_visits WHERE id = $1', [visitId]);
    if (!visit.rows[0]) return res.status(404).json({ error: 'Visit not found' });

    await pool.query(
      "UPDATE site_visits SET status = 'Confirmed' WHERE id = $1",
      [visitId]
    );

    const v = visit.rows[0];
    const prop = await pool.query('SELECT title FROM properties WHERE id = $1', [v.property_id]);
    const propTitle = prop.rows[0]?.title || 'Property';
    const lead = await pool.query('SELECT name FROM leads WHERE id = $1', [v.lead_id]);
    const leadName = lead.rows[0]?.name || 'Client';

    const visitDate = v.visit_date ? new Date(v.visit_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

    await pool.query(
      `INSERT INTO notifications (type, target_role, lead_id, visit_id, title, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'visit_confirmed',
        'user',
        v.lead_id,
        visitId,
        '✅ Site Visit Confirmed',
        `Your visit to ${propTitle} on ${visitDate} has been confirmed by Admin.`,
      ]
    );

    await pool.query("UPDATE notifications SET is_read = TRUE WHERE visit_id = $1 AND type = 'reschedule_request'", [visitId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.denyVisit = async (req, res) => {
  const { visitId } = req.params;
  const { reason } = req.body;
  try {
    const visit = await pool.query('SELECT * FROM site_visits WHERE id = $1', [visitId]);
    if (!visit.rows[0]) return res.status(404).json({ error: 'Visit not found' });

    await pool.query(
      "UPDATE site_visits SET status = 'Tentative', notes = $1 WHERE id = $2",
      [`Denied by admin: ${reason || 'No reason given'}`, visitId]
    );

    const v = visit.rows[0];
    const prop = await pool.query('SELECT title FROM properties WHERE id = $1', [v.property_id]);
    const propTitle = prop.rows[0]?.title || 'Property';

    await pool.query(
      `INSERT INTO notifications (type, target_role, lead_id, visit_id, title, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'visit_denied',
        'user',
        v.lead_id,
        visitId,
        '❌ Site Visit Not Confirmed',
        `Your reschedule request for ${propTitle} was not accepted. Reason: ${reason || 'No reason given'}`,
      ]
    );

    await pool.query("UPDATE notifications SET is_read = TRUE WHERE visit_id = $1 AND type = 'reschedule_request'", [visitId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
