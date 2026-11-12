import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { loadSettingsFromServer } from './services/settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import ImportCsv from './pages/ImportCsv';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import BillHistory from './pages/BillHistory';
import Users from './pages/Users';
import RolesPermissions from './pages/RolesPermissions';
import Settings from './pages/Settings';
import Categories from './pages/Categories';

/* ── Protected route wrapper with permission check ── */
function ProtectedRoute({ children, permKey, fallback = '/dashboard' }) {
  const { isAuthenticated, hasPermission } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (permKey && hasPermission && !hasPermission(permKey)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

/* ── Main layout (sidebar + content) ── */
function AppLayout() {
  const { isAuthenticated, user, hasPermission } = useAuth();

  useEffect(() => {
    loadSettingsFromServer();
  }, [isAuthenticated]);

  // If not logged in, render ONLY login route (no sidebar, no dashboard)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Determine user's default permitted landing page
  const defaultPage = (user?.role === 'ADMIN' || (hasPermission && hasPermission('dashboard')))
    ? '/dashboard'
    : ((hasPermission && hasPermission('billing')) ? '/billing' : '/dashboard');

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0 print:m-0 print:h-auto print:block">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPage} replace />} />
          <Route path="/login" element={<Navigate to={defaultPage} replace />} />
          <Route path="/dashboard" element={<ProtectedRoute permKey="dashboard" fallback={defaultPage}><Dashboard /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute permKey="billing" fallback={defaultPage}><Billing /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute permKey="products" fallback={defaultPage}><Products /></ProtectedRoute>} />
          <Route path="/import-csv" element={<ProtectedRoute permKey="import" fallback={defaultPage}><ImportCsv /></ProtectedRoute>} />
          <Route path="/products/import" element={<ProtectedRoute permKey="import" fallback={defaultPage}><ImportCsv /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute permKey="services" fallback={defaultPage}><Services /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute permKey="inventory" fallback={defaultPage}><Inventory /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permKey="reports" fallback={defaultPage}><Reports /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute permKey="expenses" fallback={defaultPage}><Expenses /></ProtectedRoute>} />
          <Route path="/bill-history" element={<ProtectedRoute permKey="bill_history" fallback={defaultPage}><BillHistory /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute permKey="users" fallback={defaultPage}><Users /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute permKey="roles" fallback={defaultPage}><RolesPermissions /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute permKey="categories" fallback={defaultPage}><Categories /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute fallback={defaultPage}><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={defaultPage} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}
