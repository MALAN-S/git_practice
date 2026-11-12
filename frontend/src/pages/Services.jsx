import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import FormSelect from '../components/FormSelect';
import {
  Printer,
  Plus,
  Search,
  Pencil,
  Trash2,
  Sliders,
  Layers,
  CheckCircle2,
  FileText,
  X,
  ChevronDown,
  IndianRupee,
  Tag,
  Check,
  Copy
} from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all_rates'); // 'all_rates', 'single', 'double', 'services'
  const [success, setSuccess] = useState(null);

  // Modals & Editing states
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [svcForm, setSvcForm] = useState({ name: '', description: '', status: 'ACTIVE' });

  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRateId, setEditingRateId] = useState(null);
  const [rateForm, setRateForm] = useState({
    serviceId: '',
    paperSize: 'A4',
    sides: 'SINGLE',
    pricePerPage: '',
    active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [svcRes, rateRes] = await Promise.all([
        api.get('/services'),
        api.get('/service-rates')
      ]);
      setServices(svcRes.data || []);
      setRates(rateRes.data || []);
    } catch (err) {
      console.error('Failed to load services & rates:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNewServiceModal = () => {
    setEditingSvcId(null);
    setSvcForm({ name: '', description: '', status: 'ACTIVE' });
    setShowSvcModal(true);
  };

  const handleEditService = (s) => {
    setEditingSvcId(s.id);
    setSvcForm({
      name: s.name,
      description: s.description || '',
      status: s.status || 'ACTIVE'
    });
    setShowSvcModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!svcForm.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingSvcId) {
        await api.put(`/services/${editingSvcId}`, svcForm);
        setSuccess(`Service '${svcForm.name}' updated successfully`);
      } else {
        await api.post('/services', svcForm);
        setSuccess(`Service '${svcForm.name}' created successfully`);
      }
      setSvcForm({ name: '', description: '', status: 'ACTIVE' });
      setEditingSvcId(null);
      setShowSvcModal(false);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service');
    }
    setSubmitting(false);
  };

  const handleToggleServiceStatus = async (s) => {
    try {
      const newStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/services/${s.id}`, {
        name: s.name,
        description: s.description,
        status: newStatus
      });
      setSuccess(`Service '${s.name}' status changed to ${newStatus}`);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update service status');
    }
  };

  const openNewRateModal = () => {
    setEditingRateId(null);
    setRateForm({
      serviceId: services.length > 0 ? services[0].id : '',
      paperSize: 'A4',
      sides: 'SINGLE',
      pricePerPage: '',
      active: true
    });
    setShowRateModal(true);
  };

  const handleEditRate = (r) => {
    setEditingRateId(r.id);
    setRateForm({
      serviceId: r.serviceId || '',
      paperSize: r.paperSize || 'A4',
      sides: r.sides || 'SINGLE',
      pricePerPage: r.pricePerPage || '',
      active: r.active !== undefined ? r.active : true
    });
    setShowRateModal(true);
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    if (!rateForm.serviceId || !rateForm.pricePerPage) return;
    setSubmitting(true);
    try {
      const payload = {
        serviceId: rateForm.serviceId,
        paperSize: rateForm.paperSize,
        sides: rateForm.sides,
        pricePerPage: Number(rateForm.pricePerPage),
        active: rateForm.active
      };

      if (editingRateId) {
        await api.put(`/service-rates/${editingRateId}`, payload);
        setSuccess('Price rate updated successfully');
      } else {
        await api.post('/service-rates', payload);
        setSuccess('Price rate added successfully');
      }
      setRateForm({ serviceId: '', paperSize: 'A4', sides: 'SINGLE', pricePerPage: '', active: true });
      setEditingRateId(null);
      setShowRateModal(false);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save rate');
    }
    setSubmitting(false);
  };

  const handleToggleRateActive = async (r) => {
    try {
      await api.put(`/service-rates/${r.id}`, {
        serviceId: r.serviceId,
        paperSize: r.paperSize,
        sides: r.sides,
        pricePerPage: Number(r.pricePerPage),
        active: !r.active
      });
      setSuccess(`Rate for ${r.serviceName} (${r.paperSize}) set to ${!r.active ? 'Active' : 'Inactive'}`);
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Delete this service rate?')) return;
    try {
      await api.delete(`/service-rates/${id}`);
      setSuccess('Service rate deleted successfully');
      load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete rate');
    }
  };

  // Metrics
  const totalServices = services.length;
  const totalRates = rates.length;
  const activeServices = services.filter(s => s.status === 'ACTIVE').length;
  const distinctPaperSizes = Array.from(new Set(rates.map(r => r.paperSize))).length || 4;

  const singleSideCount = rates.filter(r => r.sides === 'SINGLE').length;
  const doubleSideCount = rates.filter(r => r.sides === 'DOUBLE').length;

  // Filtered rates
  const filteredRates = rates.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (r.serviceName && r.serviceName.toLowerCase().includes(q)) ||
      (r.paperSize && r.paperSize.toLowerCase().includes(q)) ||
      (r.sides && r.sides.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (activeTab === 'single') return r.sides === 'SINGLE';
    if (activeTab === 'double') return r.sides === 'DOUBLE';
    return true;
  });

  // Filtered services
  const filteredServices = services.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Services & Rates</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Configure Xerox prices, paper sizes (A4, A3, Legal) and rates per page.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openNewServiceModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>New Service</span>
          </button>
          <button
            onClick={openNewRateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Price Rate</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Services</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalServices}</div>
          </div>
        </div>

        {/* Configured Rates */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Configured Rates</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalRates}</div>
          </div>
        </div>

        {/* Active Services */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Active Services</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{activeServices}</div>
          </div>
        </div>

        {/* Paper Sizes */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Paper Sizes</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{distinctPaperSizes}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services or rates..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('all_rates')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all_rates'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Rates ({totalRates})
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Single Side ({singleSideCount})
          </button>
          <button
            onClick={() => setActiveTab('double')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'double'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Double Side ({doubleSideCount})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Services Catalog ({totalServices})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          {activeTab === 'services' ? (
            /* Services Catalog Table */
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6 w-16 text-center">S.NO</th>
                  <th className="py-3.5 px-6">Service Name</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6 text-center">Configured Rates</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">
                      Loading services...
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">
                      No services found. Click "New Service" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((svc, idx) => {
                    const svcRatesCount = rates.filter(
                      (r) => r.serviceId === svc.id || r.serviceName === svc.name
                    ).length;

                    return (
                      <tr key={svc.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Printer className="w-4 h-4 text-slate-700 stroke-[2]" />
                            <span className="font-black text-slate-900 text-xs tracking-tight">
                              {svc.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          {svc.description || 'Standard Xerox / Print Service'}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-700">
                          {svcRatesCount} {svcRatesCount === 1 ? 'rate' : 'rates'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleServiceStatus(svc)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition ${
                              svc.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                svc.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{svc.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditService(svc)}
                              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                              title="Edit Service"
                            >
                              <Pencil className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Configured Rates Table */
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6 w-16 text-center">S.NO</th>
                  <th className="py-3.5 px-6">Service Name</th>
                  <th className="py-3.5 px-6 text-center">Paper Size</th>
                  <th className="py-3.5 px-6 text-center">Printing Side</th>
                  <th className="py-3.5 px-6 text-center">Rate / Page</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-slate-400 font-medium">
                      Loading rates...
                    </td>
                  </tr>
                ) : filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-slate-400 font-medium">
                      No rates configured matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      {/* # */}
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Service Name with Printer Outline Icon */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Printer className="w-4 h-4 text-slate-700 stroke-[2]" />
                          <span className="font-black text-slate-900 text-xs tracking-tight">
                            {r.serviceName}
                          </span>
                        </div>
                      </td>

                      {/* Paper Size */}
                      <td className="py-4 px-6 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] font-mono">
                          {r.paperSize}
                        </span>
                      </td>

                      {/* Printing Side */}
                      <td className="py-4 px-6 text-center font-semibold text-slate-600">
                        {r.sides === 'SINGLE' ? 'Single Side' : 'Double Side'}
                      </td>

                      {/* Rate / Page */}
                      <td className="py-4 px-6 text-center font-black text-slate-900 text-sm">
                        ₹{Number(r.pricePerPage).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleRateActive(r)}
                          title="Click to toggle Active / Inactive status"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition ${
                            r.active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{r.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditRate(r)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                            title="Edit Rate"
                          >
                            <Pencil className="w-4 h-4 stroke-[2]" />
                          </button>
                          <button
                            onClick={() => handleDeleteRate(r.id)}
                            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition"
                            title="Delete Rate"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Service Modal (Add / Edit) */}
      <Modal isOpen={showSvcModal} onClose={() => setShowSvcModal(false)} maxWidth="max-w-md">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingSvcId ? 'Edit Service' : 'Add New Service'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {editingSvcId
                    ? 'Update service name, description, and status'
                    : 'Define a print, photocopy, or binding service'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSvcModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveService} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Service Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Color Xerox, Spiral Binding"
                value={svcForm.name}
                onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Short description of the service"
                value={svcForm.description}
                onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Status
              </label>
              <FormSelect
                value={svcForm.status}
                onChange={(val) => setSvcForm({ ...svcForm, status: val })}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSvcModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingSvcId ? 'Update Service' : 'Save Service'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Price Rate Modal (Add / Edit) */}
      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} maxWidth="max-w-md">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingRateId ? 'Edit Price Rate' : 'Configure Price Rate'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {editingRateId
                    ? 'Update page rate, paper size, printing side, or status'
                    : 'Set page rate per paper size and side'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRateModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveRate} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Select Service *
              </label>
              <FormSelect
                value={rateForm.serviceId}
                onChange={(val) => setRateForm({ ...rateForm, serviceId: val })}
                options={services.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select a service"
                icon={Sliders}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Paper Size *
                </label>
                <FormSelect
                  value={rateForm.paperSize}
                  onChange={(val) => setRateForm({ ...rateForm, paperSize: val })}
                  options={[
                    { value: 'A4', label: 'A4' },
                    { value: 'A3', label: 'A3' },
                    { value: 'A5', label: 'A5' },
                    { value: 'LEGAL', label: 'Legal' }
                  ]}
                  icon={FileText}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Sides *
                </label>
                <FormSelect
                  value={rateForm.sides}
                  onChange={(val) => setRateForm({ ...rateForm, sides: val })}
                  options={[
                    { value: 'SINGLE', label: 'Single Side' },
                    { value: 'DOUBLE', label: 'Double Side' }
                  ]}
                  icon={Copy}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Rate / Page (₹) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="e.g. 2.00"
                value={rateForm.pricePerPage}
                onChange={(e) => setRateForm({ ...rateForm, pricePerPage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Status
              </label>
              <FormSelect
                value={rateForm.active ? 'true' : 'false'}
                onChange={(val) => setRateForm({ ...rateForm, active: val === 'true' })}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' }
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingRateId ? 'Update Rate' : 'Save Rate'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
