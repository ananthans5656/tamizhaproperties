const pool = require('../db');
const nodemailer = require('nodemailer');

// Zoho Mail transporter
const mailer = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

async function sendAdminNotification(leadName, leadEmail, messageText) {
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) return;
  try {
    await mailer.sendMail({
      from: `"Tamizha Properties" <${process.env.ZOHO_EMAIL}>`,
      to: process.env.ZOHO_EMAIL,
      subject: `New Message from ${leadName || leadEmail || 'User'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#1A56DB;margin-bottom:8px;">New Support Message</h2>
          <p style="color:#64748B;margin-bottom:20px;">A user has sent a message via Tamizha Properties app.</p>
          <div style="background:#F8FAFC;border-left:4px solid #1A56DB;padding:16px;border-radius:8px;margin-bottom:20px;">
            <p style="margin:0;font-size:16px;color:#1E293B;">"${messageText}"</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748B;font-size:13px;">Name</td><td style="padding:8px 0;font-weight:600;color:#1E293B;">${leadName || 'Unknown'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:13px;">Email</td><td style="padding:8px 0;color:#1E293B;">${leadEmail || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:13px;">Time</td><td style="padding:8px 0;color:#1E293B;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#94A3B8;">Login to admin panel to reply → <a href="http://localhost:3002" style="color:#1A56DB;">Tamizha Admin</a></p>
        </div>
      `,
    });
    console.log(`Email notification sent for message from ${leadName || leadEmail}`);
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
}

exports.getByLead = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE lead_id=$1 ORDER BY created_at ASC',
      [req.params.leadId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.send = async (req, res) => {
  const { text, sender } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (lead_id, text, sender) VALUES ($1,$2,$3) RETURNING *',
      [req.params.leadId, text, sender || 'admin']
    );
    res.status(201).json(result.rows[0]);

    // Create admin notification + email when user sends a message
    if ((sender || 'admin') === 'client') {
      pool.query('SELECT name, email, property_interest FROM leads WHERE id=$1', [req.params.leadId])
        .then(async lr => {
          const lead = lr.rows[0] || {};
          try {
            await pool.query(
              `INSERT INTO notifications (type, target_role, lead_id, title, message)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                'new_enquiry',
                'admin',
                req.params.leadId,
                `💬 New Message`,
                `${lead.name || 'User'} sent a message about ${lead.property_interest || 'a property'}`,
              ]
            );
          } catch (_) {}
          sendAdminNotification(lead.name, lead.email, text);
        })
        .catch(() => {});
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id=$1 AND lead_id=$2', [req.params.msgId, req.params.leadId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE lead_id=$1', [req.params.leadId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
