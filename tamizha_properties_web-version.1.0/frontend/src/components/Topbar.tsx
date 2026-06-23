import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { I } from './Icons';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  isNew: boolean;
}

function useApiNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    client.get('/leads?limit=5').then(r => {
      const leads = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      const notifs: Notification[] = leads.slice(0, 5).map((lead: any, i: number) => {
        const name = lead.name ?? 'Unknown Lead';
        const interest = lead.property_interest ?? lead.propertyInterest ?? 'a property';
        const status = lead.status ?? 'NEW';
        const updatedAt = lead.updated_at ? new Date(lead.updated_at) : new Date();
        const diffMin = Math.floor((Date.now() - updatedAt.getTime()) / 60000);
        const time = diffMin < 1 ? 'Just now' : diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` : `${Math.floor(diffMin / 1440)}d ago`;
        let title = '', body = '';
        if (status === 'HOT') { title = `🔥 HOT Lead — ${name}`; body = `${name} is highly interested in "${interest}". Follow up now!`; }
        else if (status === 'WARM') { title = `🌟 WARM Lead — ${name}`; body = `${name} scored WARM on "${interest}". Schedule a callback.`; }
        else if (status === 'CLOSED') { title = `✅ Deal Closed — ${name}`; body = `${name} successfully closed on "${interest}".`; }
        else if (status === 'LOST') { title = `❌ Lead Lost — ${name}`; body = `${name} dropped interest in "${interest}".`; }
        else { title = `📋 New Lead — ${name}`; body = `${name} enquired about "${interest}" from ${lead.city ?? 'Unknown'}.`; }
        return { id: lead.id?.toString() ?? `${i}`, title, body, time, isNew: i === 0 };
      });
      setNotifications(notifs);
      if (notifs.length > 0) setHasUnread(true);
    }).catch(() => {});
  }, []);

  const markAllRead = () => setHasUnread(false);
  return { notifications, hasUnread, markAllRead };
}

interface TopbarProps {
  searchPlaceholder?: string;
}

interface CommandItem {
  icon: string;
  label: string;
  sub: string;
  path: string;
  action?: () => void;
}

export default function Topbar({ searchPlaceholder = 'Search properties, leads, agents…' }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Dropdown & Modal States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { notifications: liveNotifications, hasUnread, markAllRead } = useApiNotifications();

  // Search input inside Command Palette
  const [paletteQuery, setPaletteQuery] = useState('');
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for ⌘ K or Ctrl K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when Command Palette is opened
  useEffect(() => {
    if (isPaletteOpen && paletteInputRef.current) {
      setTimeout(() => paletteInputRef.current?.focus(), 80);
    }
  }, [isPaletteOpen]);

  // Commands seeded for ⌘ K search
  const commands: CommandItem[] = [
    { icon: 'home', label: 'Dashboard Console', sub: 'Go to workspace main stats overview', path: '/dashboard' },
    { icon: 'property', label: 'View Properties Listing', sub: 'Manage houses, villas, and plots database', path: '/properties' },
    { icon: 'plus', label: 'Add New Property listing', sub: 'Insert a new verified asset or land', path: '/properties/add' },
    { icon: 'leads', label: 'Leads CRM Pipeline', sub: 'Dispatches, WhatsApps, and client logs', path: '/leads' },
    { icon: 'cal', label: 'Boardroom Analytics', sub: 'Review sales reports and agent performance', path: '/reports' },
    { icon: 'globe', label: 'District Performance Price Index', sub: 'Check Chennai, Coimbatore, and Tirunelveli trends', path: '/analytics' },
    { icon: 'more', label: 'Client Enquiries', sub: 'Read incoming feedback and contacts', path: '/enquiries' },
    { icon: 'plus', label: 'Account Profile settings', sub: 'Manage workspace details and credentials', path: '/settings' },
    {
      icon: 'check',
      label: 'Logout Administrator Session',
      sub: 'Safely clear credentials and log out',
      path: '/login',
      action: () => {
        logout();
        navigate('/login');
      }
    }
  ];

  // Filter commands by search text
  const filteredCommands = commands.filter(c =>
    c.label.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    c.sub.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  const handleCommandClick = (cmd: CommandItem) => {
    setIsPaletteOpen(false);
    setPaletteQuery('');
    if (cmd.action) {
      cmd.action();
    } else {
      navigate(cmd.path);
    }
  };

  return (
    <div className="tp-topbar">
      {/* Clickable Search input triggers Command Palette */}
      <div className="tp-search" style={{ cursor: 'pointer' }} onClick={() => setIsPaletteOpen(true)}>
        {I.search}
        <input
          placeholder={searchPlaceholder}
          readOnly
          style={{ cursor: 'pointer' }}
        />
        <span className="tp-search-kbd">⌘ K</span>
      </div>

      <div className="tp-top-right">
        {/* Notifications Dropdown Bell */}
        <div style={{ position: 'relative' }}>
          <div className="tp-icon-btn" onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}>
            {I.bell}
            {hasUnread && <span className="badge-dot"></span>}
          </div>
          {isNotificationsOpen && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              width: 320,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              zIndex: 999,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>🔴 Live Notifications</span>
                {hasUnread && (
                  <button
                    onClick={markAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-deep)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {liveNotifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                    No lead activity yet
                  </div>
                ) : liveNotifications.map((n, i) => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < liveNotifications.length - 1 ? '1px solid var(--border-2)' : 'none',
                    background: n.isNew ? 'rgba(226,195,109,0.04)' : 'transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--text-2)', margin: 0 }}>{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile Pill */}
        <div style={{ position: 'relative' }}>
          <div className="tp-profile" onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}>
            <div className="tp-avatar">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user ? user.name.split(' ').map(s => s[0]).join('') : 'KR'
              )}
            </div>
            <div className="tp-profile-text">
              <span className="tp-profile-name">{user ? user.name : 'Karthik Raja'}</span>
              <span className="tp-profile-role">{user ? user.role : 'Head of Operations'}</span>
            </div>
          </div>
          {isProfileOpen && (
            <div style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              width: 200,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              zIndex: 999,
              overflow: 'hidden',
              padding: '6px 0'
            }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-2)', fontSize: 12, color: 'var(--text-3)' }}>
                {user ? user.email : 'karthik@tamizha.com'}
              </div>
              <button
                onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
              >
                ⚙️ Account Settings
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); setIsProfileOpen(false); }}
                style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12.5, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
              >
                🔒 Logout Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette Modal (⌘ K Glassmorphic modal) */}
      {isPaletteOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)',
          display: 'grid',
          placeItems: 'start center',
          paddingTop: 80,
          zIndex: 99999
        }} onClick={() => setIsPaletteOpen(false)}>
          <div
            className="tp-card"
            style={{ width: 560, maxHeight: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid var(--border-1)', background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border-2)' }}>
              {I.search}
              <input
                ref={paletteInputRef}
                type="text"
                placeholder="Type a page, command, or shortcut (e.g. leads)..."
                value={paletteQuery}
                onChange={e => setPaletteQuery(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14.5, background: 'transparent' }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-3)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--f-mono)' }}>ESC to close</span>
            </div>

            {/* Matching Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {filteredCommands.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No commands found matching "{paletteQuery}"
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCommandClick(cmd)}
                    style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-warm)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', color: 'var(--gold-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {I[cmd.icon] || '📁'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{cmd.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cmd.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--f-mono)' }}>
                      ↵ Enter
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
