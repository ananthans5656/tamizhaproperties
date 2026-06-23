import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { locationsApi, Location, LocationDistrict, LocationType } from '../api/locations.api';
import ConfirmModal from '../components/ConfirmModal';

const DISTRICTS: LocationDistrict[] = ['TIRUNELVELI', 'TENKASI', 'THOOTHUKUDI', 'NAGERCOIL', 'COIMBATORE', 'CHENNAI'];

const TYPE_COLORS: Record<LocationType, { bg: string; text: string }> = {
  'PRIME':        { bg: 'rgba(226,195,109,0.15)', text: '#B45309' },
  'RESIDENTIAL':  { bg: 'rgba(59,130,246,0.12)',  text: '#1D4ED8' },
  'HIGH DEMAND':  { bg: 'rgba(220,38,38,0.1)',    text: '#DC2626' },
  'NEW DEV':      { bg: 'rgba(22,163,74,0.1)',    text: '#15803D' },
  'UPCOMING':     { bg: 'rgba(139,92,246,0.12)',  text: '#7C3AED' },
  'INDUSTRIAL':   { bg: 'rgba(107,114,128,0.12)', text: '#374151' },
  'STRATEGIC':    { bg: 'rgba(14,165,233,0.12)',  text: '#0369A1' },
  'NEW HUB':      { bg: 'rgba(226,195,109,0.08)', text: '#92400E' },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400';

interface HubCardProps {
  loc: Location;
  onDelete: (id: string, name: string) => void;
}

function HubCard({ loc, onDelete }: HubCardProps) {
  const typeStyle = TYPE_COLORS[loc.type] || TYPE_COLORS['NEW HUB'];
  const available = Math.max(0, loc.units - loc.sold);
  const pct = loc.units > 0 ? Math.round((loc.sold / loc.units) * 100) : 0;

  return (
    <div className="tp-card" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: 160 }}>
        <img
          src={loc.image || FALLBACK_IMAGE}
          alt={loc.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)'
        }}/>
        <div style={{ position: 'absolute', top: 10, left: 12 }}>
          <span style={{
            display: 'inline-block', padding: '3px 9px', borderRadius: 6, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: typeStyle.bg, color: typeStyle.text,
            backdropFilter: 'blur(8px)', border: `1px solid ${typeStyle.text}30`
          }}>{loc.type}</span>
        </div>
        <div style={{ position: 'absolute', top: 8, right: 10 }}>
          <button
            className="tp-act"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', color: '#DC2626' }}
            onClick={() => onDelete(loc.id, loc.name)}
            title="Remove hub"
          >{I.trash}</button>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {I.pin} {loc.road || 'N/A'}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.2px', marginBottom: 2 }}>{loc.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{loc.district}</div>
          </div>
          {loc.revenue && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Revenue</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600, color: 'var(--gold-dark)' }}>{loc.revenue}</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>SOLD {loc.sold} / {loc.units}</span>
            <span style={{ fontSize: 10, color: pct >= 80 ? '#DC2626' : pct >= 50 ? '#D97706' : '#16A34A', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
              width: `${pct}%`,
              background: pct >= 80 ? '#DC2626' : pct >= 50 ? '#D97706' : 'var(--gold)',
            }}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '10px 6px',
            background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-2)'
          }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>{loc.units}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Total Plots</div>
          </div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '10px 6px',
            background: 'rgba(22,163,74,0.06)', borderRadius: 10, border: '1px solid rgba(22,163,74,0.18)'
          }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, color: '#16A34A' }}>{available}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Available</div>
          </div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '10px 6px',
            background: 'rgba(220,38,38,0.06)', borderRadius: 10, border: '1px solid rgba(220,38,38,0.15)'
          }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, color: '#DC2626' }}>{loc.sold}</div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Sold</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Location>) => Promise<void>;
  saving: boolean;
}

