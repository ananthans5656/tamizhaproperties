import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { siteVisitsApi } from '../api/siteVisits.api';

const GOLD = '#E2C36D';

type VisitStatus = 'Confirmed' | 'Tentative' | 'Cancelled';
type VisitType = 'Showing' | 'Walk-through' | 'Call';

interface Visit {
  id: string;
  propertyName: string;
  propertyId?: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  visitDate: string;
  visitTime: string;
  duration: string;
  type: VisitType;
  status: VisitStatus;
  notes?: string;
  createdAt?: any;
}

const VISIT_TYPES: VisitType[] = ['Showing', 'Walk-through', 'Call'];
const VISIT_STATUSES: VisitStatus[] = ['Confirmed', 'Tentative', 'Cancelled'];

const getWeekDates = (weekOffset = 0) => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      label: days[i],
      date: dd,
      month: mm,
      fullDate: `${yyyy}-${mm}-${dd}`,
      isToday: d.toDateString() === today.toDateString(),
    };
  });
};

const toDateKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function typeColor(t: VisitType) {
  if (t === 'Showing') return GOLD;
  if (t === 'Walk-through') return '#22C55E';
  return '#60A5FA';
}

function statusColor(s: VisitStatus) {
  if (s === 'Confirmed') return '#22C55E';
  if (s === 'Cancelled') return '#EF4444';
  return GOLD;
}

