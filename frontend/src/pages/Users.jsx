import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import FormSelect from '../components/FormSelect';
import {
  Users as UsersIcon, Plus, Trash2, ShieldCheck, UserCheck, X,
  UserPlus, User, Lock, Shield, ChevronDown, Check
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'STAFF' });

  const load = () => {
    api.get('/users').then(r => setUsers(r.data));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setForm({ username: '', password: '', role: 'STAFF' });
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Manage shop administrators and cashier / billing staff</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {u.role === 'ADMIN' ? <ShieldCheck className="w-5 h-5 text-indigo-600" /> : <UserCheck className="w-5 h-5 text-slate-600" />}
              </div>
              <div>
                <div className="text-xs font-black text-slate-800">{u.username}</div>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {u.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(u.id)}
              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition"
              title="Delete User"
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-300/50 shrink-0">
                  <UserPlus className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Add Staff Account
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Create POS operator or administrator credentials
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    placeholder="e.g. cashier1"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  System Role <span className="text-rose-500">*</span>
                </label>
                <FormSelect
                  value={form.role}
                  onChange={(val) => setForm({ ...form, role: val })}
                  options={[
                    { value: 'STAFF', label: 'Staff (POS & Billing)' },
                    { value: 'ADMIN', label: 'Admin (Full Access)' }
                  ]}
                  icon={Shield}
                  triggerClassName="!py-3 !rounded-2xl !bg-slate-100/70 hover:!bg-slate-100/90 !border-slate-200/50 shadow-inner"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition shadow-md shadow-indigo-300 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
