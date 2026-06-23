const pool = require('../db');

function mapRow(r) {
  return {
    ...r,
    propertyInterest: r.property_interest || r.propertyinterest || null,
    propertyId: r.property_id || null,
    nativePlace: r.native_place || null,
    assignedAgent: r.assigned_to || null,
    loginUserId: r.login_user_id || null,
    lastContact: r.last_contact || null,
    followUpDate: r.follow_up_date || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { status, source, search, propertyId } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`LOWER(status) = LOWER($${idx++})`); params.push(status); }
    if (source) { conditions.push(`source = $${idx++}`); params.push(source); }
    if (propertyId) { conditions.push(`property_id = $${idx++}`); params.push(propertyId); }
    if (search) {
      conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR phone LIKE $${idx})`);
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM leads ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows.map(mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [statusRes, sourceRes] = await Promise.all([
      pool.query(`SELECT LOWER(status) as status, COUNT(*) as count FROM leads GROUP BY LOWER(status)`),
      pool.query(`SELECT source, COUNT(*) as count FROM leads WHERE source IS NOT NULL GROUP BY source ORDER BY count DESC`),
    ]);

    const statusMap = {};
    statusRes.rows.forEach(r => { statusMap[r.status] = parseInt(r.count); });

    res.json({
      hot: statusMap['hot'] || 0,
      warm: statusMap['warm'] || 0,
      new: statusMap['new'] || 0,
      contacted: statusMap['contacted'] || 0,
      closed: statusMap['closed'] || 0,
      lost: statusMap['lost'] || 0,
      total: statusRes.rows.reduce((acc, r) => acc + parseInt(r.count), 0),
      sourceBreakdown: sourceRes.rows.map(r => ({ source: r.source, count: parseInt(r.count) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE login_user_id=$1 LIMIT 1', [req.params.userId]);
    res.json(result.rows[0] ? mapRow(result.rows[0]) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const b = req.body;
  const name = b.name;
  const email = b.email;
  const phone = b.phone;
  const source = b.source;
  const status = b.status;
  const religion = b.religion;
  const notes = b.notes;
  const assigned_to = b.assigned_to || b.assignedTo;
  const city = b.city;
  const native_place = b.native_place || b.nativePlace;
  const property_interest = b.property_interest || b.propertyInterest;
  const property_id = b.property_id || b.propertyId;
  try {
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, source, status, religion, notes, assigned_to,
        city, native_place, property_interest, property_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, email, phone, source, status || 'new', religion, notes, assigned_to,
       city, native_place, property_interest, property_id]
    );
    const newLead = result.rows[0];
    res.status(201).json(mapRow(newLead));
    // Notify admin when user app enquires
    if (source === 'User App Enquiry' || source === 'User App Chat') {
      pool.query(
        `INSERT INTO notifications (type, target_role, lead_id, title, message) VALUES ($1,$2,$3,$4,$5)`,
        ['new_enquiry', 'admin', newLead.id, '🏠 New Enquiry', `${name || 'User'} enquired about ${property_interest || 'a property'}`]
      ).catch(() => {});
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const b = req.body;
  try {
    // Partial update — only set fields that are provided
    const fieldMap = {
      name: b.name, email: b.email, phone: b.phone,
      source: b.source, status: b.status, religion: b.religion,
      notes: b.notes, assigned_to: b.assigned_to ?? b.assignedTo,
      city: b.city,
      native_place: b.native_place ?? b.nativePlace,
      property_interest: b.property_interest ?? b.propertyInterest,
      property_id: b.property_id ?? b.propertyId,
      last_contact: b.last_contact ?? b.lastContact,
      follow_up_date: b.follow_up_date ?? b.followUpDate,
    };

    const setClauses = [];
    const params = [];
    let idx = 1;
    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        setClauses.push(`${col}=$${idx++}`);
        params.push(val);
      }
    }
    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
    setClauses.push('updated_at=NOW()');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE leads SET ${setClauses.join(', ')} WHERE id=$${idx} RETURNING *`,
      params
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM messages WHERE lead_id=$1', [req.params.id]);
    await client.query('DELETE FROM site_visits WHERE lead_id=$1', [req.params.id]);
    await client.query('DELETE FROM leads WHERE id=$1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.assignLogin = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    let userId;
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
    } else {
      const hash = await bcrypt.hash(password, 10);
      const newUser = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         SELECT name, $1, $2, 'user' FROM leads WHERE id=$3 RETURNING id`,
        [email, hash, req.params.leadId]
      );
      userId = newUser.rows[0]?.id;
    }
    if (userId) {
      await pool.query('UPDATE leads SET login_user_id=$1 WHERE id=$2', [userId, req.params.leadId]);
    }
    res.json({ message: 'Login assigned', userId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