function AddHubModal({ isOpen, onClose, onSave, saving }: AddHubModalProps) {
  const [name, setName] = useState('');
  const [road, setRoad] = useState('');
  const [district, setDistrict] = useState<LocationDistrict>('TIRUNELVELI');
  const [type, setType] = useState<LocationType>('NEW HUB');
  const [units, setUnits] = useState('');
  const [revenue, setRevenue] = useState('');
  const [nameErr, setNameErr] = useState('');

  const types: LocationType[] = ['PRIME', 'RESIDENTIAL', 'HIGH DEMAND', 'NEW DEV', 'UPCOMING', 'INDUSTRIAL', 'STRATEGIC', 'NEW HUB'];

  const handleSubmit = async () => {
    if (!name.trim()) { setNameErr('Hub name is required'); return; }
    setNameErr('');
    await onSave({
      name: name.trim(),
      road: road.trim() || undefined,
      district,
      type,
      units: units ? parseInt(units) : 0,
      revenue: revenue.trim() || undefined,
    });
    setName(''); setRoad(''); setUnits(''); setRevenue('');
    setDistrict('TIRUNELVELI'); setType('NEW HUB');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        padding: 32, width: '100%', maxWidth: 640,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div className="tp-eyebrow">New Location Hub</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, marginTop: 2 }}>Create Network Hub</h2>
          </div>
          <button className="tp-act" onClick={onClose}>{I.more}</button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* District */}
          <div>
            <label className="tp-label">District</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {DISTRICTS.map(d => (
                <button
                  key={d}
                  className={`tp-chip${district === d ? ' active' : ''}`}
                  onClick={() => setDistrict(d)}
                  type="button"
                >{d}</button>
              ))}
            </div>
          </div>

          {/* Hub Name */}
          <div>
            <label className="tp-label">Hub Name *</label>
            <input
              className={`tp-input${nameErr ? ' error' : ''}`}
              placeholder="e.g. KTC Nagar"
              value={name}
              onChange={e => { setName(e.target.value); setNameErr(''); }}
            />
            {nameErr && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{nameErr}</div>}
          </div>

          {/* Road */}
          <div>
            <label className="tp-label">Connected Road</label>
            <input
              className="tp-input"
              placeholder="e.g. Tuticorin Road"
              value={road}
              onChange={e => setRoad(e.target.value)}
            />
          </div>

          {/* Type and Units row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="tp-label">Hub Type</label>
              <select
                className="tp-input"
                value={type}
                onChange={e => setType(e.target.value as LocationType)}
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="tp-label">Total Plots</label>
              <input
                className="tp-input"
                type="number"
                min="0"
                placeholder="e.g. 145"
                value={units}
                onChange={e => setUnits(e.target.value)}
              />
            </div>
          </div>

          {/* Revenue */}
          <div>
            <label className="tp-label">Revenue (Optional)</label>
            <input
              className="tp-input"
              placeholder="e.g. ₹5.2 Cr"
              value={revenue}
              onChange={e => setRevenue(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="tp-btn tp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="tp-btn tp-btn-gold"
            style={{ flex: 2 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Launching…' : `${I.plus} Launch Hub`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<LocationDistrict | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState<{ total: number; districtStats: { district: string; count: number }[] } | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        locationsApi.getAll({
          search: search || undefined,
          district: selectedDistrict === 'ALL' ? undefined : selectedDistrict,
          limit: 50,
        }),
        locationsApi.getStats(),
      ]);
      setLocations(res.data);
      setStats(statsRes);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, [search, selectedDistrict]);

  const handleAdd = async (data: Partial<Location>) => {
    setSaving(true);
    try {
      await locationsApi.create(data);
      setSaveMsg('Hub launched successfully!');
      setShowAddModal(false);
      fetchLocations();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to create hub. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await locationsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchLocations();
    } catch {
      alert('Failed to remove hub.');
    }
  };

  const totalUnits = locations.reduce((s, l) => s + l.units, 0);
  const totalSold  = locations.reduce((s, l) => s + l.sold, 0);

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar />
        <div className="tp-content">

          {/* Hero */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="tp-eyebrow">Tamizha Properties</span>
              <h1 className="tp-h1">Network <em>Hubs</em></h1>
              <p className="tp-subtitle">Manage all location hubs across Tamil Nadu districts — track plots, sold units and revenue per hub.</p>
            </div>
            <button className="tp-btn tp-btn-gold" onClick={() => setShowAddModal(true)}>
              {I.plus} Launch New Hub
            </button>
          </div>

          {/* Save notification */}
          {saveMsg && (
            <div style={{
              padding: '12px 18px', borderRadius: 12, marginBottom: 16, fontSize: 13,
              background: saveMsg.includes('success') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
              color: saveMsg.includes('success') ? '#15803D' : '#DC2626',
              border: `1px solid ${saveMsg.includes('success') ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
            }}>{saveMsg}</div>
          )}

          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Hubs', value: stats?.total ?? locations.length, icon: I.map, color: 'var(--gold)' },
              { label: 'Total Plots', value: totalUnits, icon: I.building, color: '#3B82F6' },
              { label: 'Sold Units', value: totalSold, icon: I.check, color: '#DC2626' },
              { label: 'Available', value: Math.max(0, totalUnits - totalSold), icon: I.star, color: '#16A34A' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="tp-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg)', display: 'grid', placeItems: 'center', color }}>{icon}</div>
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 340 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}>{I.search}</span>
              <input
                className="tp-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search hubs or roads…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className={`tp-chip${selectedDistrict === 'ALL' ? ' active' : ''}`}
                onClick={() => setSelectedDistrict('ALL')}
              >All Districts</button>
              {DISTRICTS.map(d => (
                <button
                  key={d}
                  className={`tp-chip${selectedDistrict === d ? ' active' : ''}`}
                  onClick={() => setSelectedDistrict(d)}
                >{d}</button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
              Loading hubs…
            </div>
          ) : locations.length === 0 ? (
            <div className="tp-card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, marginBottom: 6 }}>No Hubs Found</div>
              <div style={{ color: 'var(--text-3)', marginBottom: 20 }}>
                {search ? `No hubs match "${search}"` : 'Launch your first network hub to get started.'}
              </div>
              {!search && (
                <button className="tp-btn tp-btn-gold" onClick={() => setShowAddModal(true)}>
                  {I.plus} Launch First Hub
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {locations.map(loc => (
                <HubCard
                  key={loc.id}
                  loc={loc}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      <AddHubModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        saving={saving}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Hub"
        message={`Remove "${deleteTarget?.name}" from the network? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
