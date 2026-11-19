import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import {
  Truck, Plus, Search, Pencil, Trash2, X, Check,
  Phone, Mail, MapPin, Hash, CheckCircle2, AlertCircle
} from 'lucide-react';

const emptyForm = {
  name: '', phone: '', email: '', address: '', gstNumber: '', status: 'ACTIVE'
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/suppliers');
      setSuppliers(r.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      gstNumber: s.gstNumber || '',
      status: s.status || 'ACTIVE'
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
        setSuccess(`Supplier '${form.name}' updated`);
      } else {
        await api.post('/suppliers', form);
        setSuccess(`Supplier '${form.name}' created`);
      }
      setModalOpen(false);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    }
    setSubmitting(false);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete supplier '${s.name}'?`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      setSuccess(`Supplier '${s.name}' deleted`);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete supplier — may have linked purchases.');
    }
  };

  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = suppliers.length - activeCount;

  const filtered = suppliers.filter(s => {
    const term = search.toLowerCase().trim();
    if (term) {
      const match = [s.name, s.phone, s.email, s.gstNumber].some(f => (f || '').toLowerCase().includes(term));
      if (!match) return false;
    }
    if (filterStatus === 'active') return s.status === 'ACTIVE';
    if (filterStatus === 'inactive') return s.status !== 'ACTIVE';
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Manage vendor contact details, GST, and procurement accounts</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Supplier</span>
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Suppliers</span>
          <div className="mt-2 text-2xl font-black text-blue-700 tracking-tight">{suppliers.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Vendors</span>
          <div className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">{activeCount}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive</span>
          <div className="mt-2 text-2xl font-black text-slate-700 tracking-tight">{inactiveCount}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers by name, phone, GST..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold self-end sm:self-auto">
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg transition capitalize ${filterStatus === f ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              {f === 'all' ? `All (${suppliers.length})` : f === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Supplier Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">GST No.</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-xs text-slate-400 font-medium">Loading suppliers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-xs text-slate-400 font-medium">No suppliers found.</td></tr>
              ) : filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-slate-700 stroke-[2]" />
                      <div>
                        <span className="font-black text-slate-900 text-xs tracking-tight block">{s.name}</span>
                        {s.address && <span className="text-[11px] text-slate-400 truncate max-w-xs block">{s.address}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{s.phone || '—'}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{s.email || '—'}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{s.gstNumber || '—'}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition" title="Edit">
                        <Pencil className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition" title="Delete">
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-lg">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-300/50 shrink-0">
              <Truck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{editing ? 'Edit Supplier' : 'New Supplier'}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{editing ? 'Update supplier details' : 'Add a new vendor or procurement partner'}</p>
            </div>
          </div>
          <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 relative z-10 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Supplier / Company Name <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sri Balaji Papers & Stationeries" className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="orders@supplier.com" className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Address</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address, City, State" className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Number</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <input value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} placeholder="33AAAAA0000A1Z5" className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 border border-slate-200/50 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-inner">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-blue-300 active:scale-95 disabled:opacity-50">
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Supplier'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
