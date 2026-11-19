import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { ALL_PERMISSIONS } from '../context/AuthContext';
import {
  ShieldCheck,
  Shield,
  Users as UsersIcon,
  Crown,
  Layers,
  Info,
  LayoutGrid,
  ChevronRight,
  Check,
  Trash2,
  Plus,
  Save,
  Home,
  Receipt,
  Boxes,
  BarChart3,
  CreditCard,
  History,
  Package,
  Tag,
  Wrench,
  UploadCloud,
  User,
  Settings as SettingsIcon,
  X,
  Lock,
  UserPlus
} from 'lucide-react';

const permIconMap = {
  dashboard: Home,
  billing: Receipt,
  inventory: Boxes,
  reports: BarChart3,
  expenses: CreditCard,
  bill_history: History,
  users: UsersIcon,
  roles: ShieldCheck,
  products: Package,
  categories: Tag,
  services: Wrench,
  import: UploadCloud,
};

export default function RolesPermissions() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'details' | 'users'
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');

  // Add Role Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    username: '',
    password: '',
    role: 'STAFF',
    permissions: ['dashboard', 'billing']
  });

  const load = () => {
    api.get('/users').then((r) => {
      const data = r.data || [];
      setUsers(data);
      // Auto-select staff1 or first staff user, or admin if no staff
      if (!selectedUser && data.length > 0) {
        const staff = data.find((u) => u.username === 'staff1') || data.find((u) => u.role === 'STAFF') || data[0];
        selectUser(staff);
      } else if (selectedUser) {
        // Refresh selected user
        const updated = data.find((u) => u.id === selectedUser.id);
        if (updated) {
          setSelectedUser(updated);
          const perms = (updated.permissions || '').split(',').map((p) => p.trim()).filter(Boolean);
          setUserPerms(perms);
        }
      }
    });
  };

  useEffect(() => {
    load();
  }, []);

  const selectUser = (user) => {
    setSelectedUser(user);
    if (user.role === 'ADMIN') {
      setUserPerms(ALL_PERMISSIONS.map((p) => p.key));
    } else {
      const perms = (user.permissions || '').split(',').map((p) => p.trim()).filter(Boolean);
      setUserPerms(perms);
    }
  };

  const togglePerm = (key) => {
    if (selectedUser?.role === 'ADMIN') return; // Admin always has all
    setUserPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedUser?.role === 'ADMIN') return;
    setUserPerms(ALL_PERMISSIONS.map((p) => p.key));
  };

  const clearAll = () => {
    if (selectedUser?.role === 'ADMIN') return;
    setUserPerms([]);
  };

  const savePermissions = async () => {
    if (!selectedUser || selectedUser.role === 'ADMIN') return;
    setSaving(true);
    try {
      await api.put(`/users/${selectedUser.id}/permissions`, {
        permissions: userPerms.join(','),
      });
      setNotification(`Permissions updated for ${selectedUser.username}`);
      load();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoleUser = async (e) => {
    e.preventDefault();
    if (!newRoleForm.username.trim() || !newRoleForm.password.trim()) {
      alert('Please enter username and password');
      return;
    }
    try {
      await api.post('/users', {
        username: newRoleForm.username.trim(),
        password: newRoleForm.password,
        role: newRoleForm.role,
        permissions: newRoleForm.permissions.join(','),
      });
      setShowAddModal(false);
      setNewRoleForm({
        username: '',
        password: '',
        role: 'STAFF',
        permissions: ['dashboard', 'billing'],
      });
      setNotification('Role account created successfully!');
      load();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create role');
    }
  };

  const mainPerms = ALL_PERMISSIONS.filter((p) => p.group === 'Main');
  const settingsPerms = ALL_PERMISSIONS.filter((p) => p.group === 'Settings');

  const staffUsers = users.filter((u) => u.role === 'STAFF');
  const adminUsers = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-xl shadow-indigo-500/25 animate-bounce">
          <Check className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Main Dual-Panel Workspace matching Reference Image */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ──────── Left Panel: Roles List ──────── */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Roles</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-200 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Role</span>
            </button>
          </div>

          {/* Role Cards List */}
          <div className="space-y-2.5">
            {/* Staff Users / Roles */}
            {staffUsers.map((u) => {
              const permCount = (u.permissions || '').split(',').filter(Boolean).length;
              const isSelected = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-slate-300 bg-white shadow-sm'
                      : 'border-transparent bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-slate-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <User className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-900 leading-tight truncate">
                      {u.username}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {permCount} permission{permCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Admin Role Card */}
            {adminUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-slate-300 bg-white shadow-sm'
                      : 'border-transparent bg-white hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-900 leading-tight truncate">
                      {u.username}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Full Access
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ──────── Right Panel: Tabs & Permissions Workspace ──────── */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
          {/* Top Tabs Bar */}
          <div className="flex items-center gap-6 border-b border-slate-100 pb-3 mb-5">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-2 pb-1 text-sm font-bold transition-all relative ${
                activeTab === 'permissions'
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Permissions</span>
              {activeTab === 'permissions' && (
                <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 pb-1 text-sm font-bold transition-all relative ${
                activeTab === 'details'
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Role Details</span>
              {activeTab === 'details' && (
                <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            {/* Users tab commented out
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 pb-1 text-sm font-bold transition-all relative ${
                activeTab === 'users'
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Users ({selectedUser?.role === 'ADMIN' ? adminUsers.length : 1})</span>
              {activeTab === 'users' && (
                <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
            */}
          </div>

          {/* TAB 1: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              {/* Header Row: Target User + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-300">
                    <User className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Permissions for: {selectedUser?.username || 'Role'}
                    </h3>
                    {selectedUser?.role === 'ADMIN' && (
                      <span className="text-[11px] font-bold text-amber-600">
                        Administrator has full unrestricted access to all features
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Action Pills */}
                {selectedUser?.role !== 'ADMIN' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Select All</span>
                    </button>
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                    <button
                      onClick={savePermissions}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-200 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 1: MAIN PAGES */}
              <div className="space-y-3">
                {/* Section Header Banner */}
                <div className="w-full bg-gradient-to-r from-indigo-100/90 via-indigo-50 to-blue-50/50 border border-indigo-200/70 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-950 tracking-tight">
                      Main Pages
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </div>

                {/* 3-Column Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mainPerms.map((perm) => {
                    const Icon = permIconMap[perm.key] || ShieldCheck;
                    const isChecked = userPerms.includes(perm.key);
                    const isAdmin = selectedUser?.role === 'ADMIN';

                    return (
                      <div
                        key={perm.key}
                        onClick={() => togglePerm(perm.key)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 select-none ${
                          isAdmin
                            ? 'bg-white border-slate-200/80 cursor-default'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon className={`w-4 h-4 shrink-0 stroke-[2] ${
                            isChecked ? 'text-indigo-600' : 'text-slate-400'
                          }`} />
                          <span
                            className={`text-xs font-bold truncate leading-tight ${
                              isChecked ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {perm.label}
                          </span>
                        </div>

                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: SETTINGS PAGES */}
              <div className="space-y-3 pt-2">
                {/* Section Header Banner */}
                <div className="w-full bg-gradient-to-r from-indigo-100/90 via-indigo-50 to-slate-50/50 border border-indigo-200/70 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-950 tracking-tight">
                      Settings Pages
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </div>

                {/* 3-Column Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settingsPerms.map((perm) => {
                    const Icon = permIconMap[perm.key] || ShieldCheck;
                    const isChecked = userPerms.includes(perm.key);
                    const isAdmin = selectedUser?.role === 'ADMIN';

                    return (
                      <div
                        key={perm.key}
                        onClick={() => togglePerm(perm.key)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 select-none ${
                          isAdmin
                            ? 'bg-white border-slate-200/80 cursor-default'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon className={`w-4 h-4 shrink-0 stroke-[2] ${
                            isChecked ? 'text-indigo-600' : 'text-slate-400'
                          }`} />
                          <span
                            className={`text-xs font-bold truncate leading-tight ${
                              isChecked ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {perm.label}
                          </span>
                        </div>

                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Save Action */}
              {selectedUser?.role !== 'ADMIN' && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-200 disabled:opacity-60 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Permissions'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROLE DETAILS */}
          {activeTab === 'details' && selectedUser && (
            <div className="space-y-4 max-w-lg">
              <h4 className="text-sm font-black text-slate-900">Role Information</h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Role Identifier:</span>
                  <span className="font-bold text-slate-800">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Type:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    selectedUser.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Total Permissions:</span>
                  <span className="font-bold text-slate-800">
                    {selectedUser.role === 'ADMIN' ? 'All (12/12)' : `${userPerms.length} of ${ALL_PERMISSIONS.length}`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">System Status:</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS LIST (Commented out)
          activeTab === 'users' && (
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 mb-2">
                Users with this role ({selectedUser?.role === 'ADMIN' ? adminUsers.length : 1})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedUser?.role === 'ADMIN' ? adminUsers : [selectedUser]).filter(Boolean).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-300">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{u.username}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{u.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          */}
        </div>
      </div>

      {/* Add Role / User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Create New Role / Staff</h3>
              <p className="text-xs text-slate-400 font-medium">Add staff account with permissions</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateRoleUser} className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role / Username <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <input
                required
                placeholder="e.g. cashier1 or staff2"
                value={newRoleForm.username}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, username: e.target.value })}
                className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={newRoleForm.password}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, password: e.target.value })}
                className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = newRoleForm.permissions.includes(perm.key);
                return (
                  <button
                    type="button"
                    key={perm.key}
                    onClick={() => {
                      const next = isChecked
                        ? newRoleForm.permissions.filter((p) => p !== perm.key)
                        : [...newRoleForm.permissions, perm.key];
                      setNewRoleForm({ ...newRoleForm, permissions: next });
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs font-bold transition ${
                      isChecked
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-1">{perm.label}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-200"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
