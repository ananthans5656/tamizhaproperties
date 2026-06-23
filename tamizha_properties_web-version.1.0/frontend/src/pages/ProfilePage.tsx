import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { I } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users.api';
import ConfirmModal from '../components/ConfirmModal';

function InitialAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3),
      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--f-display)', fontSize: size * 0.32, fontWeight: 700,
      color: '#0E1117', flexShrink: 0,
      boxShadow: '0 4px 14px rgba(226,195,109,0.3)',
    }}>{initials || 'A'}</div>
  );
}



export default function ProfilePage() {
  const { user: authUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [name, setName] = useState(authUser?.name ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(authUser?.profilePhoto ?? null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // Modals
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      usersApi.getOne(authUser.id).then(u => {
        if (u.name) setName(u.name);
        if (u.profilePhoto) setAvatarUrl(u.profilePhoto);
      }).catch(() => {});
    }
  }, [authUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileMsg('Image must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    if (!authUser?.id) return;
    setProfileSaving(true);
    try {
      await usersApi.update(authUser.id, { profilePhoto: null as any });
      setAvatarUrl(null);
      updateUser({ profilePhoto: undefined });
      setProfileMsg('Profile photo removed successfully!');
    } catch {
      setProfileMsg('Failed to remove photo. Please try again.');
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser?.id) return;
    if (!name.trim()) { setProfileMsg('Name is required.'); return; }
    setProfileSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim() || undefined,
      };
      // Only include profilePhoto if it's a new base64 upload (not the existing URL from server)
      if (avatarUrl && avatarUrl.startsWith('data:')) {
        payload.profilePhoto = avatarUrl;
      }
      const updated = await usersApi.update(authUser.id, payload);
      
      updateUser({ name: updated.name, phone: updated.phone, profilePhoto: updated.profilePhoto });
      setProfileMsg('Profile updated successfully!');
    } catch {
      setProfileMsg('Failed to save changes. Please try again.');
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  const handleChangePassword = async () => {
    if (!authUser?.id) return;
    if (!currentPwd || !newPwd) { setPwdMsg('All fields are required.'); return; }
    if (newPwd !== confirmPwd) { setPwdMsg('New passwords do not match.'); return; }
    if (newPwd.length < 6) { setPwdMsg('New password must be at least 6 characters.'); return; }
    setPwdSaving(true);
    try {
      await usersApi.changePassword(authUser.id, { currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdMsg('Password changed successfully!');
    } catch {
      setPwdMsg('Failed to change password. Check your current password.');
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMsg(''), 4000);
    }
  };

  const handleLogout = () => { setShowLogout(false); logout(); navigate('/login'); };

  return (
    <div className="tp-layout">
      <Sidebar />
      <div className="tp-main">
        <Topbar />
        <div className="tp-content">

          {/* Hero */}
          <div style={{ marginBottom: 28 }}>
            <span className="tp-eyebrow">My Account</span>
            <h1 className="tp-h1">Super Admin <em>Hub</em></h1>
            <p className="tp-subtitle">Manage your admin identity and security credentials.</p>
          </div>

          {/* Profile Hero Card */}
          <div className="tp-card" style={{ padding: 28, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  style={{ width: 96, height: 96, borderRadius: 24, objectFit: 'cover', border: '3px solid var(--gold)' }}
                />
              ) : (
                <InitialAvatar name={name || 'Admin'} size={96} />
              )}
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--ink)', border: '2px solid var(--surface)',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                  color: '#fff',
                }}
                title="Change photo"
              >{I.upload}</button>
              {avatarUrl && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={profileSaving}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#DC2626', border: '2px solid var(--surface)',
                    display: 'grid', placeItems: 'center', cursor: 'pointer',
                    color: '#fff', transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  title="Remove photo"
                >{I.trash}</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(226,195,109,0.12)', border: '1px solid rgba(226,195,109,0.25)',
                padding: '4px 10px', borderRadius: 8, marginBottom: 8,
                fontSize: 10, fontWeight: 700, color: '#B45309', letterSpacing: '0.1em',
              }}>⚙️ MASTER CONTROL</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600, marginBottom: 4 }}>{name || 'Admin'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{authUser?.email}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <span className="tp-pill tp-pill-gold">{authUser?.role?.toUpperCase() || 'ADMIN'}</span>
                <span className="tp-pill tp-pill-success">Active Session</span>
              </div>
            </div>
            <button
              className="tp-btn tp-btn-ghost"
              style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.3)' }}
              onClick={() => setShowLogout(true)}
            >
              {I.logout} Sign Out
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* Profile Settings */}
              <div className="tp-card" style={{ padding: 28 }}>
                <div className="tp-card-head" style={{ marginBottom: 22 }}>
                  <div>
                    <div className="tp-card-title">Profile Information</div>
                    <div className="tp-card-sub">Update your name, phone and photo</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label className="tp-label">Full Name *</label>
                    <input className="tp-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="tp-label">Phone (Office Contact)</label>
                    <input className="tp-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="tp-label">Email</label>
                    <input className="tp-input" value={authUser?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Email cannot be changed</div>
                  </div>
                </div>

                {profileMsg && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12,
                    background: profileMsg.includes('success') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
                    color: profileMsg.includes('success') ? '#15803D' : '#DC2626',
                  }}>{profileMsg}</div>
                )}

                <button
                  className="tp-btn tp-btn-gold"
                  style={{ width: '100%', marginTop: 20 }}
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? 'Saving…' : 'Save Profile Changes'}
                </button>
              </div>

              {/* Security */}
              <div className="tp-card" style={{ padding: 28 }}>
                <div className="tp-card-head" style={{ marginBottom: 22 }}>
                  <div>
                    <div className="tp-card-title">Security Centre</div>
                    <div className="tp-card-sub">Change password and manage access</div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.1)',
                    display: 'grid', placeItems: 'center', color: '#16A34A', fontSize: 14,
                  }}>{I.shield}</div>
                </div>

                <div style={{
                  padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: '#16A34A' }}>{I.shield}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Protection Active</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>256-bit AES encryption</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label className="tp-label">Current Password</label>
                    <input className="tp-input" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="tp-label">New Password</label>
                    <input className="tp-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="tp-label">Confirm New Password</label>
                    <input className="tp-input" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                </div>

                {pwdMsg && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12,
                    background: pwdMsg.includes('success') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
                    color: pwdMsg.includes('success') ? '#15803D' : '#DC2626',
                  }}>{pwdMsg}</div>
                )}

                <button
                  className="tp-btn tp-btn-dark"
                  style={{ width: '100%', marginTop: 20 }}
                  onClick={handleChangePassword}
                  disabled={pwdSaving}
                >
                  {pwdSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the Tamizha Properties admin console?"
        confirmText="Sign Out"
        cancelText="Stay"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
