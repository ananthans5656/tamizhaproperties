import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { I } from './Icons';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import { leadsApi } from '../api/leads.api';
import { propertiesApi } from '../api/properties.api';
import { siteVisitsApi } from '../api/siteVisits.api';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [counts, setCounts] = useState({ properties: '', leads: '', visits: '' });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [leadsRes, propsRes, visitsRes] = await Promise.all([
          leadsApi.getAll({ limit: 500 }),
          propertiesApi.getAll({ limit: 500 }),
          siteVisitsApi.getAll(),
        ]);
        const crmLeads = (leadsRes.data || []).filter((l: any) => l.source !== 'User App Chat');
        const tentative = (visitsRes || []).filter((v: any) =>
          String(v.status).toLowerCase() === 'tentative'
        ).length;
        setCounts({
          leads: String(crmLeads.length),
          properties: String(propsRes.total || propsRes.data?.length || 0),
          visits: tentative > 0 ? String(tentative) : '',
        });
      } catch (_) {}
    };
    fetchCounts();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { id: 'properties', label: 'Properties', icon: 'building', path: '/properties', count: counts.properties },
    { id: 'leads', label: 'Leads CRM', icon: 'leads', path: '/leads', count: counts.leads },
    { id: 'enquiries', label: 'Enquiries', icon: 'inbox', path: '/enquiries' },
    { id: 'visits', label: 'Site Visits', icon: 'calendar', path: '/visits', count: counts.visits },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  return (
    <aside className="tp-sidebar">
      <div className="tp-logo">
        <img src="/logo.png" alt="Tamizha Properties Logo" style={{ width: 42, height: 42, objectFit: 'contain', marginRight: 8 }} />
        <div className="tp-logo-text">
          <span className="tp-logo-name">Tamizha</span>
          <span className="tp-logo-sub">Properties</span>
        </div>
      </div>

      <div className="tp-nav-label">Workspace</div>
      {navItems.map(n => (
        <NavLink
          key={n.id}
          to={n.path}
          className={({ isActive }) => `tp-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="tp-nav-icon">{I[n.icon]}</span>
          <span>{n.label}</span>
          {n.count && <span className="tp-nav-count">{n.count}</span>}
        </NavLink>
      ))}

      <div className="tp-nav-label">Account</div>

      <NavLink
        to="/profile"
        className={({ isActive }) => `tp-nav-item${isActive ? ' active' : ''}`}
      >
        <span className="tp-nav-icon">{I.users}</span>
        <span>Profile</span>
      </NavLink>

      {/* Interactive Logout click handler */}
      <div
        className="tp-nav-item"
        onClick={handleLogoutClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="tp-nav-icon">{I.logout}</span>
        <span>Logout</span>
      </div>

      <div className="tp-sidebar-foot">
        <div 
          onClick={() => navigate('/about')}
          style={{
            background: 'rgba(226,195,109,0.06)',
            border: '1px solid rgba(226,195,109,0.15)',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
          className="tp-about-box"
        >
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>About Portal</div>
          <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', lineHeight: '1.4' }}>Click to view project details & platform insights</div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to log out of the Tamizha Properties admin console?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}
