import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { usersApi, User } from '../api/users.api';
import ConfirmModal from '../components/ConfirmModal';

const INTEGRATIONS = [
  { icon: '💬', name: 'WhatsApp Business', desc: 'Lead capture & auto-reply via WA API', status: 'connected' },
  { icon: '📊', name: 'Google Analytics', desc: 'Track user app engagement', status: 'connected' },
  { icon: '🏦', name: 'HDFC Partner Portal', desc: 'Direct loan referral integration', status: 'connected' },
  { icon: '🗺️', name: 'Google Maps API', desc: 'Property location & nearby places', status: 'connected' },
  { icon: '📧', name: 'SendGrid Email', desc: 'Automated email campaigns', status: 'disconnected' },
  { icon: '📱', name: 'Firebase (User App)', desc: 'Push notifications & analytics', status: 'connected' },
  { icon: '💳', name: 'Razorpay', desc: 'Booking amount payment gateway', status: 'disconnected' },
  { icon: '📸', name: 'AWS S3 Media', desc: 'Property image & video hosting', status: 'connected' },
];

interface NotifPref {
  key: string;
  label: string;
  sub: string;
  on: boolean;
}

export default function SettingsPage() {
  const { user: authUser, updateUser } = useAuth();

  // Profile
  const [profileName, setProfileName] = useState(authUser?.name ?? 'Admin User');
  const [profilePhone, setProfilePhone] = useState(authUser?.phone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(authUser?.profilePhoto ?? null);
  const [showPhotoRemoveConfirm, setShowPhotoRemoveConfirm] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      usersApi.getOne(authUser.id).then(u => {
        if (u.name) setProfileName(u.name);
        if (u.profilePhoto) setAvatarUrl(u.profilePhoto);
      }).catch(err => {
        console.error('Failed to load profile details:', err);
      });
    }
  }, [authUser]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setProfileMsg('Photo selected. Click Save Changes to save.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveClick = () => {
    if (avatarUrl) {
      setShowPhotoRemoveConfirm(true);
    }
  };

  const executeRemovePhoto = () => {
    setShowPhotoRemoveConfirm(false);
    setAvatarUrl(null);
    setProfileMsg('Photo removed. Click Save Changes to save.');
  };

  // Company (static — no backend table)
  const [companyName, setCompanyName] = useState('Tamizha Properties');
  const [companyTagline, setCompanyTagline] = useState('Premium Real Estate · Tamil Nadu & Malaysia');
  const [rera, setRera] = useState('TNRERA/2024/AGENT/00421');

  // Team
  const [teamUsers, setTeamUsers] = useState<User[]>([]);

  // Notifications
  const [notifs, setNotifs] = useState<NotifPref[]>([
    { key: 'hot_lead',   label: 'New HOT Lead',            sub: 'Instant alert when a HOT lead is captured',   on: true },
    { key: 'site_visit', label: 'Site Visit Booked',        sub: 'When a lead schedules a site visit',          on: true },
    { key: 'deal_close', label: 'Deal Closed',              sub: 'Alert on every successful property sale',     on: true },
    { key: 'followup',   label: 'Follow-up Reminders',      sub: 'Daily digest of scheduled follow-ups',        on: true },
    { key: 'price_drop', label: 'Price Drop Alert',          sub: 'When a property price is changed',           on: false },
    { key: 'nri_login',  label: 'NRI Investor Login',       sub: 'When a user logs in from overseas IP',        on: true },
    { key: 'doc_upload', label: 'Document Uploaded',         sub: 'When an agent uploads a new document',       on: false },
    { key: 'weekly_rpt', label: 'Weekly Performance Email', sub: 'Summary report every Monday morning',         on: true },
  ]);

  // Security / Change password
  const [currPw, setCurrPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrPw, setShowCurrPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'notifications' | 'team' | 'integrations' | 'security'>('profile');

  const navItems = [
    { id: 'profile',       label: 'Profile',       icon: I.users },
    { id: 'company',       label: 'Company',        icon: I.building },
    { id: 'notifications', label: 'Notifications',  icon: I.bell },
    { id: 'team',          label: 'Team Members',   icon: I.team },
    { id: 'integrations',  label: 'Integrations',   icon: I.link },
    { id: 'security',      label: 'Security',       icon: I.key },
  ] as const;

  useEffect(() => {
    if (activeSection === 'team') {
      usersApi.getAll({ limit: 50 }).then(res => setTeamUsers(res.data)).catch(() => {});
    }
  }, [activeSection]);

  const handleProfileSave = async () => {
    if (!authUser) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await usersApi.update(authUser.id, {
        name: profileName,
        phone: profilePhone,
        profilePhoto: avatarUrl || '',
      });
      updateUser({
        name: profileName,
        phone: profilePhone,
        profilePhoto: avatarUrl || '',
      });
      
      setProfileMsg('Profile saved successfully.');
    } catch {
      setProfileMsg('Failed to save. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    setPwMsg('');
    if (!authUser) return;
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await usersApi.changePassword(authUser.id, { currentPassword: currPw, newPassword: newPw });
      setPwMsg('Password updated successfully.');
      setCurrPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  const toggleNotif = (key: string) => {
    setNotifs(prev => prev.map(n => n.key === key ? { ...n, on: !n.on } : n));
  };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar />
        <div className="tp-content tp-fadein">

          <div style={{ marginBottom: 24 }}>
            <span className="tp-eyebrow">Admin Configuration</span>
            <h1 className="tp-h1">Settings &amp; <em>Preferences</em></h1>
            <p className="tp-subtitle">Manage your profile, company details, team, integrations and notification preferences.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

            {/* Sidebar nav */}
            <div className="tp-card" style={{ padding: '10px 8px' }}>
              {navItems.map(n => (
                <button
                  key={n.id}
                  onClick={() => setActiveSection(n.id as typeof activeSection)}
                  className={`tp-nav-item${activeSection === n.id ? ' active' : ''}`}
                  style={{ width: '100%', border: 'none', cursor: 'pointer', justifyContent: 'flex-start', background: 'none' }}
                >
                  <span className="tp-nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="tp-card" style={{ overflow: 'hidden' }}>

              {/* PROFILE */}
              {activeSection === 'profile' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div className="tp-settings-section-title">Profile Information</div>
                    <div className="tp-settings-section-sub">Manage your personal admin account details</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '20px', background: 'var(--bg-warm)', borderRadius: 14, border: '1px solid var(--border)' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <div className="tp-avatar-xl">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          profileName[0]?.toUpperCase() ?? 'A'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{profileName}</div>
                        <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>{authUser?.email}</div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="tp-btn tp-btn-gold"
                            onClick={handleUploadClick}
                            style={{ fontSize: 11, padding: '6px 12px' }}
                          >
                            {I.upload} Upload Photo
                          </button>
                          <button
                            type="button"
                            className="tp-btn tp-btn-ghost"
                            onClick={handleRemoveClick}
                            disabled={!avatarUrl}
                            style={{
                              fontSize: 11,
                              padding: '6px 12px',
                              opacity: avatarUrl ? 1 : 0.5,
                              cursor: avatarUrl ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="tp-settings-grid">
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Full Name</div>
                        <input
                          className="tp-float-input"
                          value={profileName}
                          onChange={e => setProfileName(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Email Address</div>
                        <input className="tp-float-input" value={authUser?.email ?? ''} readOnly style={{ width: '100%', opacity: 0.7 }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Phone (Office Contact)</div>
                        <input
                          className="tp-float-input"
                          value={profilePhone}
                          onChange={e => setProfilePhone(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Role</div>
                        <input className="tp-float-input" value={authUser?.role ?? ''} readOnly style={{ width: '100%', opacity: 0.7, textTransform: 'capitalize' }}/>
                      </div>
                    </div>
                    {profileMsg && (
                      <div style={{ marginTop: 12, fontSize: 12, color: profileMsg.includes('success') ? 'var(--gold)' : '#ef4444' }}>
                        {profileMsg}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '18px 28px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-2)', background: 'var(--surface-2)' }}>
                    <button className="tp-btn tp-btn-ghost" onClick={() => {
                      setProfileName(authUser?.name ?? '');
                      setProfilePhone(authUser?.phone ?? '');
                      setAvatarUrl(authUser?.profilePhoto ?? null);
                      setProfileMsg('');
                    }}>Cancel</button>
                    <button className="tp-btn tp-btn-gold" onClick={handleProfileSave} disabled={profileSaving}>
                      {profileSaving ? <span className="tp-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}/> : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* COMPANY */}
              {activeSection === 'company' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div className="tp-settings-section-title">Company Details</div>
                    <div className="tp-settings-section-sub">These details appear on brochures, emails and the user app</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '20px', background: '#0E1117', borderRadius: 14, border: '1px solid #1F2433', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(500px 200px at 0% 50%, rgba(226,195,109,0.12), transparent)', pointerEvents: 'none' }}/>
                      <div className="tp-logo-mark" style={{ width: 56, height: 56, fontSize: 24 }}>T</div>
                      <div>
                        <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, color: '#fff' }}>{companyName}</div>
                        <div style={{ color: 'rgba(226,195,109,0.8)', fontSize: 12, marginTop: 2 }}>{companyTagline}</div>
                      </div>
                      <button className="tp-btn" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: 11 }}>
                        {I.upload} Update Logo
                      </button>
                    </div>
                    <div className="tp-settings-grid">
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Company Name</div>
                        <input className="tp-float-input" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Tagline</div>
                        <input className="tp-float-input" value={companyTagline} onChange={e => setCompanyTagline(e.target.value)} style={{ width: '100%' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>RERA Agent ID</div>
                        <input className="tp-float-input" value={rera} onChange={e => setRera(e.target.value)} style={{ width: '100%', fontFamily: 'var(--f-mono)' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>GST Number</div>
                        <input className="tp-float-input" defaultValue="33AABCT1234F1ZW" style={{ width: '100%', fontFamily: 'var(--f-mono)' }}/>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Registered Address</div>
                        <textarea className="tp-float-input" defaultValue="No. 42, 3rd Floor, KTC Complex, Tirunelveli Main Road, Tirunelveli — 627 001, Tamil Nadu" style={{ width: '100%', resize: 'none', height: 80 }}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '18px 28px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-2)', background: 'var(--surface-2)' }}>
                    <button className="tp-btn tp-btn-ghost">Cancel</button>
                    <button className="tp-btn tp-btn-gold">Save Changes</button>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeSection === 'notifications' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div className="tp-settings-section-title">Notification Preferences</div>
                    <div className="tp-settings-section-sub">Choose which events trigger notifications to you and your team</div>
                    {notifs.map(n => (
                      <div key={n.key} className="tp-settings-row">
                        <div>
                          <div className="tp-settings-row-label">{n.label}</div>
                          <div className="tp-settings-row-sub">{n.sub}</div>
                        </div>
                        <label className="tp-switch">
                          <input type="checkbox" checked={n.on} onChange={() => toggleNotif(n.key)}/>
                          <span className="tp-slider"/>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="tp-settings-section" style={{ borderBottom: 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Notification Channels</div>
                    {[
                      { label: 'In-App Notifications', sub: 'Show alerts inside the admin dashboard', on: true },
                      { label: 'WhatsApp Alerts', sub: 'Forward critical alerts to admin WhatsApp', on: true },
                      { label: 'Email Digest', sub: 'Daily summary email at 8 AM', on: true },
                      { label: 'SMS Alerts', sub: 'SMS for deal closes and HOT leads only', on: false },
                    ].map((n, i) => (
                      <div key={i} className="tp-settings-row">
                        <div>
                          <div className="tp-settings-row-label">{n.label}</div>
                          <div className="tp-settings-row-sub">{n.sub}</div>
                        </div>
                        <label className="tp-switch">
                          <input type="checkbox" defaultChecked={n.on}/>
                          <span className="tp-slider"/>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEAM */}
              {activeSection === 'team' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div>
                        <div className="tp-settings-section-title" style={{ marginBottom: 2 }}>Team Members</div>
                        <div className="tp-settings-section-sub" style={{ marginBottom: 0 }}>
                          {teamUsers.length} member{teamUsers.length !== 1 ? 's' : ''} in your team
                        </div>
                      </div>
                      <button className="tp-btn tp-btn-gold" style={{ fontSize: 12, padding: '8px 14px' }}>{I.plus} Invite Agent</button>
                    </div>
                    <table className="tp-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>
                              No team members found
                            </td>
                          </tr>
                        ) : teamUsers.map((t, i) => {
                          const initials = t.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('');
                          const colors = ['c1','c3','c4','c5','c6'];
                          return (
                            <tr key={t.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div className={`tp-init ${colors[i % colors.length]}`} style={{ width: 34, height: 34, fontSize: 11, flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>{t.email}</td>
                              <td style={{ fontSize: 12 }}>
                                <span className="tp-pill tp-pill-neutral" style={{ textTransform: 'capitalize' }}>{t.role}</span>
                              </td>
                              <td>
                                <span className={t.status === 'Active' ? 'tp-pill tp-pill-success' : 'tp-pill tp-pill-neutral'}>
                                  {t.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                  <button className="tp-act gold">{I.edit}</button>
                                  <button className="tp-act danger">{I.trash}</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* INTEGRATIONS */}
              {activeSection === 'integrations' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div className="tp-settings-section-title">Connected Integrations</div>
                    <div className="tp-settings-section-sub">{INTEGRATIONS.filter(i => i.status === 'connected').length} of {INTEGRATIONS.length} services connected</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {INTEGRATIONS.map((intg, i) => (
                        <div key={i} className="tp-integration-card">
                          <div className="tp-integration-icon">{intg.icon}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{intg.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{intg.desc}</div>
                          </div>
                          <div className={`tp-integration-status ${intg.status}`}>
                            <div className={`tp-integration-dot ${intg.status}`}/>
                            {intg.status === 'connected' ? 'Connected' : 'Not connected'}
                          </div>
                          <button className="tp-btn tp-btn-ghost" style={{ fontSize: 11, padding: '6px 12px', marginLeft: 8 }}>
                            {intg.status === 'connected' ? 'Configure' : 'Connect'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeSection === 'security' && (
                <div className="tp-fadein">
                  <div className="tp-settings-section">
                    <div className="tp-settings-section-title">Security Settings</div>
                    <div className="tp-settings-section-sub">Manage password, 2FA and API access</div>
                    <div className="tp-settings-row">
                      <div>
                        <div className="tp-settings-row-label">Two-Factor Authentication</div>
                        <div className="tp-settings-row-sub">Require OTP on every admin login</div>
                      </div>
                      <label className="tp-switch"><input type="checkbox" defaultChecked/><span className="tp-slider"/></label>
                    </div>
                    <div className="tp-settings-row">
                      <div>
                        <div className="tp-settings-row-label">Session Timeout</div>
                        <div className="tp-settings-row-sub">Auto-logout after 4 hours of inactivity</div>
                      </div>
                      <label className="tp-switch"><input type="checkbox" defaultChecked/><span className="tp-slider"/></label>
                    </div>
                    <div className="tp-settings-row">
                      <div>
                        <div className="tp-settings-row-label">Login Notifications</div>
                        <div className="tp-settings-row-sub">Alert on new device or location login</div>
                      </div>
                      <label className="tp-switch"><input type="checkbox" defaultChecked/><span className="tp-slider"/></label>
                    </div>
                    <div className="tp-settings-row">
                      <div>
                        <div className="tp-settings-row-label">Audit Log Retention</div>
                        <div className="tp-settings-row-sub">Keep 90 days of admin action logs</div>
                      </div>
                      <select className="tp-status-select" style={{ width: 140 }} defaultValue="90 days">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>180 days</option>
                        <option>1 year</option>
                      </select>
                    </div>
                  </div>
                  <div className="tp-settings-section">
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Change Password</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                      {([
                        { placeholder: 'Current password', value: currPw, onChange: setCurrPw, show: showCurrPw, toggle: () => setShowCurrPw(p => !p) },
                        { placeholder: 'New password', value: newPw, onChange: setNewPw, show: showNewPw, toggle: () => setShowNewPw(p => !p) },
                        { placeholder: 'Confirm new password', value: confirmPw, onChange: setConfirmPw, show: showConfirmPw, toggle: () => setShowConfirmPw(p => !p) },
                      ] as const).map((f, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <input
                            className="tp-float-input"
                            type={f.show ? 'text' : 'password'}
                            placeholder={f.placeholder}
                            value={f.value}
                            onChange={e => f.onChange(e.target.value)}
                            style={{ width: '100%', paddingRight: 44 }}
                          />
                          <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
                            {f.show ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      ))}
                      {pwError && <div style={{ fontSize: 12, color: '#ef4444' }}>{pwError}</div>}
                      {pwMsg && <div style={{ fontSize: 12, color: 'var(--gold)' }}>{pwMsg}</div>}
                      <button
                        className="tp-btn tp-btn-dark"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={handlePasswordChange}
                        disabled={pwSaving || !currPw || !newPw || !confirmPw}
                      >
                        {pwSaving ? <span className="tp-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}/> : 'Update Password'}
                      </button>
                    </div>
                  </div>
                  <div className="tp-settings-section" style={{ borderBottom: 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>API Access Key</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
                        tp_live_••••••••••••••••••••••••••••••
                      </div>
                      <button className="tp-btn tp-btn-ghost">{I.copy} Copy</button>
                      <button className="tp-btn tp-btn-ghost">{I.refresh} Regenerate</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Profile Photo Removal Confirmation Modal */}
      <ConfirmModal
        isOpen={showPhotoRemoveConfirm}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile photo? You will need to select a new image to replace it."
        confirmText="Remove Photo"
        cancelText="Cancel"
        onConfirm={executeRemovePhoto}
        onCancel={() => setShowPhotoRemoveConfirm(false)}
      />
    </div>
  );
}
