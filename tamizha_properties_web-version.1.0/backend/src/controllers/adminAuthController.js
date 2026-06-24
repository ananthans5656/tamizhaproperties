const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admins WHERE email=$1', [email]);
    const admin = result.rows[0];
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign(
      { id: admin.id, role: 'admin', table: 'admins' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminRegister = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admins (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
