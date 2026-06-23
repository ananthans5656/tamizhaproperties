import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { propertiesApi, Property } from '../api/properties.api';
import { leadsApi, Lead } from '../api/leads.api';
import { I } from '../components/Icons';

// ─── Mini Status Badge ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'For Sale':   { bg: 'rgba(34,197,94,0.12)',  color: '#16A34A' },
    'Sold':       { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626' },
    'Premium':    { bg: 'rgba(226,195,109,0.15)', color: '#B45309' },
    'New Launch': { bg: 'rgba(59,130,246,0.12)', color: '#2563EB' },
    'Draft':      { bg: 'rgba(156,163,181,0.15)', color: '#6B7280' },
  };
  const s = map[status] || { bg: 'rgba(156,163,181,0.15)', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>{status}</span>
  );
}

// ─── Property Card ────────────────────────────────────────────────────────────
function PropertyCard({ p, onClick }: { p: Property; onClick: () => void }) {
  const img = p.images?.[0];
  const priceInCr = p.price ? (p.price / 100).toFixed(2) : '—';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: 'var(--sh-card)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-card)';
      }}
    >
      {/* Image */}
      <div style={{ height: 180, background: '#1F2433', position: 'relative', overflow: 'hidden' }}>
        {img ? (
          <img
            src={img.startsWith('http') ? img : img}
            alt={p.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#E2C36D', opacity: 0.3, fontSize: 40 }}>
            🏡
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <StatusBadge status={p.status} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: 'var(--ink)', lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          {I.pin} {p.location}, {p.district}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '-0.5px' }}>
              ₹{priceInCr} Cr
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
              {p.ground ? `${p.ground} Grounds` : ''}{p.sqft ? ` · ${p.sqft.toLocaleString()} sqft` : ''}
            </div>
          </div>
          {p.plotType && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px',
              borderRadius: 8, background: 'var(--bg)', color: 'var(--text-2)',
              border: '1px solid var(--border)', letterSpacing: '0.06em'
            }}>{p.plotType}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function LeadProfileSection({ leadData, authUser, onLogout }: {
  leadData: Lead | null;
  authUser: any;
  onLogout: () => void;
}) {
  const initials = (authUser?.name || 'L').split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 18,
      marginBottom: 28,
      boxShadow: 'var(--sh-card)',
      flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{
        width: 72, height: 72, borderRadius: 18, flexShrink: 0,
        background: 'linear-gradient(135deg, #E2C36D 0%, #C5A44E 100%)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700,
        color: '#0E1117',
        boxShadow: '0 4px 16px rgba(226,195,109,0.4)',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6, background: 'rgba(226,195,109,0.1)', border: '1px solid rgba(226,195,109,0.25)', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: '#B45309', letterSpacing: '0.1em' }}>
          🎯 LEAD ACCOUNT
        </div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
          {authUser?.name || leadData?.name || 'Lead'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{authUser?.email}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {leadData?.phone && (
            <span style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              📞 {leadData.phone}
            </span>
          )}
          {leadData?.city && (
            <span style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {I.pin} {leadData.city}
            </span>
          )}
          {leadData?.status && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              background: leadData.status === 'HOT' ? 'rgba(220,38,38,0.12)' : leadData.status === 'WARM' ? 'rgba(217,119,6,0.12)' : 'rgba(59,130,246,0.12)',
              color: leadData.status === 'HOT' ? '#DC2626' : leadData.status === 'WARM' ? '#D97706' : '#3B82F6',
            }}>
              {leadData.status === 'HOT' ? '🔥' : leadData.status === 'WARM' ? '⚡' : '💧'} {leadData.status}
            </span>
          )}
        </div>
        {leadData?.propertyInterest && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            Interested in: <strong style={{ color: 'var(--text-2)' }}>{leadData.propertyInterest}</strong>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(220,38,38,0.3)',
          background: 'transparent', color: '#DC2626', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {I.logout} Sign Out
      </button>
    </div>
  );
}

