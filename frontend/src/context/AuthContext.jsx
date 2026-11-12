import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// All available permission keys
export const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Home / Dashboard', group: 'Main' },
  { key: 'billing', label: 'Billing (POS)', group: 'Main' },
  { key: 'inventory', label: 'Inventory', group: 'Main' },
  { key: 'reports', label: 'Reports', group: 'Main' },
  { key: 'expenses', label: 'Expenses', group: 'Main' },
  { key: 'bill_history', label: 'Bill History', group: 'Main' },
  { key: 'users', label: 'User Management', group: 'Settings' },
  { key: 'roles', label: 'Roles & Permissions', group: 'Settings' },
  { key: 'products', label: 'Products', group: 'Settings' },
  { key: 'categories', label: 'Categories', group: 'Settings' },
  { key: 'services', label: 'Services', group: 'Settings' },
  { key: 'import', label: 'Import Items', group: 'Settings' },
];

// Map route paths to permission keys
export const ROUTE_PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/billing': 'billing',
  '/inventory': 'inventory',
  '/reports': 'reports',
  '/expenses': 'expenses',
  '/bill-history': 'bill_history',
  '/users': 'users',
  '/roles': 'roles',
  '/products': 'products',
  '/categories': 'categories',
  '/services': 'services',
  '/import-csv': 'import',
  '/products/import': 'import',
  '/settings': 'settings',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('shop_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('shop_auth_token') || null;
    } catch {
      return null;
    }
  });

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('shop_auth_user', JSON.stringify(userData));
      localStorage.setItem('shop_auth_token', authToken);
    } catch {}
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('shop_auth_user');
      localStorage.removeItem('shop_auth_token');
    } catch {}
  };

  // Check if current user has a specific permission
  const hasPermission = (permKey) => {
    if (!user) return false;
    // ADMIN always has full access
    if (user.role === 'ADMIN') return true;
    // STAFF: check comma-separated permissions string
    const perms = (user.permissions || '').split(',').map(p => p.trim()).filter(Boolean);
    return perms.includes(permKey);
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
