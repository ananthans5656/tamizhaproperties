import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@tamizhaproperties.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      // Role-based redirect after login
      if (res?.user?.role === 'lead') {
        navigate('/lead-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg)',
    }}>
      {/* Left — brand panel */}
      <div style={{
        background: '#0E1117',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(800px 600px at -100px -100px, rgba(226,195,109,0.12), transparent 60%)',
          pointerEvents: 'none',
        }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <img src="/logo.png" alt="Tamizha Properties Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>Tamizha Properties</div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(226,195,109,0.8)', fontWeight: 600 }}>Admin Portal</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(226,195,109,0.7)', fontWeight: 700, marginBottom: 16 }}>
            Real Estate Intelligence
          </div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 48, fontWeight: 500, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 20 }}>
            Premium land,<br/><em style={{ color: '#E2C36D', fontStyle: 'italic' }}>brilliant</em> data.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 380 }}>
            Manage listings, leads and revenue across Tamil Nadu and Southeast Asia — all from one secure dashboard.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, position: 'relative' }}>
          {[
            { val: '147', label: 'Active Listings' },
            { val: '99 Ac', label: 'Land Bank' },
            { val: '₹84 Cr', label: 'Annual Revenue' },
          ].map((s, i) => (
            <div key={i} style={{ paddingRight: 20, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600, color: '#E2C36D', letterSpacing: '-0.5px' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.8px', color: 'var(--ink)', marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Sign in to the Tamizha Properties admin portal</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="tp-float-input"
                placeholder="admin@tamizhaproperties.com"
                style={{ width: '100%', fontSize: 14 }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="tp-float-input"
                  placeholder="Enter your password"
                  style={{ width: '100%', fontSize: 14, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--danger-soft)', border: '1px solid rgba(220,38,38,0.2)',
                fontSize: 13, color: '#B91C1C', fontWeight: 500,
              }}>
                {error}
              </div>
            )}



            {/* Submit */}
            <button
              type="submit"
              className="tp-btn tp-btn-gold"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}/>
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Tamizha Properties · Secure Admin Portal · v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
