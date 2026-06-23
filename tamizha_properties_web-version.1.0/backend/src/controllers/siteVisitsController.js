const pool = require('../db');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sv.*, l.name as lead_name, l.phone as lead_phone,
             p.title as property_title, p.location as property_location
      FROM site_visits sv
      LEFT JOIN leads l ON sv.lead_id = l.id
      LEFT JOIN properties p ON sv.property_id = p.id
      ORDER BY sv.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { lead_id, property_id, visit_date, status, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO site_visits (lead_id, property_id, visit_date, status, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [lead_id, property_id, visit_date, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { status, notes, visit_date, rescheduled_by_user } = req.body;
  try {
    const result = await pool.query(
      'UPDATE site_visits SET status=$1, notes=$2, visit_date=$3 WHERE id=$4 RETURNING *',
      [status, notes, visit_date, req.params.id]
    );
    const visit = result.rows[0];

    if (rescheduled_by_user && visit) {
      const prop = await pool.query('SELECT title FROM properties WHERE id = $1', [visit.property_id]);
      const propTitle = prop.rows[0]?.title || 'Property';
      const lead = await pool.query('SELECT name FROM leads WHERE id = $1', [visit.lead_id]);
      const leadName = lead.rows[0]?.name || 'Client';
      const newDate = visit_date ? new Date(visit_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

      await pool.query(
        `INSERT INTO notifications (type, target_role, lead_id, visit_id, title, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'reschedule_request',
          'admin',
          visit.lead_id,
          visit.id,
          `🔄 Reschedule Request`,
          `${leadName} wants to reschedule visit to ${propTitle} → ${newDate}`,
        ]
      );
    }

    res.json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM site_visits WHERE id=$1', [req.params.id]);
    res.json({ message: 'Site visit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
