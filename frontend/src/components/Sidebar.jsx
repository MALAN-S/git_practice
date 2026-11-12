import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../services/settings';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from './Modal';
import {
  Box,
  Home,
  Receipt,
  Package,
  UploadCloud,
  Sliders,
  Boxes,
  BarChart3,
  CreditCard,
  History,
  Users,
  Settings,
  Search,
  Mic,
  LogOut,
  PanelLeftClose,
  ChevronDown,
  Tag,
  Wrench,
  ShieldCheck,
  X
} from 'lucide-react';

const mainLinks = [
  { to: '/dashboard', label: 'Home', icon: Home, perm: 'dashboard' },
  { to: '/billing', label: 'Billing (POS)', icon: Receipt, perm: 'billing' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, perm: 'inventory' },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports' },
  { to: '/expenses', label: 'Expenses', icon: CreditCard, perm: 'expenses' },
  { to: '/bill-history', label: 'Bill History', icon: History, perm: 'bill_history' },
];

const settingsSubLinks = [
  { id: 'users', to: '/users', label: 'User Management', icon: Users, perm: 'users' },
  { id: 'roles', to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles' },
  { id: 'products', to: '/products', label: 'Products', icon: Package, perm: 'products' },
  { id: 'categories', to: '/categories', label: 'Categories', icon: Tag, perm: 'categories' },
  { id: 'services', to: '/services', label: 'Services', icon: Wrench, perm: 'services' },
  { id: 'import', to: '/import-csv', label: 'Import Items', icon: UploadCloud, perm: 'import' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useStoreSettings();
  const { user, logout, hasPermission } = useAuth();

  // Collapsed state with local storage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('shop_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Settings accordion open/close
  const isMasterRoute = ['/products', '/categories', '/services', '/import-csv', '/products/import', '/users', '/roles'].includes(location.pathname);
  const isSettingsActive = location.pathname === '/settings';
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive || isMasterRoute);

  useEffect(() => {
    if (isSettingsActive || isMasterRoute) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  // Live master data counts
  const [counts, setCounts] = useState({});

  useEffect(() => {
    Promise.allSettled([
      api.get('/products'),
      api.get('/categories'),
      api.get('/services')
    ]).then(([p, c, s]) => {
      setCounts({
        products: p.status === 'fulfilled' && Array.isArray(p.value.data) ? p.value.data.length : null,
        categories: c.status === 'fulfilled' && Array.isArray(c.value.data) ? c.value.data.length : null,
        services: s.status === 'fulfilled' && Array.isArray(s.value.data) ? s.value.data.length : null,
      });
    }).catch(() => {});
  }, []);

  // Save collapsed state
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('shop_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Filter links based on search and permissions
  const visibleMainLinks = mainLinks.filter(l => (hasPermission ? hasPermission(l.perm) : true));
  const visibleSettingsSubLinks = settingsSubLinks.filter(l => (hasPermission ? hasPermission(l.perm) : true));

  const allLinks = [
    ...visibleMainLinks,
    ...visibleSettingsSubLinks,
    { to: '/settings', label: 'Settings', icon: Settings }
  ];
  const filteredLinks = searchQuery.trim()
    ? allLinks.filter((l) =>
        l.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleMainLinks;

  const renderLink = (link) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.to;

    return (
      <div key={link.to} className="relative group flex justify-center">
        <NavLink
          to={link.to}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
          } rounded-2xl text-xs font-semibold transition-all duration-150 ${
            isActive
              ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100/90'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
              isActive
                ? 'text-slate-900 stroke-[2.4]'
                : 'text-slate-400 group-hover:text-slate-700 stroke-[1.8]'
            }`}
          />
          {!isCollapsed && <span className="truncate">{link.label}</span>}
        </NavLink>

        {/* Sleek Tooltip in Collapsed Mode */}
        {isCollapsed && (
          <div className="pointer-events-none absolute left-full ml-3 z-50 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100">
            <div className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
              {link.label}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } bg-[#f8f9fa] m-3 mr-0 rounded-[32px] border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col justify-between p-3.5 select-none shrink-0 print:hidden no-print z-40`}
    >
      {/* Top Section */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } px-2 py-2 mb-3.5`}
        >
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Box className="w-5 h-5 stroke-[2.2]" />
            </div>

            {!isCollapsed && (
              <span className="text-lg font-black text-slate-900 tracking-tight truncate max-w-[150px]" title={settings.shopName || 'Shop'}>
                {settings.shopName || 'Shop'}
              </span>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              title="Collapse sidebar"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Bar (Only shown in expanded mode) */}
        {!isCollapsed && (
          <div className="relative mb-3.5 px-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-8 py-2 bg-slate-200/60 hover:bg-slate-200/80 focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-slate-300 focus:outline-none transition-all duration-200"
            />
            <Mic className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer hover:text-slate-600" />
          </div>
        )}

        {/* Navigation Items (Scrollable) */}
        <div className="overflow-y-auto no-scrollbar space-y-1 pr-0.5 flex-1">
          {/* Regular nav links (or filtered search results) */}
          {filteredLinks.map((link) => renderLink(link))}

          {/* Settings Accordion (hidden during search if not matched, hidden if no sub-permissions) */}
          {!searchQuery.trim() && visibleSettingsSubLinks.length > 0 && (
            <>
              {isCollapsed ? (
                // Collapsed mode: just show Settings icon
                <div className="relative group flex justify-center">
                  <NavLink
                    to="/settings"
                    className={`w-full flex items-center justify-center p-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                      isSettingsActive
                        ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100/90'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Settings
                      className={`w-4 h-4 shrink-0 ${
                        isSettingsActive ? 'text-slate-900 stroke-[2.4]' : 'text-slate-400 group-hover:text-slate-700 stroke-[1.8]'
                      }`}
                    />
                  </NavLink>
                  <div className="pointer-events-none absolute left-full ml-3 z-50 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100">
                    <div className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      Settings
                    </div>
                  </div>
                </div>
              ) : (
                // Expanded mode: Settings accordion
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <NavLink
                      to="/settings"
                      onClick={() => setSettingsOpen(true)}
                      className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        isSettingsActive
                          ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100/90'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <Settings
                        className={`w-4 h-4 shrink-0 ${
                          isSettingsActive ? 'text-slate-900 stroke-[2.4]' : 'text-slate-400 stroke-[1.8]'
                        }`}
                      />
                      <span className="truncate flex-1 text-left">Settings</span>
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      title="Toggle Master Data"
                      className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-2xl transition"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          settingsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {settingsOpen && (
                    <div className="space-y-0.5 mt-0.5">
                      {visibleSettingsSubLinks.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          location.pathname === sub.to ||
                          (sub.to === '/import-csv' && location.pathname === '/products/import');
                        return (
                          <div key={sub.to} className="relative group flex justify-center">
                            <NavLink
                              to={sub.to}
                              className={`w-full flex items-center gap-3 pl-9 pr-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                                isSubActive
                                  ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100/90'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                              }`}
                            >
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-slate-900 stroke-[2.4]' : 'text-slate-400 group-hover:text-slate-700 stroke-[1.8]'
                                }`}
                              />
                              <span className="truncate flex-1">{sub.label}</span>
                              {counts[sub.id] != null && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isSubActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
                                }`}>
                                  {counts[sub.id]}
                                </span>
                              )}
                            </NavLink>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Card & Logout (Bottom Section) */}
      <div className="pt-2 border-t border-slate-200/70 mt-2">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200/60 mb-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.username || 'User'}</div>
                <div className="text-[10px] text-slate-400 font-medium">{user?.role || 'Staff'}</div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative group flex justify-center">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="pointer-events-none absolute left-full ml-3 z-50 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100">
              <div className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                {user?.username || 'User'} (Logout)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} maxWidth="max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-200/60 shrink-0">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Log Out
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Are you sure you want to log out?
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(false)}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200/60 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-slate-800 truncate">
              {user?.username || 'User'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Logged in as <span className="font-bold text-slate-700">{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-medium relative z-10 leading-relaxed">
          You will be returned to the login screen and will need your credentials to access the system again.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 relative z-10">
          <button
            type="button"
            onClick={() => setShowLogoutModal(false)}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLogoutModal(false);
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-rose-200 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </Modal>
    </aside>
  );
}
