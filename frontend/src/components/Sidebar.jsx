import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  UploadCloud,
  Sliders,
  Boxes,
  BarChart3,
  CreditCard,
  History,
  Users as UsersIcon,
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/billing', label: 'Billing (POS)', icon: Receipt },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/import-csv', label: 'Import Items', icon: UploadCloud },
  { to: '/services', label: 'Services & Rates', icon: Sliders },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/bill-history', label: 'Bill History', icon: History },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white m-3 mr-0 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between p-4 select-none shrink-0">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">Shop</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Management POS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/50 text-indigo-600 shadow-sm border border-indigo-100/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-indigo-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/80 border border-slate-100/80 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200/50">
              M
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Malan</div>
              <div className="text-[10px] text-slate-400 font-medium">Admin</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Do you want to log out?')) {
              window.location.href = '/dashboard';
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
