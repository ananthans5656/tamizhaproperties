import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { leadsApi, Lead, LeadStats } from '../api/leads.api';
import ConfirmModal from '../components/ConfirmModal';

// ─── Assign Login Modal ────────────────────────────────────────────────────────
function AssignLoginModal({ lead, onClose, onSaved }: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(lead.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    if (!email || !password) { setMsg('Email and password are required.'); return; }
    if (password.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const res = await leadsApi.assignLogin(lead.id, email, password);
      setMsg('✅ ' + res.message);
      setTimeout(() => { onClose(); onSaved(); }, 1500);
    } catch (e: any) {
      setMsg('❌ Failed: ' + (e?.response?.data?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(14,17,23,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'modalIn 0.22s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#0E1117', color: '#E2C36D', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6 }}>🔑 Assign Login</span>
          <div style={{ flex: 1 }} />
          <button className="tp-act" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '18px 26px 28px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Create Login for Lead</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Admin assigning portal access to: <strong>{lead.name}</strong></div>

          {lead.loginUserId && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', fontSize: 12, color: '#15803D', marginBottom: 16, fontWeight: 600 }}>
              ✓ Login already assigned — you can update the credentials below
            </div>
          )}

          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Email Address *</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="lead@example.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Password *</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-2)', borderRadius: 10, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Lead will use this to log in at the portal</div>
            </div>
          </div>

          {msg && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12, background: msg.startsWith('✅') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: msg.startsWith('✅') ? '#15803D' : '#DC2626', fontWeight: 500 }}>{msg}</div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="tp-btn tp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="tp-btn tp-btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '🔑 Assign Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipeCard({ label, value, sub, tone, icon }: { label: string; value: string; sub: string; tone: string; icon: string }) {
  const styles: Record<string, any> = {
    danger: { bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.18)', icon: 'rgba(220,38,38,0.12)', iconColor: '#DC2626', acc: '#DC2626' },
    warn: { bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)', icon: 'rgba(217,119,6,0.12)', iconColor: '#D97706', acc: '#B45309' },
    info: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', icon: 'rgba(59,130,246,0.12)', iconColor: '#3B82F6', acc: '#1D4ED8' },
    success: { bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.18)', icon: 'rgba(22,163,74,0.12)', iconColor: '#16A34A', acc: '#15803D' },
  };
  const s = styles[tone];
  return (
    <div className="tp-card" style={{ padding: 20, background: `linear-gradient(180deg, ${s.bg}, var(--surface) 80%)`, border: `1px solid ${s.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: s.acc }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.icon, color: s.iconColor, display: 'grid', placeItems: 'center' }}>{I[icon]}</div>
      </div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 34, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1, color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>{sub}</div>
    </div>
  );
}

function SourceRow({ color, label, value, count }: { color: string; label: string; value: string; count: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }}/>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--text-3)', fontSize: 11 }}>{count}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function statusPill(s: string) {
  if (s === 'HOT') return 'tp-pill tp-pill-danger';
  if (s === 'WARM') return 'tp-pill tp-pill-warn';
  if (s === 'NEW') return 'tp-pill tp-pill-info';
  return 'tp-pill tp-pill-success';
}

function LeadDetailModal({ lead, onClose, onCall, onWhatsApp, onEmail }: {
  lead: Lead;
  onClose: () => void;
  onCall: (phone: string, name: string) => void;
  onWhatsApp: (phone: string, name: string, interest: string) => void;
  onEmail: (name: string, interest: string) => void;
}) {
  const initials = lead.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
  
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(14,17,23,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div className="tp-card" style={{
        width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        borderRadius: 20,
        padding: 24,
        animation: 'modalIn 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)' }}>Lead Profile Card</span>
          <button className="tp-act" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
          <div className="tp-init c3" style={{ width: 64, height: 64, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            {initials}
          </div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>{lead.name}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Source: {lead.source || 'Direct'}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-2)', paddingTop: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Email:</span>
            <span style={{ fontWeight: 600 }}>{lead.email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Phone:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--f-mono)' }}>{lead.phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Current Location:</span>
            <span style={{ fontWeight: 600 }}>{lead.city || 'Unknown'}</span>
          </div>
          {lead.nativePlace && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: 'var(--text-3)' }}>Native Place:</span>
              <span style={{ fontWeight: 600 }}>{lead.nativePlace}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-3)' }}>Property Interest:</span>
            <span style={{ fontWeight: 600 }}>{lead.propertyInterest || 'None'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { onWhatsApp(lead.phone, lead.name, lead.propertyInterest || ''); onClose(); }}
            className="tp-btn tp-btn-gold"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            WhatsApp NRI
          </button>
          <button
            onClick={() => { onEmail(lead.name, lead.propertyInterest || ''); onClose(); }}
            className="tp-btn tp-btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Compose Email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  // Reusable form style constants
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: 'var(--text-3)', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border-2)', borderRadius: 10,
    fontSize: 13, background: 'var(--bg)',
    color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  // CRM leads state
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'HOT' | 'WARM' | 'NEW'>('All');
  
  // Search query state for live input filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Lead detail modal state
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // Call modal state
  const [callModal, setCallModal] = useState<{ phone: string; name: string } | null>(null);
  const [callCopied, setCallCopied] = useState(false);

  // Add lead modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCountryCode, setNewLeadCountryCode] = useState('+65');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPassword, setNewLeadPassword] = useState('');
  const [newLeadInterest, setNewLeadInterest] = useState('');
  const [newLeadLocation, setNewLeadLocation] = useState('');
  const [newLeadNative, setNewLeadNative] = useState('');
  const [newLeadStatus, setNewLeadStatus] = useState('NEW');
  const [addLeadSaving, setAddLeadSaving] = useState(false);
  const [addLeadMsg, setAddLeadMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Assign login modal state
  const [assignLoginLead, setAssignLoginLead] = useState<Lead | null>(null);

  // Delete lead modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    let allEnquiries: Lead[] = [];

    const updateCombinedUI = () => {
      const all = [...allEnquiries];
      all.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      });

      // Client-side filter
      let filtered = all;
      if (statusFilter !== 'All') filtered = filtered.filter(l => l.status === statusFilter);
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        filtered = filtered.filter(l =>
          l.name?.toLowerCase().includes(s) ||
          l.phone?.toLowerCase().includes(s) ||
          l.propertyInterest?.toLowerCase().includes(s)
        );
      }

      // Pagination
      const limitSize = 8;
      const totalCount = filtered.length;
      const pages = Math.ceil(totalCount / limitSize);
      const paged = filtered.slice((page - 1) * limitSize, page * limitSize);

      setLeadsList(paged);
      setTotalPages(pages || 1);
      setTotalLeadsCount(totalCount);
      setLoading(false);

      // Compute stats from live data
      const hot = all.filter(l => l.status === 'HOT').length;
      const warm = all.filter(l => l.status === 'WARM').length;
      const newLeads = all.filter(l => l.status === 'NEW').length;
      const closed = all.filter(l => l.status === 'CLOSED').length;
      const total = all.length;
      const sourceMap: Record<string, number> = {};
      all.forEach(l => { if (l.source) sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1; });
      const sourceBreakdown = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));
      setStats({ hot, warm, new: newLeads, closed, total, sourceBreakdown } as any);
      setFirestoreError(null);
    };

    leadsApi.getAll({ limit: 500 })
      .then(res => {
        allEnquiries = (res.data || [])
          .filter((d: any) => d.source !== 'User App Chat')
          .map((d: any) => ({
            ...d,
            name: d.name || 'Unknown Lead',
            email: d.email || '',
            phone: d.phone || '',
            city: d.city || 'Unknown',
            nativePlace: d.nativePlace || d.native_place || '',
            status: String(d.status || 'NEW').toUpperCase() as any,
            propertyInterest: d.property_interest || d.notes || 'General Inquiry',
            source: d.source || 'User App',
            createdAt: d.created_at || d.createdAt || '',
            updatedAt: d.updated_at || d.updatedAt || '',
          }));
        updateCombinedUI();
      })
      .catch(err => {
        console.error('Leads fetch error:', err);
        setFirestoreError(err.message);
        setLoading(false);
      });
  }, [statusFilter, searchQuery, page, refreshKey]);

  const handleCall = (phone: string, name: string) => {
    setCallCopied(false);
    setCallModal({ phone, name });
  };

  // WhatsApp click dispatch (Redirects to WhatsApp Web with a customized pre-filled message!)
  const handleWhatsApp = (phone: string, name: string, interest: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(`Hi ${name}, thank you for your NRI interest in "${interest}" with Tamizha Properties. Would you like to schedule a virtual tour or call?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Email Composer dispatch
  const handleEmail = (name: string, interest: string) => {
    const subject = encodeURIComponent(`Information pack: ${interest} - Tamizha Properties`);
    const body = encodeURIComponent(`Hi ${name},\n\nThank you for exploring the "${interest}" property on the Tamizha Properties platform.\n\nI would be happy to share NRI floorplans, price breakdowns, and tax-saving configurations for this estate. Are you available for a briefly scheduled phone call today?\n\nBest regards,\nKarthik Raja\nHead of Operations\nTamizha Properties`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  // More Details dispatch
  const handleMoreDetails = (lead: any) => {
    setViewingLead(lead);
  };

  // Add Lead Form handler
  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone || !newLeadEmail || !newLeadInterest || !newLeadLocation || !newLeadNative || !newLeadPassword) {
      setAddLeadMsg('❌ All fields including Native Place and password are required.');
      return;
    }
    if (newLeadPassword.length < 8) {
      setAddLeadMsg('❌ Password must be at least 8 characters.');
      return;
    }
    setAddLeadSaving(true);
    setAddLeadMsg('');
    try {
      // Step 1: Create the lead
      const dialCode = newLeadCountryCode.replace('-dubai', '');
      const fullPhone = `${dialCode}${newLeadPhone.replace(/^0+/, '')}`;
      const createdLead = await leadsApi.create({
        name: newLeadName,
        phone: fullPhone,
        email: newLeadEmail,
        password: newLeadPassword,
        propertyInterest: newLeadInterest,
        city: newLeadLocation,
        nativePlace: newLeadNative,
        status: newLeadStatus as any,
        source: 'User App',
        timeSpent: '00m 10s'
      });

      setAddLeadMsg('✅ Lead created successfully.');

      // Refresh leads list
      setPage(1);
      setStatusFilter('All');
      setRefreshKey(k => k + 1);

      setTimeout(() => {
        setIsAddModalOpen(false);

        // Reset input fields
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        setNewLeadPassword('');
        setNewLeadInterest('');
        setNewLeadLocation('');
        setNewLeadNative('');
        setNewLeadCountryCode('+65');
        setNewLeadStatus('NEW');
        setAddLeadMsg('');
        setShowPassword(false);
      }, 2000);
      
      // Data will automatically refresh via Firestore onSnapshot listener
    } catch (err: any) {
      console.error('Failed to save lead:', err);
      if (err?.response?.status === 409) {
         setAddLeadMsg(`❌ ${err.response.data.message || 'Email already registered'}`);
      } else {
         setAddLeadMsg('❌ Failed to save lead. Please try again.');
      }
    } finally {
      setAddLeadSaving(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setLeadToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await leadsApi.remove(leadToDelete.id);
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Failed to delete lead:', err);
      alert('Failed to delete lead. Please try again.');
    }
  };

  const filteredLeads = leadsList;

  const totalLeadsAnalytic = stats?.total || 0;
  const sourcesConfig = [
    { label: 'User App', color: '#0E1117' },
    { label: 'WhatsApp', color: '#E2C36D' },
    { label: 'Web Referral', color: '#9CA3B5' },
    { label: 'Walk-in', color: '#16A34A' },
    { label: 'Other', color: '#8B5CF6' },
  ];

  const sourceBreakdownMapped = sourcesConfig.map(src => {
    const dbMatch = stats?.sourceBreakdown?.find((item: any) => item.source === src.label);
    const count = dbMatch ? parseInt(dbMatch.count as any) : 0;
    const pct = totalLeadsAnalytic > 0 ? Math.round((count / totalLeadsAnalytic) * 100) : 0;
    return {
      label: src.label,
      color: src.color,
      count,
      pct,
    };
  });

  let cumulativeDash = 0;

  // Generate dynamic notifications based on live DB leads
  const liveNotifications = leadsList.slice(0, 4).map((l, i) => {
    const times = ['just now', '4m', '12m', '24m'];
    const timeVal = times[i] || `${15 + i * 5}m`;
    
    if (l.status === 'HOT') {
      return {
        time: timeVal,
        icon: 'fire',
        tone: 'gold',
        text: `New HOT lead · ${l.name} · ${l.propertyInterest || 'Asset'}`
      };
    } else if (l.status === 'CLOSED') {
      return {
        time: timeVal,
        icon: 'check',
        tone: 'success',
        text: `Deal successfully closed · ${l.name}`
      };
    } else if (l.status === 'WARM') {
      return {
        time: timeVal,
        icon: 'phone',
        tone: 'success',
        text: `${l.name} answered callback`
      };
    } else {
      return {
        time: timeVal,
        icon: 'wa',
        tone: 'info',
        text: `WhatsApp opened by ${l.name}`
      };
    }
  });

  // Generate dynamic conversations based on live DB leads
  const recentConversations = leadsList.slice(0, 3).map((l, i) => {
    const colors = ['c1', 'c3', 'c4'];
    const vias = {
      'User App': { via: 'User App', tone: 'gold' },
      'WhatsApp': { via: 'WhatsApp', tone: 'success' },
      'Web Referral': { via: 'Web', tone: 'info' },
      'Walk-in': { via: 'Walk-in', tone: 'gold' },
      'Other': { via: 'Direct', tone: 'info' },
    };
    const viaConfig = vias[l.source as keyof typeof vias] || { via: 'Direct', tone: 'info' };
    
    const previews = [
      `"Send the layout PDF for ${l.propertyInterest || 'the plot'}? My CA wants to review before the call."`,
      `Spoke for 10 min. Interested in ${l.propertyInterest || 'the property'}. Callback scheduled next week.`,
      `"Could you share NRI loan partners and tax-saving options for the ${l.propertyInterest || 'listed'} property?"`,
    ];
    
    return {
      tc: colors[i % 3],
      name: l.name,
      via: viaConfig.via,
      preview: previews[i % previews.length],
      time: l.timeSpent || 'just now',
      tone: viaConfig.tone
    };
  });


  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        {/* Wire input handler to Topbar replacement if needed or use search query internally */}
        <Topbar searchPlaceholder="Search leads by name, phone or property interest…" />
        
        <div className="tp-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <span className="tp-eyebrow">CRM Intelligence Console</span>
              <h1 className="tp-h1">Leads <em>Pipeline</em></h1>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Filter leads..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12.5,
                    border: '1px solid var(--border-2)',
                    borderRadius: 8,
                    width: 160,
                    background: 'var(--surface)'
                  }}
                />
              </div>
              <button className="tp-btn tp-btn-gold" onClick={() => setIsAddModalOpen(true)}>{I.plus} Add Lead</button>
            </div>
          </div>


          {/* Lead table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
            <div className="tp-card">
              <div className="tp-card-head">
                <div>
                  <div className="tp-card-title">Leads Pipeline Log</div>
                  <div className="tp-card-sub">Sorted by status · {totalLeadsCount} active leads</div>
                </div>
              </div>
              
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Loading leads...</div>
              ) : firestoreError ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                  <strong>Error loading leads:</strong> {firestoreError} — Please refresh the page.
                </div>
              ) : leadsList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                  No leads found matching your filters.
                </div>
              ) : (
                <>
                  <table className="tp-table">
                    <thead>
                      <tr>
                        <th>Lead</th>
                        <th>Property Interest</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((l, i) => (
                        <tr key={l.id || i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className={`tp-init c${(i % 6) + 1}`} style={{ width: 38, height: 38, fontSize: 12 }}>
                                {(l.name || 'Unknown').split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name || 'Unknown Lead'}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>{l.phone || 'N/A'}</div>
                                {l.email && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{l.propertyInterest || 'None'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>{I.pin} {l.city || 'Unknown'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button className="tp-act success" title="Call" onClick={() => handleCall(l.phone, l.name)}>{I.phone}</button>
                              <button className="tp-act success" title="WhatsApp" onClick={() => handleWhatsApp(l.phone, l.name, l.propertyInterest || '')}>{I.wa}</button>
                              <button className="tp-act gold" title="Email" onClick={() => handleEmail(l.name, l.propertyInterest || '')}>{I.mail}</button>
                              <button className="tp-act" title="More Details" onClick={() => handleMoreDetails(l)}>{I.more}</button>
                              <button className="tp-act" style={{ color: '#DC2626' }} title="Delete Lead" onClick={() => handleDeleteClick(l.id, l.name)}>{I.trash}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border-2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Showing {filteredLeads.length} of {totalLeadsCount} leads (Page {page} of {totalPages})
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="tp-btn tp-btn-ghost"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                      >
                        ← Prev
                      </button>
                      <button
                        className="tp-btn tp-btn-dark"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>


        </div>
      </div>

      {/* Call Modal */}
      {callModal && (
        <div
          onClick={() => setCallModal(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,17,23,0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 18,
              padding: '32px 36px', minWidth: 320, maxWidth: 400, width: '90%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>📞</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>{callModal.name}</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: 20 }}>
              {callModal.phone}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(callModal.phone);
                  setCallCopied(true);
                  setTimeout(() => setCallCopied(false), 2000);
                }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--ink)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                {callCopied ? '✓ Copied!' : 'Copy Number'}
              </button>
              <button
                onClick={() => { window.open(`tel:${callModal.phone}`, '_self'); setCallModal(null); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: 'none', background: 'var(--gold)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                Call Now
              </button>
            </div>
            <button
              onClick={() => setCallModal(null)}
              style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal — Blur glassmorphism responsive modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(14,17,23,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 24,
        }}
          onClick={e => { if (e.target === e.currentTarget) { setIsAddModalOpen(false); setAddLeadMsg(''); } }}
        >
          <div className="tp-card" style={{
            width: '100%', maxWidth: 480,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            borderRadius: 20, animation: 'modalIn 0.22s ease',
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#0E1117', color: '#E2C36D', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6 }}>New Lead</span>
              <div style={{ flex: 1 }} />
              <button className="tp-act" onClick={() => { setIsAddModalOpen(false); setAddLeadMsg(''); }}>✕</button>
            </div>

            <div style={{ padding: '16px 26px 28px' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Add CRM Pipeline Lead</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Fill in the lead details below to add them to the pipeline</div>

              <form onSubmit={handleAddLeadSubmit} style={{ display: 'grid', gap: 14 }}>

                {/* Name */}
                <div>
                  <label style={labelStyle}>Lead Name *</label>
                  <input type="text" placeholder="e.g. Mukesh Patel" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} style={inputStyle} required />
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={newLeadCountryCode}
                      onChange={e => setNewLeadCountryCode(e.target.value)}
                      style={{ ...inputStyle, width: 160, flexShrink: 0, cursor: 'pointer' }}
                    >
                      <option value="+65">🇸🇬 Singapore +65</option>
                      <option value="+971">🇦🇪 UAE +971</option>
                      <option value="+971-dubai">🇦🇪 Dubai +971</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="e.g. 98765 12340"
                      value={newLeadPhone}
                      onChange={e => setNewLeadPhone(e.target.value.replace(/[^0-9 ]/g, ''))}
                      style={{ ...inputStyle, flex: 1 }}
                      required
                    />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    Full number: {newLeadCountryCode.replace('-dubai', '')}{newLeadPhone ? newLeadPhone.replace(/^0+/, '') : '—'}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" placeholder="e.g. mukesh@example.com" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} style={inputStyle} required />
                </div>

                {/* Property Interest + Location side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Property Interest *</label>
                    <input type="text" placeholder="e.g. KTC Nagar Plots" value={newLeadInterest} onChange={e => setNewLeadInterest(e.target.value)} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Current Location *</label>
                    <input type="text" placeholder="e.g. Dubai, UAE" value={newLeadLocation} onChange={e => setNewLeadLocation(e.target.value)} style={inputStyle} required />
                  </div>
                </div>

                {/* Native Place */}
                <div>
                  <label style={labelStyle}>Native Place (Hometown) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tirunelveli, Madurai, Salem..."
                    value={newLeadNative}
                    onChange={e => setNewLeadNative(e.target.value)}
                    style={inputStyle}
                    required
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                    Syncs with User App profile — helps match property district to hometown
                  </div>
                </div>

                {/* Password Field */}
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Password *</label>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={newLeadPassword} onChange={e => setNewLeadPassword(e.target.value)} style={{...inputStyle, paddingRight: 40}} required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 28, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Used for Lead Mobile App Login</div>
                </div>

                {/* Message */}
                {addLeadMsg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                    background: addLeadMsg.startsWith('✅') ? 'rgba(22,163,74,0.1)' : addLeadMsg.startsWith('⚠️') ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.08)',
                    color: addLeadMsg.startsWith('✅') ? '#15803D' : addLeadMsg.startsWith('⚠️') ? '#B45309' : '#DC2626',
                    border: `1px solid ${addLeadMsg.startsWith('✅') ? 'rgba(22,163,74,0.2)' : addLeadMsg.startsWith('⚠️') ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.15)'}`,
                  }}>{addLeadMsg}</div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" className="tp-btn tp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsAddModalOpen(false); setAddLeadMsg(''); }}>Cancel</button>
                  <button type="submit" className="tp-btn tp-btn-gold" style={{ flex: 1, justifyContent: 'center' }} disabled={addLeadSaving}>
                    {addLeadSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {viewingLead && (
        <LeadDetailModal
          lead={viewingLead}
          onClose={() => setViewingLead(null)}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onEmail={handleEmail}
        />
      )}

      {/* Assign Login Modal */}
      {assignLoginLead && (
        <AssignLoginModal
          lead={assignLoginLead}
          onClose={() => setAssignLoginLead(null)}
          onSaved={() => {}}
        />
      )}

      {/* Delete Lead Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete lead "${leadToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setLeadToDelete(null);
        }}
      />
    </div>
  );
}
