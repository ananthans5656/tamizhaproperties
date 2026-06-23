const pool = require('../db');

exports.getStats = async (req, res) => {
  try {
    const [leads, properties, visits, users] = await Promise.all([
      pool.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status'),
      pool.query('SELECT status, COUNT(*) as count FROM properties GROUP BY status'),
      pool.query("SELECT COUNT(*) as count FROM site_visits WHERE status='scheduled'"),
      pool.query('SELECT COUNT(*) as count FROM users'),
    ]);

    const leadStats = { HOT: 0, WARM: 0, NEW: 0, CLOSED: 0, total: 0 };
    leads.rows.forEach(r => {
      leadStats[r.status?.toUpperCase()] = parseInt(r.count);
      leadStats.total += parseInt(r.count);
    });

    const propStats = { available: 0, sold: 0, pending: 0, total: 0 };
    properties.rows.forEach(r => {
      propStats[r.status?.toLowerCase()] = parseInt(r.count);
      propStats.total += parseInt(r.count);
    });

    res.json({
      leads: leadStats,
      properties: propStats,
      pendingVisits: parseInt(visits.rows[0]?.count || 0),
      totalUsers: parseInt(users.rows[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