export default function SiteVisitsPage() {
  const todayKey = toDateKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Add form
  const [fProperty, setFProperty] = useState('');
  const [fClient, setFClient] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fDate, setFDate] = useState(todayKey);
  const [fTime, setFTime] = useState('10:00');
  const [fDuration, setFDuration] = useState('45 min');
  const [fType, setFType] = useState<VisitType>('Showing');
  const [fStatus, setFStatus] = useState<VisitStatus>('Confirmed');
  const [fNotes, setFNotes] = useState('');

  // Edit form
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eStatus, setEStatus] = useState<VisitStatus>('Confirmed');
  const [eNotes, setENotes] = useState('');

  const loadVisits = async () => {
    try {
      const data = await siteVisitsApi.getAll();
      const list: Visit[] = data.map(v => ({
        id: String(v.id),
        propertyName: v.property_title || 'Property',
        propertyId: v.property_id,
        clientName: v.lead_name || 'Client',
        clientPhone: v.lead_phone || '',
        visitDate: v.visit_date ? v.visit_date.slice(0, 10) : '',
        visitTime: '10:00',
        duration: '45 min',
        type: 'Showing' as VisitType,
        status: (v.status?.charAt(0).toUpperCase() + v.status?.slice(1).toLowerCase()) as VisitStatus || 'Tentative',
        notes: v.notes || '',
        createdAt: v.created_at,
      }));
      setVisits(list.sort((a, b) => a.visitDate.localeCompare(b.visitDate)));
    } catch (e) {
      console.error('SiteVisits fetch:', e);
    }
  };

  useEffect(() => { loadVisits(); }, []);

  const filtered = visits
    .filter(v => v.visitDate === selectedDate)
    .sort((a, b) => a.visitTime.localeCompare(b.visitTime));

  const tentativeCount = visits.filter(v => v.status === 'Tentative').length;

  const resetAdd = () => {
    setFProperty(''); setFClient(''); setFPhone('');
    setFDate(todayKey); setFTime('10:00'); setFDuration('45 min');
    setFType('Showing'); setFStatus('Confirmed'); setFNotes('');
  };

  const handleAdd = async () => {
    if (!fProperty.trim() || !fClient.trim() || !fPhone.trim()) return;
    setSaving(true);
    try {
      await siteVisitsApi.create({
        visit_date: fDate,
        status: fStatus.toLowerCase(),
        notes: `${fProperty.trim()} | Client: ${fClient.trim()} | Phone: ${fPhone.trim()} | Time: ${fTime} | Duration: ${fDuration} | Type: ${fType}${fNotes.trim() ? ' | ' + fNotes.trim() : ''}`,
      });
      setShowAddModal(false);
      resetAdd();
      await loadVisits();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (v: Visit) => {
    setEditingVisit(v);
    setEDate(v.visitDate);
    setETime(v.visitTime);
    setEStatus(v.status);
    setENotes(v.notes || '');
  };

  const handleEdit = async () => {
    if (!editingVisit) return;
    setSaving(true);
    try {
      await siteVisitsApi.update(editingVisit.id, {
        visit_date: eDate,
        status: eStatus.toLowerCase(),
        notes: eNotes.trim(),
      });
      setEditingVisit(null);
      await loadVisits();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (v: Visit) => {
    setConfirming(v.id);
    try {
      await siteVisitsApi.update(v.id, { status: 'confirmed' });
      await loadVisits();
    } finally {
      setConfirming(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this visit?')) return;
    setDeleting(id);
    try {
      await siteVisitsApi.remove(id);
      await loadVisits();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="tp-shell">
      <Sidebar />
      <div className="tp-main">
        <Topbar />

        <div style={{ padding: '24px 28px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--f-display)', color: 'var(--ink)' }}>
                📅 Site Visits
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Manage scheduled property visits — synced across Admin App & User App
              </div>
            </div>
            <button
              className="tp-btn tp-btn-gold"
              onClick={() => { setFDate(selectedDate); setShowAddModal(true); }}
            >
              + Schedule Visit
            </button>
          </div>

          {/* Pending banner — clickable */}
          {tentativeCount > 0 && (
            <div
              onClick={() => setShowPendingModal(true)}
              style={{
                background: 'rgba(226,195,109,0.08)', border: '1px solid rgba(226,195,109,0.25)',
                borderRadius: 12, padding: '12px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(226,195,109,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(226,195,109,0.08)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>
                  {tentativeCount} visit{tentativeCount > 1 ? 's' : ''} awaiting confirmation
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>View & Confirm →</span>
            </div>
          )}

          {/* Week calendar strip */}
          <div className="tp-card" style={{ padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={() => setWeekOffset(w => w - 1)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: GOLD, cursor: 'pointer', fontWeight: 900 }}>‹</button>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
                {weekDates[0]?.date}/{weekDates[0]?.month} – {weekDates[6]?.date}/{weekDates[6]?.month}
                {weekOffset === 0 ? '  (This Week)' : weekOffset > 0 ? `  (+${weekOffset}w)` : `  (${weekOffset}w)`}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: GOLD, cursor: 'pointer', fontWeight: 900 }}>›</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {weekDates.map(day => {
                const isSelected = day.fullDate === selectedDate;
                const hasVisits = visits.some(v => v.visitDate === day.fullDate);
                return (
                  <button
                    key={day.fullDate}
                    onClick={() => setSelectedDate(day.fullDate)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                      border: isSelected ? 'none' : '1px solid var(--border-2)',
                      background: isSelected ? GOLD : 'var(--bg)',
                      color: isSelected ? '#111' : day.isToday ? GOLD : 'var(--text)',
                      fontWeight: 700, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 4, transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.7 }}>{day.label}</span>
                    <span style={{ fontSize: 17, fontWeight: 900 }}>{day.date}</span>
                    {hasVisits && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#111' : GOLD }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              {selectedDate === todayKey ? 'Today · ' : ''}
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
              {filtered.length} visit{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Visit list */}
          {filtered.length === 0 ? (
            <div className="tp-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>No visits scheduled</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
                User App bookings will appear here automatically
              </div>
              <button className="tp-btn tp-btn-gold"
                onClick={() => { setFDate(selectedDate); setShowAddModal(true); }}>
                + Schedule Visit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(v => (
                <div key={v.id} className="tp-card" style={{
                  padding: '16px 20px',
                  borderLeft: `3px solid ${typeColor(v.type)}`,
                  display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 16, alignItems: 'start',
                }}>
                  {/* Time */}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>{v.visitTime}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{v.duration}</div>
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: typeColor(v.type) + '20', color: typeColor(v.type),
                        border: `1px solid ${typeColor(v.type)}40`,
                      }}>{v.type}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: statusColor(v.status) + '15', color: statusColor(v.status),
                      }}>{v.status}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{v.propertyName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>👤 {v.clientName}</div>
                    {v.clientPhone && (
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>📞 {v.clientPhone}</div>
                    )}
                    {v.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontStyle: 'italic' }}>{v.notes}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                    {v.status === 'Tentative' && (
                      <button className="tp-btn tp-btn-gold" style={{ fontSize: 11, padding: '6px 12px' }}
                        onClick={() => handleConfirm(v)}>
                        ✅ Confirm
                      </button>
                    )}
                    <button className="tp-btn" style={{ fontSize: 11, padding: '6px 12px' }}
                      onClick={() => openEdit(v)}>
                      ✏️ Edit
                    </button>
                    <button
                      className="tp-btn"
                      style={{ fontSize: 11, padding: '6px 12px', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', opacity: deleting === v.id ? 0.5 : 1 }}
                      onClick={() => handleDelete(v.id)}
                      disabled={deleting === v.id}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(14,17,23,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); resetAdd(); } }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>📅 SCHEDULE SITE VISIT</span>
              <button className="tp-act" onClick={() => { setShowAddModal(false); resetAdd(); }}>✕</button>
            </div>
            <div style={{ padding: '18px 24px 28px', display: 'grid', gap: 14 }}>
              {[
                { label: 'PROPERTY *', value: fProperty, set: setFProperty, placeholder: 'Property name...' },
                { label: 'CLIENT NAME *', value: fClient, set: setFClient, placeholder: 'Client name...' },
                { label: 'CLIENT PHONE *', value: fPhone, set: setFPhone, placeholder: '+91 98765 43210' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>DATE</label>
                  <input value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} placeholder="YYYY-MM-DD" />
                </div>
                <div>
                  <label style={labelStyle}>TIME</label>
                  <input value={fTime} onChange={e => setFTime(e.target.value)} style={inputStyle} placeholder="HH:MM" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>DURATION</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['30 min', '45 min', '60 min', '90 min'].map(d => (
                    <button key={d} onClick={() => setFDuration(d)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: fDuration === d ? 'none' : '1px solid var(--border-2)',
                      background: fDuration === d ? GOLD : 'var(--bg)',
                      color: fDuration === d ? '#111' : 'var(--text)',
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>VISIT TYPE</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {VISIT_TYPES.map(t => (
                    <button key={t} onClick={() => setFType(t)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: fType === t ? 'none' : '1px solid var(--border-2)',
                      background: fType === t ? typeColor(t) : 'var(--bg)',
                      color: fType === t ? '#fff' : 'var(--text)',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>STATUS</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {VISIT_STATUSES.map(s => (
                    <button key={s} onClick={() => setFStatus(s)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: fStatus === s ? 'none' : '1px solid var(--border-2)',
                      background: fStatus === s ? statusColor(s) : 'var(--bg)',
                      color: fStatus === s ? '#fff' : 'var(--text)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>NOTES (OPTIONAL)</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  style={{ ...inputStyle, height: 72, resize: 'none', paddingTop: 10 }} />
              </div>

              <button className="tp-btn tp-btn-gold" style={{ marginTop: 4, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
                onClick={handleAdd} disabled={saving || !fProperty.trim() || !fClient.trim() || !fPhone.trim()}>
                {saving ? 'Saving...' : 'CONFIRM SCHEDULE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PENDING VISITS MODAL */}
      {showPendingModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(14,17,23,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowPendingModal(false); }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520,
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)', maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-2)' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>⏳ Awaiting Confirmation</span>
              <button className="tp-act" onClick={() => setShowPendingModal(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visits.filter(v => v.status === 'Tentative').map(v => (
                <div key={v.id} style={{
                  padding: '14px 16px', borderRadius: 12,
                  border: '1px solid rgba(226,195,109,0.25)',
                  background: 'rgba(226,195,109,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{v.propertyName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>👤 {v.clientName}</div>
                      {v.clientPhone && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>📞 {v.clientPhone}</div>}
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginTop: 4 }}>
                        📅 {new Date(v.visitDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {v.visitTime}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 110 }}>
                      <button
                        className="tp-btn tp-btn-gold"
                        style={{ fontSize: 11, padding: '7px 12px', opacity: confirming === v.id ? 0.6 : 1 }}
                        onClick={() => handleConfirm(v)}
                        disabled={confirming === v.id}
                      >
                        {confirming === v.id ? 'Confirming...' : '✅ Confirm'}
                      </button>
                      <button
                        className="tp-btn"
                        style={{ fontSize: 11, padding: '7px 12px' }}
                        onClick={() => { setShowPendingModal(false); openEdit(v); setSelectedDate(v.visitDate); }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingVisit && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(14,17,23,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setEditingVisit(null); }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 420,
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>✏️ EDIT VISIT</span>
              <button className="tp-act" onClick={() => setEditingVisit(null)}>✕</button>
            </div>
            <div style={{ padding: '18px 24px 28px', display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>DATE</label>
                  <input value={eDate} onChange={e => setEDate(e.target.value)} style={inputStyle} placeholder="YYYY-MM-DD" />
                </div>
                <div>
                  <label style={labelStyle}>TIME</label>
                  <input value={eTime} onChange={e => setETime(e.target.value)} style={inputStyle} placeholder="HH:MM" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>STATUS</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {VISIT_STATUSES.map(s => (
                    <button key={s} onClick={() => setEStatus(s)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      border: eStatus === s ? 'none' : '1px solid var(--border-2)',
                      background: eStatus === s ? statusColor(s) : 'var(--bg)',
                      color: eStatus === s ? '#fff' : 'var(--text)',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>NOTES</label>
                <textarea value={eNotes} onChange={e => setENotes(e.target.value)}
                  style={{ ...inputStyle, height: 72, resize: 'none', paddingTop: 10 }} />
              </div>
              <button className="tp-btn tp-btn-gold" style={{ marginTop: 4, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
                onClick={handleEdit} disabled={saving}>
                {saving ? 'Saving...' : '✅ SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: GOLD,
  textTransform: 'uppercase', letterSpacing: '0.12em',
  display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border-2)', borderRadius: 10,
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
  boxSizing: 'border-box',
};
