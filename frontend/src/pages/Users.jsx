import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users as UsersIcon, Plus, Trash2, ShieldCheck, UserCheck, X } from 'lucide-react';

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
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">Add Staff Account</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Username</label>
                <input required placeholder="e.g. cashier1" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
                <input required type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="STAFF">Staff (POS & Billing)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
