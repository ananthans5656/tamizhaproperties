import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import All Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AddPropertyPage from './pages/AddPropertyPage';
import LeadsPage from './pages/LeadsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EnquiriesPage from './pages/EnquiriesPage';
import AboutPage from './pages/AboutPage';

import ProfilePage from './pages/ProfilePage';
import LeadDashboardPage from './pages/LeadDashboardPage';
import SiteVisitsPage from './pages/SiteVisitsPage';
import PublicPropertyPage from './pages/PublicPropertyPage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/p/:id" element={<PublicPropertyPage />} />

          {/* Lead-only Portal */}
          <Route path="/lead-dashboard" element={<ProtectedRoute allowedRoles={['lead']}><LeadDashboardPage /></ProtectedRoute>} />

          {/* Secure Workspace Routes (Admin/Agent) */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/properties" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><PropertiesPage /></ProtectedRoute>} />
          <Route path="/properties/add" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><AddPropertyPage /></ProtectedRoute>} />
          <Route path="/properties/edit/:id" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><AddPropertyPage /></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><PropertyDetailPage /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><LeadsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/enquiries" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><EnquiriesPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><Navigate to="/profile" replace /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><AboutPage /></ProtectedRoute>} />
          <Route path="/visits" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><SiteVisitsPage /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'agent', 'user']}><ProfilePage /></ProtectedRoute>} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

