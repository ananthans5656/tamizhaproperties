import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function fixImageUrl(url: string): string {
  if (!url) return url;
  // Replace any stored IP:port with current hostname:3000 (tamizha-api)
  try {
    const parsed = new URL(url);
    if (parsed.port === '3000') {
      parsed.hostname = window.location.hostname;
      return parsed.toString();
    }
  } catch (_) {}
  return url;
}

export default function PublicPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/public/properties/${id}`)
      .then(r => { setProperty(r.data); setLoading(false); })
      .catch(() => { setError('Property not found.'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#aaa', marginTop: 16 }}>Loading property...</p>
    </div>
  );

  if (error || !property) return (
    <div style={styles.center}>
      <div style={{ fontSize: 48 }}>🏚️</div>
      <p style={{ color: '#aaa', marginTop: 12 }}>Property not found or unavailable.</p>
    </div>
  );

  const images: string[] = (property.images || []).map(fixImageUrl);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <img src="/logo.png" alt="logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          <div>
            <div style={styles.logoName}>Tamizha Properties</div>
            <div style={styles.logoSub}>Premium Real Estate</div>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {/* Image */}
        {images.length > 0 ? (
          <img src={images[0]} alt={property.title} style={styles.image} />
        ) : (
          <div style={styles.imagePlaceholder}>🏡</div>
        )}

        {/* Title & Status */}
        <div style={styles.card}>
          <div style={styles.statusBadge}>{property.status || 'For Sale'}</div>
          <h1 style={styles.title}>{property.title}</h1>
          <div style={styles.location}>📍 {property.location}{property.district ? `, ${property.district}` : ''}</div>

          {/* Price & Size */}
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>Price</div>
              <div style={styles.statValue}>
                {property.priceLabel || (property.price ? `₹${Number(property.price).toLocaleString('en-IN')}` : '—')}
              </div>
            </div>
            {property.sqft && (
              <div style={styles.stat}>
                <div style={styles.statLabel}>Area</div>
                <div style={styles.statValue}>{Number(property.sqft).toLocaleString()} sq.ft</div>
              </div>
            )}
            {property.ground && (
              <div style={styles.stat}>
                <div style={styles.statLabel}>Grounds</div>
                <div style={styles.statValue}>{property.ground}</div>
              </div>
            )}
            {property.plotType && (
              <div style={styles.stat}>
                <div style={styles.statLabel}>Type</div>
                <div style={styles.statValue}>{property.plotType}</div>
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>About this property</div>
              <p style={styles.description}>{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Amenities</div>
              <div style={styles.amenitiesGrid}>
                {property.amenities.map((a: any, i: number) => (
                  <div key={i} style={styles.amenityItem}>
                    <span>{a.emoji || '✅'}</span>
                    <span>{a.label || a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open in App */}
          <div style={{ marginBottom: 16 }}>
            <a
              href={`tamizha://property/${id}`}
              style={{ display: 'block', background: '#C9A84C', color: '#fff', textAlign: 'center', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              📱 Open in Tamizha Properties App
            </a>
          </div>

          {/* CTA */}
          <div style={styles.cta}>
            <div style={styles.ctaText}>Interested? Contact us today!</div>
            <a href="tel:+919999999999" style={styles.ctaBtn}>📞 Call Now</a>
            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" style={{ ...styles.ctaBtn, background: '#25D366' }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div style={styles.footer}>© 2025 Tamizha Properties. All rights reserved.</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d1117', fontFamily: 'system-ui, sans-serif' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1117' },
  spinner: { width: 40, height: 40, border: '3px solid #333', borderTop: '3px solid #e2c36d', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { background: '#161b22', borderBottom: '1px solid #30363d', padding: '12px 24px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, maxWidth: 800, margin: '0 auto' },
  logoName: { color: '#e2c36d', fontWeight: 700, fontSize: 15 },
  logoSub: { color: '#888', fontSize: 11 },
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  image: { width: '100%', height: 280, objectFit: 'cover', borderRadius: 12, marginBottom: 20 },
  imagePlaceholder: { width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, background: '#1c2128', borderRadius: 12, marginBottom: 20 },
  card: { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24 },
  statusBadge: { display: 'inline-block', background: '#e2c36d22', color: '#e2c36d', border: '1px solid #e2c36d44', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, marginBottom: 10 },
  title: { color: '#f0f6fc', fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  location: { color: '#8b949e', fontSize: 14, marginBottom: 20 },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  stat: { background: '#0d1117', borderRadius: 8, padding: '10px 16px', minWidth: 100 },
  statLabel: { color: '#8b949e', fontSize: 11, marginBottom: 4 },
  statValue: { color: '#e2c36d', fontSize: 15, fontWeight: 700 },
  section: { borderTop: '1px solid #30363d', paddingTop: 16, marginTop: 16 },
  sectionTitle: { color: '#f0f6fc', fontWeight: 600, marginBottom: 10, fontSize: 14 },
  description: { color: '#8b949e', fontSize: 14, lineHeight: 1.7, margin: 0 },
  amenitiesGrid: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  amenityItem: { background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '6px 12px', color: '#c9d1d9', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' },
  cta: { borderTop: '1px solid #30363d', paddingTop: 20, marginTop: 20, textAlign: 'center' },
  ctaText: { color: '#f0f6fc', fontWeight: 600, marginBottom: 14, fontSize: 15 },
  ctaBtn: { display: 'inline-block', background: '#e2c36d', color: '#0d1117', fontWeight: 700, padding: '10px 24px', borderRadius: 8, textDecoration: 'none', margin: '0 6px', fontSize: 14 },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, padding: '20px', borderTop: '1px solid #1c2128' },
};
