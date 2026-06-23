const pool = require('../db');

function buildPriceLabel(price) {
  const p = parseFloat(price);
  if (!p) return null;
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
  return `₹${p.toLocaleString('en-IN')}`;
}

function mapRow(r) {
  return {
    ...r,
    price: parseFloat(r.price) || 0,
    priceLabel: r.price_label || buildPriceLabel(r.price),
    sqft: r.sqft ? parseInt(r.sqft) : null,
    ground: r.ground ? parseFloat(r.ground) : null,
    district: r.district || null,
    imgType: r.img_type || null,
    plotType: r.plot_type || null,
    isFeatured: r.is_featured || false,
    isReraVerified: r.is_rera_verified || false,
    videoUrl: r.video_url || null,
    documents: r.documents || [],
    amenities: r.amenities || [],
    nearby: r.nearby || [],
    offerCode: r.offer_code || null,
    bankOffer: r.bank_offer || null,
    partnerOffer: r.partner_offer || null,
    viewsCount: r.views_count || 0,
    leadsCount: r.leads_count || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at || r.created_at,
  };
}

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { district, status, minPrice, maxPrice, minGround, maxGround, search } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (district) { conditions.push(`district = $${idx++}`); params.push(district); }
    if (status) { conditions.push(`LOWER(status) = LOWER($${idx++})`); params.push(status); }
    if (minPrice) { conditions.push(`price >= $${idx++}`); params.push(minPrice); }
    if (maxPrice) { conditions.push(`price <= $${idx++}`); params.push(maxPrice); }
    if (minGround) { conditions.push(`ground >= $${idx++}`); params.push(minGround); }
    if (maxGround) { conditions.push(`ground <= $${idx++}`); params.push(maxGround); }
    if (search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(location) LIKE $${idx} OR LOWER(district) LIKE $${idx})`);
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM properties ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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

exports.getFeatured = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM properties WHERE is_featured = true ORDER BY created_at DESC LIMIT 20`
    );
    res.json(result.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { district, status } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (district) { conditions.push(`district = $${idx++}`); params.push(district); }
    if (status) { conditions.push(`LOWER(status) = LOWER($${idx++})`); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totalRes, statusRes, districtRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM properties ${where}`, params),
      pool.query(`SELECT status, COUNT(*) as count FROM properties ${where} GROUP BY status`, params),
      pool.query(`SELECT district, COUNT(*) as count FROM properties ${where} WHERE district IS NOT NULL GROUP BY district ORDER BY count DESC`, params),
    ]);

    res.json({
      total: parseInt(totalRes.rows[0].count),
      statusStats: statusRes.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
      districtStats: districtRes.rows.map(r => ({ district: r.district, count: parseInt(r.count) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Property not found' });
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const b = req.body;
  const title = b.title;
  const description = b.description;
  const price = b.price;
  const location = b.location;
  const type = b.type;
  const status = b.status;
  const images = b.images;
  const district = b.district;
  const sqft = b.sqft;
  const ground = b.ground;
  const price_label = b.price_label || b.priceLabel;
  const img_type = b.img_type || b.imgType;
  const plot_type = b.plot_type || b.plotType;
  const is_featured = b.is_featured ?? b.isFeatured ?? false;
  const is_rera_verified = b.is_rera_verified ?? b.isReraVerified ?? false;
  const video_url = b.video_url || b.videoUrl;
  const documents = b.documents;
  const amenities = b.amenities;
  const nearby = b.nearby;
  const offer_code = b.offer_code || b.offerCode;
  const bank_offer = b.bank_offer || b.bankOffer;
  const partner_offer = b.partner_offer || b.partnerOffer;
  try {
    const result = await pool.query(
      `INSERT INTO properties (
        title, description, price, location, type, status, images,
        district, sqft, ground, price_label, img_type, plot_type,
        is_featured, is_rera_verified, video_url, documents, amenities, nearby,
        offer_code, bank_offer, partner_offer, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23
      ) RETURNING *`,
      [
        title, description, price, location, type, status || 'Draft', images || [],
        district, sqft, ground, price_label, img_type, plot_type,
        is_featured, is_rera_verified, video_url,
        JSON.stringify(documents || []), JSON.stringify(amenities || []), JSON.stringify(nearby || []),
        offer_code, bank_offer, partner_offer, req.user.id,
      ]
    );
    res.status(201).json(mapRow(result.rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const b = req.body;
  try {
    const fieldMap = {
      title: b.title, description: b.description, price: b.price,
      location: b.location, type: b.type, status: b.status, images: b.images,
      district: b.district, sqft: b.sqft, ground: b.ground,
      price_label: b.price_label ?? b.priceLabel,
      img_type: b.img_type ?? b.imgType,
      plot_type: b.plot_type ?? b.plotType,
      is_featured: b.is_featured ?? b.isFeatured,
      is_rera_verified: b.is_rera_verified ?? b.isReraVerified,
      video_url: b.video_url ?? b.videoUrl,
      offer_code: b.offer_code ?? b.offerCode,
      bank_offer: b.bank_offer ?? b.bankOffer,
      partner_offer: b.partner_offer ?? b.partnerOffer,
    };
    const jsonFields = {
      documents: b.documents, amenities: b.amenities, nearby: b.nearby,
    };

    const setClauses = [];
    const params = [];
    let idx = 1;
    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined) { setClauses.push(`${col}=$${idx++}`); params.push(val); }
    }
    for (const [col, val] of Object.entries(jsonFields)) {
      if (val !== undefined) { setClauses.push(`${col}=$${idx++}`); params.push(JSON.stringify(val)); }
    }
    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
    setClauses.push('updated_at=NOW()');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE properties SET ${setClauses.join(', ')} WHERE id=$${idx} RETURNING *`,
      params
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Property not found' });
    res.json(mapRow(result.rows[0]));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM properties WHERE id=$1', [req.params.id]);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
