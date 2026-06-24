require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pool = require('./src/db');

async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS district VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sqft INTEGER,
        ADD COLUMN IF NOT EXISTS ground DECIMAL(8,4),
        ADD COLUMN IF NOT EXISTS price_label VARCHAR(50),
        ADD COLUMN IF NOT EXISTS img_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS plot_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_rera_verified BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS video_url TEXT,
        ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS nearby JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS offer_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_offer TEXT,
        ADD COLUMN IF NOT EXISTS partner_offer TEXT,
        ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `);
    console.log('Migrations: properties table updated');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        target_role VARCHAR(10) NOT NULL,
        lead_id UUID,
        visit_id UUID,
        title VARCHAR(200),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS native_place VARCHAR(100),
        ADD COLUMN IF NOT EXISTS property_interest TEXT,
        ADD COLUMN IF NOT EXISTS property_id UUID,
        ADD COLUMN IF NOT EXISTS login_user_id UUID,
        ADD COLUMN IF NOT EXISTS last_contact TIMESTAMP,
        ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP
    `);
    console.log('Migrations: leads table updated');

    // Create admins table (separate from users — admin portal only)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255),
        email         VARCHAR(255) UNIQUE,
        password_hash TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Seed default admin if not exists
    await pool.query(`
      INSERT INTO admins (name, email, password_hash)
      SELECT 'Admin', 'info@tamizhaproperties.com',
             '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
      WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'info@tamizhaproperties.com')
    `);
    console.log('Migrations: admins table ready');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin/auth', require('./src/routes/adminAuth'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/otp', require('./src/routes/otp'));
