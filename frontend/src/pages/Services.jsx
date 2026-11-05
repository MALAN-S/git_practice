import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sliders, Plus, Trash2, Printer, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [rates, setRates] = useState([]);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [svcForm, setSvcForm] = useState({ name: '', description: '', status: 'ACTIVE' });
  const [rateForm, setRateForm] = useState({ serviceId: '', paperSize: 'A4', sides: 'SINGLE', pricePerPage: '', active: true });

  const load = () => {
    api.get('/services').then(r => setServices(r.data));
    api.get('/service-rates').then(r => setRates(r.data));
  };
  useEffect(load, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    await api.post('/services', svcForm);
    setSvcForm({ name: '', description: '', status: 'ACTIVE' });
    setShowSvcModal(false);
    load();
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    await api.post('/service-rates', { ...rateForm, pricePerPage: Number(rateForm.pricePerPage) });
    setRateForm({ serviceId: '', paperSize: 'A4', sides: 'SINGLE', pricePerPage: '', active: true });
    setShowRateModal(false);
    load();
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Delete this service rate?')) return;
    await api.delete(`/service-rates/${id}`);
    load();
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Services & Rates</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Configure Xerox prices, paper sizes (A4, A3, Legal) and rates per page</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSvcModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Service</span>
          </button>
          <button
            onClick={() => setShowRateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Price Rate</span>
          </button>
        </div>
      </div>

      {/* Services Cards */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Catalog</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map(s => (
            <div key={s.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800">{s.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.description || 'No description provided'}</div>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-3 text-center py-6 text-xs text-slate-400 font-medium">No services registered yet.</div>
          )}
        </div>
      </div>

      {/* Rates Table */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configured Rates & Sizes</div>
        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Paper Size</th>
                <th className="py-3 px-4">Printing Side</th>
                <th className="py-3 px-4">Rate / Page</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{r.serviceName}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{r.paperSize}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{r.sides === 'SINGLE' ? 'Single Side' : 'Double Side'}</td>
                  <td className="py-3.5 px-4 font-black text-indigo-700">₹{Number(r.pricePerPage).toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => handleDeleteRate(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-xs text-slate-400 font-medium">No rates configured yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Modal */}
      {showSvcModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">Add Service</h3>
              <button onClick={() => setShowSvcModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Service Name</label>
                <input required placeholder="e.g. Document Printing" value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                <input placeholder="Short details" value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSvcModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">Configure Service Rate</h3>
              <button onClick={() => setShowRateModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRate} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Service</label>
                <select required value={rateForm.serviceId} onChange={e => setRateForm({ ...rateForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Select a service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paper Size</label>
                  <select value={rateForm.paperSize} onChange={e => setRateForm({ ...rateForm, paperSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="A4">A4</option><option value="A3">A3</option><option value="A5">A5</option><option value="LEGAL">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sides</label>
                  <select value={rateForm.sides} onChange={e => setRateForm({ ...rateForm, sides: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="SINGLE">Single Side</option><option value="DOUBLE">Double Side</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price per Page (₹)</label>
                <input required type="number" step="0.01" placeholder="e.g. 2.00" value={rateForm.pricePerPage} onChange={e => setRateForm({ ...rateForm, pricePerPage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRateModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">Save Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