// ─── Property Detail Modal ─────────────────────────────────────────────────────
function PropertyDetailModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const priceInCr = property.price ? (property.price / 100).toFixed(2) : '—';
  const img = property.images?.[0];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(14,17,23,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 20,
          width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 40px 100px rgba(0,0,0,0.35)',
          animation: 'modalIn 0.22s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image Header */}
        <div style={{ height: 240, background: '#1F2433', position: 'relative', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
          {img ? (
            <img
              src={img.startsWith('http') ? img : img}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 64, opacity: 0.2 }}>🏡</div>
          )}
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <StatusBadge status={property.status} />
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(14,17,23,0.6)', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center',
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, marginBottom: 6, color: 'var(--ink)' }}>
            {property.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            {I.pin} {property.location}, {property.district}
          </div>

          {/* Price + Size */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Price', value: `₹${priceInCr} Cr` },
              { label: 'Ground', value: property.ground ? `${property.ground} Grd` : '—' },
              { label: 'Sqft', value: property.sqft ? property.sqft.toLocaleString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {property.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Description</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{property.description}</p>
            </div>
          )}

          {/* Property Details Row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {property.plotType && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)', fontWeight: 600 }}>{property.plotType}</span>}
            {property.isFeatured && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(226,195,109,0.12)', color: '#B45309', border: '1px solid rgba(226,195,109,0.25)', fontWeight: 600 }}>⭐ Featured</span>}
          </div>

          {/* Contact Button */}
          <a
            href="https://wa.me/919876543210?text=Hi%2C%20I'm%20interested%20in%20this%20property%20from%20Tamizha%20Properties."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 24, padding: '13px', borderRadius: 12,
              background: 'linear-gradient(135deg, #E2C36D 0%, #C5A44E 100%)',
              color: '#0E1117', fontWeight: 700, fontSize: 14, textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(226,195,109,0.4)',
            }}
          >
            📞 Contact Tamizha Properties
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Lead Dashboard ───────────────────────────────────────────────────────
export default function LeadDashboardPage() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [leadData, setLeadData] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load lead data linked to this user
    if (authUser?.id) {
      leadsApi.getByUserId(authUser.id).then(l => setLeadData(l)).catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    loadProperties();
  }, [page, searchQuery]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.getAll({
        search: searchQuery || undefined,
        page,
        limit: 12,
      });
      setProperties(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: 'var(--f-body)',
    }}>
      {/* Top Navigation */}
      <nav style={{
        height: 64, background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #E2C36D 0%, #C5A44E 100%)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 16,
            color: '#0E1117', flexShrink: 0,
          }}>T</div>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Tamizha Properties</div>
            <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>Lead Portal</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '8px 14px',
          width: 300,
        }}>
          {I.search}
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search properties…"
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text)', width: '100%',
            }}
          />
        </div>

        {/* User pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(226,195,109,0.1)', border: '1px solid rgba(226,195,109,0.25)',
          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#B45309',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E2C36D, #C5A44E)',
            display: 'grid', placeItems: 'center',
            fontSize: 10, fontWeight: 700, color: '#0E1117',
          }}>
            {(authUser?.name || 'L').split(' ').map((s: string) => s[0]).slice(0, 1).join('').toUpperCase()}
          </div>
          {authUser?.name?.split(' ')[0] || 'Lead'}
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Profile Section */}
        <LeadProfileSection
          leadData={leadData}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* Properties Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>
              Property Listings
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.8px', color: 'var(--ink)', marginBottom: 4 }}>
              Available <em style={{ color: 'var(--gold-deep)', fontStyle: 'italic' }}>Properties</em>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              Showing {total} properties — click any card for full details
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)', opacity: page === 1 ? 0.5 : 1,
              }}
            >← Prev</button>
            <span style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)', opacity: page === totalPages ? 0.5 : 1,
              }}
            >Next →</button>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 300, color: 'var(--text-3)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🏘️</div>
              <div style={{ fontSize: 14 }}>Loading properties…</div>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 300, color: 'var(--text-3)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No properties found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {properties.map(p => (
              <PropertyCard key={p.id} p={p} onClick={() => setSelectedProperty(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