app.use('/api/leads', require('./src/routes/leads'));
app.use('/api/properties', require('./src/routes/properties'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/site-visits', require('./src/routes/siteVisits'));
app.use('/api/notifications', require('./src/routes/notifications'));

const adminAuth = require('./src/middleware/adminAuth');

app.get('/api/dashboard', adminAuth, require('./src/controllers/dashboardController').getStats);

app.post('/api/upload', adminAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

const msg = require('./src/controllers/messagesController');
app.get('/api/leads/:leadId/messages', require('./src/middleware/auth'), msg.getByLead);
app.post('/api/leads/:leadId/messages', require('./src/middleware/auth'), msg.send);
app.delete('/api/leads/:leadId/messages', require('./src/middleware/auth'), msg.deleteAll);
app.delete('/api/leads/:leadId/messages/:msgId', require('./src/middleware/auth'), msg.deleteOne);

// Public property page — no auth required
app.get('/property/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).send('<h2>Property not found</h2>');
    const p = result.rows[0];
    const price = p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '';
    const area = p.ground ? `${p.ground} Grounds` : p.sqft ? `${p.sqft} sqft` : '';
    const images = (() => {
      const list = [];
      const host = `${req.protocol}://${req.get('host')}`;
      const fix = (u) => {
        if (!u) return null;
        if (u.startsWith('http')) return u.replace(/^http:\/\/[\d.]+:3000/, host);
        if (u.startsWith('/')) return `${host}${u}`;
        return null;
      };
      if (p.image) { const u = fix(p.image); if (u) list.push(u); }
      if (p.images) { try { const arr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; if (Array.isArray(arr)) arr.forEach(u => { const fu = fix(u); if (fu && !list.includes(fu)) list.push(fu); }); } catch (_) {} }
      if (p.gallery) { try { const arr = typeof p.gallery === 'string' ? JSON.parse(p.gallery) : p.gallery; if (Array.isArray(arr)) arr.forEach(u => { const fu = fix(u); if (fu && !list.includes(fu)) list.push(fu); }); } catch (_) {} }
      return list;
    })();
    const imgHtml = images.length > 0
      ? images.map((u, i) => `<img src="${u}" alt="Property image ${i+1}" onerror="this.style.display='none'" style="width:100%;max-height:320px;object-fit:cover;border-radius:${i===0?'16px 16px 0 0':'0'};display:block;" />`).join('')
      : `<div style="width:100%;height:220px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:center;font-size:64px;">🏡</div>`;
    const amenities = (() => { try { const a = typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities; return Array.isArray(a) ? a : []; } catch (_) { return []; } })();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${p.title || 'Property'} - Tamizha Properties</title>
<meta property="og:title" content="${p.title || 'Property'} - Tamizha Properties"/>
<meta property="og:description" content="${p.location || ''} ${price} ${area}"/>
${images[0] ? `<meta property="og:image" content="${images[0]}"/>` : ''}
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f2f5;color:#111;}
.card{max-width:480px;margin:0 auto;background:#fff;border-radius:0 0 20px 20px;box-shadow:0 4px 24px rgba(0,0,0,0.10);}
.imgs{border-radius:16px 16px 0 0;overflow:hidden;}
.body{padding:20px;}
.badge{display:inline-block;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;}
.badge.available{background:#dcfce7;color:#166534;}
.badge.sold{background:#fee2e2;color:#991b1b;}
h1{font-size:20px;font-weight:900;color:#111;margin-bottom:6px;line-height:1.3;}
.loc{font-size:14px;color:#64748b;margin-bottom:14px;}
.loc span{margin-right:4px;}
.stats{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.stat{flex:1;min-width:80px;background:#f8fafc;border-radius:12px;padding:12px;text-align:center;}
.stat-val{font-size:17px;font-weight:900;color:#0f172a;}
.stat-lbl{font-size:10px;color:#64748b;font-weight:700;margin-top:3px;text-transform:uppercase;}
.price-box{background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:14px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;}
.price-val{font-size:22px;font-weight:900;color:#C9A84C;}
.price-lbl{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;}
.section-title{font-size:12px;font-weight:900;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;}
.desc{font-size:14px;color:#374151;line-height:1.6;margin-bottom:16px;}
.amenities{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.chip{background:#f1f5f9;border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;color:#475569;}
.cta{display:flex;gap:10px;margin-top:4px;}
.btn{flex:1;padding:15px;border-radius:14px;font-size:15px;font-weight:900;text-align:center;text-decoration:none;display:block;}
.btn-call{background:#22c55e;color:#fff;}
.btn-wa{background:#25D366;color:#fff;}
.footer{text-align:center;padding:18px;font-size:11px;color:#94a3b8;font-weight:700;background:#f8fafc;border-radius:0 0 20px 20px;margin-top:4px;}
.logo{font-size:13px;font-weight:900;color:#C9A84C;letter-spacing:1px;}
</style>
</head>
<body>
<div class="card">
  <div class="imgs">${imgHtml}</div>
  <div class="body">
    <span class="badge ${(p.status||'').toLowerCase().includes('sold')?'sold':'available'}">${p.status||'Available'}</span>
    ${p.is_rera_verified ? '<span class="badge available" style="margin-left:6px;">✓ RERA Verified</span>' : ''}
    <h1>${p.title || 'Property'}</h1>
    <p class="loc"><span>📍</span>${[p.location, p.district].filter(Boolean).join(', ')}</p>
    <div class="price-box">
      <div><div class="price-lbl">Price</div><div class="price-val">${price || 'On Request'}</div></div>
      ${p.price_label ? `<div style="background:rgba(201,168,76,0.15);padding:6px 12px;border-radius:10px;font-size:12px;font-weight:800;color:#C9A84C;">${p.price_label}</div>` : ''}
    </div>
    ${area || p.plot_type ? `<div class="stats">
      ${area ? `<div class="stat"><div class="stat-val">${area}</div><div class="stat-lbl">Area</div></div>` : ''}
      ${p.plot_type ? `<div class="stat"><div class="stat-val">${p.plot_type}</div><div class="stat-lbl">Type</div></div>` : ''}
      ${p.district ? `<div class="stat"><div class="stat-val">${p.district}</div><div class="stat-lbl">District</div></div>` : ''}
    </div>` : ''}
    ${p.description ? `<div class="section-title">About</div><p class="desc">${p.description}</p>` : ''}
    ${amenities.length > 0 ? `<div class="section-title">Amenities</div><div class="amenities">${amenities.map(a => `<span class="chip">✓ ${a}</span>`).join('')}</div>` : ''}
    <div class="cta">
      <a href="tel:+919361777733" class="btn btn-call">📞 Call Us</a>
      <a href="https://wa.me/919361777733?text=Hi, I'm interested in ${encodeURIComponent(p.title||'this property')} at ${encodeURIComponent(p.location||'')}" class="btn btn-wa">💬 WhatsApp</a>
    </div>
  </div>
  <div class="footer"><div class="logo">🏡 TAMIZHA PROPERTIES</div><div style="margin-top:4px;">Premium Real Estate · Coimbatore</div></div>
</div>
</body>
</html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send('<h3>Error loading property</h3>');
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'Connected to PostgreSQL' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Tamizha API running on port ${PORT}`);
  await runMigrations();
});
