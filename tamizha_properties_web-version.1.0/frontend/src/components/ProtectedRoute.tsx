import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tp-spinner" />
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>Loading Tamizha Properties…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Lead users trying to access admin routes → redirect to lead dashboard
  if (user.role === 'lead' && (!allowedRoles || !allowedRoles.includes('lead'))) {
    return <Navigate to="/lead-dashboard" replace />;
  }

  // Non-lead users trying to access lead-only routes → redirect to admin dashboard
  if (allowedRoles && allowedRoles.includes('lead') && !allowedRoles.includes(user.role) && user.role !== 'lead') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

