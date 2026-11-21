import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import {
  ShoppingBag, Plus, Search, Trash2, X, Check, Calendar,
  IndianRupee, FileText, Truck, Package, Hash, Banknote,
  CheckCircle2, AlertCircle, Eye, RotateCcw, ArrowLeft,
  ExternalLink, CreditCard, Clock, History
} from 'lucide-react';

const emptyForm = {
  supplierId: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  invoiceNumber: '',
  items: [{ productId: '', sku: '', itemName: '', quantity: 1, unitPrice: '', mrp: '' }],
  discount: '0',
  paymentMethod: 'CASH',
  paymentStatus: 'PAID',
  paidAmount: '',
  notes: ''
};

const formatDate = (val) => {
  if (!val) return '—';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('T')[0].split('-');
    return `${d}-${m}-${y}`;
  }
  try {
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}-${m}-${y}`;
    }
  } catch {}
  return val;
};

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  } catch {}
  return val;
};

export default function Purchases() {
  const [view, setView] = useState('list'); // 'list' (default) | 'create'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPurchase, setPayPurchase] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [viewPurchase, setViewPurchase] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, items: [{ ...emptyForm.items[0] }] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = () => {
    Promise.allSettled([
      api.get('/purchases'),
      api.get('/suppliers?status=ACTIVE'),
      api.get('/products')
    ]).then(([p, s, pr]) => {
      if (p.status === 'fulfilled') setPurchases(p.value.data || []);
      if (s.status === 'fulfilled') setSuppliers(s.value.data || []);
      if (pr.status === 'fulfilled') setProducts(pr.value.data || []);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Items manipulation
  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', sku: '', itemName: '', quantity: 1, unitPrice: '', mrp: '' }]
    }));
  };

  const removeItem = (i) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== i)
    }));
  };

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === 'productId') {
      if (value) {
        const prod = products.find(p => String(p.id) === String(value));
        if (prod) {
          items[i].itemName = prod.name;
          items[i].sku = prod.sku || '';
          if (prod.purchasePrice != null && prod.purchasePrice !== '') {
            items[i].unitPrice = prod.purchasePrice;
          }
          if (prod.sellingPrice != null && prod.sellingPrice !== '') {
            items[i].mrp = prod.sellingPrice;
          }
        }
      }
    }
    setForm(prev => ({ ...prev, items }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm, items: [{ ...emptyForm.items[0] }] });
    setError(null);
    setShowPaymentModal(false);
  };

  const itemsTotal = form.items.reduce((sum, it) => sum + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)), 0);
  const grandTotal = Math.max(0, itemsTotal - (Number(form.discount) || 0));

  const handleOpenPaymentModal = (e) => {
    if (e) e.preventDefault();
    if (!form.supplierId) {
      setError('Please select a supplier before proceeding to payment');
      return;
    }
    if (form.items.some(it => !it.itemName && !it.productId)) {
      setError('Please provide an item description or choose a product for each line item');
      return;
    }
    if (form.items.some(it => !it.quantity || Number(it.quantity) <= 0)) {
      setError('Item quantity must be at least 1');
      return;
    }
    setError(null);
    setShowPaymentModal(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (form.items.some(it => !it.itemName && !it.productId)) {
      setError('Please provide an item description or choose a product for each line item');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplierId: Number(form.supplierId),
        purchaseDate: form.purchaseDate,
        invoiceNumber: form.invoiceNumber || null,
        discount: Number(form.discount) || 0,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        paidAmount: form.paymentStatus === 'PAID' ? grandTotal : (Number(form.paidAmount) || 0),
        notes: form.notes || null,
        items: form.items.map(it => ({
          productId: it.productId || null,
          sku: it.sku ? it.sku.trim() : null,
          itemName: it.itemName,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          mrp: it.mrp !== '' && it.mrp != null ? Number(it.mrp) : null
        }))
      };
      await api.post('/purchases', payload);
      setSuccess('Purchase recorded successfully! Inventory stock updated.');
      setShowPaymentModal(false);
      resetForm();
      loadData();
      setView('list');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save purchase');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase record?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      setSuccess('Purchase record deleted');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete purchase');
    }
  };

  const loadPaymentHistory = async (purchaseId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/purchases/${purchaseId}/payments`);
      setPaymentHistory(res.data || []);
    } catch {
      setPaymentHistory([]);
    }
    setLoadingHistory(false);
  };

  const openPayBalance = (purchase) => {
    setPayPurchase(purchase);
    const grandTotal = Number(purchase.grandTotal || 0);
    const paidAmount = Number(purchase.paidAmount || 0);
    const balance = Math.max(0, grandTotal - paidAmount);
    setPayAmount(Math.round(balance));
    setPayMethod(purchase.paymentMethod || 'CASH');
    setShowPayModal(true);
    loadPaymentHistory(purchase.id);
  };

  const handlePayBalance = async (e) => {
    if (e) e.preventDefault();
    if (!payPurchase) return;
    const amount = Number(payAmount);
    const grandTotal = Number(payPurchase.grandTotal || 0);
    const paidAmount = Number(payPurchase.paidAmount || 0);
    const balance = Math.max(0, grandTotal - paidAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (amount > balance) {
      alert(`Amount cannot exceed the remaining balance of ₹${Math.round(balance)}`);
      return;
    }

    setPayLoading(true);
    try {
      const res = await api.post(`/purchases/${payPurchase.id}/pay-balance`, {
        amount,
        paymentMethod: payMethod
      });
      setSuccess(`Payment of ₹${Math.round(amount)} recorded successfully for ${payPurchase.supplier?.name || 'supplier'}!`);
      setShowPayModal(false);
      setPayPurchase(null);
      setPayAmount('');
      setPaymentHistory([]);
      if (viewPurchase && viewPurchase.id === res.data.id) {
        setViewPurchase(res.data);
      }
      loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Payment failed');
    }
    setPayLoading(false);
  };

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
  const totalDue = Math.max(0, totalSpent - totalPaid);

  const filteredPurchases = purchases.filter(p => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (p.supplier?.name || '').toLowerCase().includes(term)
      || (p.invoiceNumber || '').toLowerCase().includes(term)
      || (p.notes || '').toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {view === 'create' ? (
            <button
              type="button"
              onClick={() => { resetForm(); setView('list'); }}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-sm"
              title="Back to Purchases List"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {view === 'create' ? 'Record Purchase' : 'Purchases'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {view === 'create'
                ? 'Enter procurement bill line items & auto-update inventory stock'
                : 'Record supplier bills & raw materials with automatic stock replenishment'}
            </p>
          </div>
        </div>

        {view === 'create' && (
          <button
            type="button"
            onClick={() => { resetForm(); setView('list'); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Purchases</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DEFAULT VIEW: PURCHASES OVERVIEW & TABLE (IMAGE 1) */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Purchases</span>
              <div className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
                ₹ {Math.round(totalSpent).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid to Suppliers</span>
              <div className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
                ₹ {Math.round(totalPaid).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Balance Due (Unpaid)</span>
              <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight">
                ₹ {Math.round(totalDue).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Suppliers</span>
              <div className="mt-2 text-2xl font-black text-slate-800 tracking-tight">{suppliers.length}</div>
            </div>
          </div>

          {/* Search Bar + Record New Purchase Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by supplier name, invoice #, memo..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => { resetForm(); setView('create'); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100 self-end sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Record New Purchase</span>
            </button>
          </div>

          {/* Purchases History Table */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9fa] text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center min-w-[170px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-xs text-slate-400 font-medium">
                        {purchases.length === 0 ? 'No purchases recorded yet.' : 'No purchases matching your search filter.'}
                      </td>
                    </tr>
                  ) : filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.supplier?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono font-medium">{p.invoiceNumber || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {p.items?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-indigo-700">₹{Math.round(Number(p.grandTotal))}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                            p.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                            p.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {p.paymentStatus}
                          </span>
                          {p.paymentStatus !== 'PAID' && (
                            <span className="text-[10px] font-extrabold text-amber-600 mt-0.5">
                              Due: ₹{Math.round(Number(p.grandTotal || 0) - Number(p.paidAmount || 0))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <div className="w-[84px] flex justify-end">
                            {p.paymentStatus !== 'PAID' && (
                              <button
                                type="button"
                                onClick={() => openPayBalance(p)}
                                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 whitespace-nowrap"
                                title="Pay Remaining Balance"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Due</span>
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => { setViewPurchase(p); loadPaymentHistory(p.id); }}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center justify-center transition shrink-0"
                            title="View Invoice Details"
                          >
                            <Eye className="w-4 h-4 stroke-[2]" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 inline-flex items-center justify-center transition shrink-0"
                            title="Delete Record"
                          >
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
        </div>
      )}

      {/* CREATE VIEW: FULL-PAGE RECORD PURCHASE FORM (NO MODAL) */}
      {view === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Info - Single Unified Card */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Supplier Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <NavLink
                    to="/suppliers"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    title="Manage suppliers in master settings"
                  >
                    Manage <ExternalLink className="w-3 h-3" />
                  </NavLink>
                </div>
                <select
                  required
                  value={form.supplierId}
                  onChange={e => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition"
                >
                  <option value="">Choose Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Purchase Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.purchaseDate}
                  onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Supplier Bill / Invoice #
                </label>
                <input
                  value={form.invoiceNumber}
                  onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                  placeholder="e.g. INV-2026-904"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
            <div className="bg-[#f8f9fa] px-5 py-3 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Purchase Line Items</h3>
                <p className="text-[11px] text-slate-400 font-medium">Link to inventory product to auto-update stock, or enter raw shop purchases</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center whitespace-nowrap align-middle">#</th>
                    <th className="py-3 px-3 w-52 min-w-[190px] text-left whitespace-nowrap align-middle">Link Product</th>
                    <th className="py-3 px-3 w-36 min-w-[130px] text-left whitespace-nowrap align-middle">SKU</th>
                    <th className="py-3 px-3 min-w-[220px] text-left whitespace-nowrap align-middle">Description / Item Name *</th>
                    <th className="py-3 px-3 w-20 text-center whitespace-nowrap align-middle">Qty</th>
                    <th className="py-3 px-3 w-36 text-right whitespace-nowrap align-middle">Purchase Price (₹)</th>
                    <th className="py-3 px-3 w-28 text-right whitespace-nowrap align-middle">MRP (₹)</th>
                    <th className="py-3 px-3 w-28 text-right whitespace-nowrap align-middle">Line Total</th>
                    <th className="py-3 px-3 w-20 text-center whitespace-nowrap align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.items.map((it, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-bold align-middle">{i + 1}</td>
                      <td className="py-3 px-3 align-middle">
                        <select
                          value={it.productId}
                          onChange={e => updateItem(i, 'productId', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 truncate"
                          title={products.find(p => p.id === it.productId)?.name || 'Custom item'}
                        >
                          <option value="">-- Custom / Non-stock --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.currentStock})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <input
                          value={it.sku || ''}
                          onChange={e => updateItem(i, 'sku', e.target.value)}
                          placeholder="e.g. SKU"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <input
                          required
                          value={it.itemName}
                          onChange={e => updateItem(i, 'itemName', e.target.value)}
                          placeholder="e.g. JK Copier A4 75GSM"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <input
                          type="number"
                          min="1"
                          required
                          value={it.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          required
                          value={it.unitPrice}
                          onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-right text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={it.mrp}
                          onChange={e => updateItem(i, 'mrp', e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addItem();
                            }
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-right text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm whitespace-nowrap align-middle">
                        ₹{Math.round((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0))}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={addItem}
                            className="w-7 h-7 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 flex items-center justify-center transition shadow-2xs"
                            title="Add item row"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(i)}
                              className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition shadow-2xs"
                              title="Remove line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
              <div className="text-xs font-bold text-slate-500 mr-4">
                Total Rows: <span className="text-slate-800 font-black">{form.items.length}</span>
              </div>
            </div>
          </div>

          {/* Bottom Summary & Proceed Bar */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs w-full sm:w-auto">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Items</span>
                <span className="text-sm font-black text-slate-800">{form.items.length} Line(s)</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Gross Amount</span>
                <span className="text-lg font-black text-indigo-700">₹{Math.round(itemsTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => { resetForm(); setView('list'); }}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition border border-slate-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenPaymentModal}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition shadow-md shadow-indigo-300 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Payment & Invoice Summary Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} maxWidth="max-w-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Payment & Invoice Summary</h2>
              <p className="text-xs text-slate-400 font-medium">Select payment method, review discount & confirm purchase</p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(false)}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single Column Layout inside Modal */}
        <div className="space-y-4 mt-4 relative z-10">
          {/* Invoice Summary Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Items Gross Total:</span>
              <span className="font-bold text-slate-800">₹{Math.round(itemsTotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Discount (₹):</span>
              <input
                type="number"
                step="1"
                min="0"
                value={form.discount}
                onChange={e => setForm({ ...form, discount: e.target.value })}
                className="w-28 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-right text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              />
            </div>

            <div className="pt-2.5 border-t border-indigo-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Grand Total Payable</div>
                <div className="text-[11px] text-slate-400">All line items net of discount</div>
              </div>
              <div className="text-2xl font-black text-indigo-700 tracking-tight">
                ₹{Math.round(grandTotal)}
              </div>
            </div>
          </div>

          {/* Payment Method Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'UPI', 'CARD'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setForm({ ...form, paymentMethod: m })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                    form.paymentMethod === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PAID', label: 'Paid Full', bg: 'bg-emerald-600 text-white border-emerald-600' },
                { id: 'PARTIAL', label: 'Partial Pay', bg: 'bg-amber-600 text-white border-amber-600' }
              ].map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setForm({ ...form, paymentStatus: s.id })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                    form.paymentStatus === s.id
                      ? `${s.bg} shadow-sm`
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount if Partial */}
          {form.paymentStatus === 'PARTIAL' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Amount Paid Now (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  required
                  value={form.paidAmount}
                  onChange={e => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder="0"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <div className="text-xs font-bold text-amber-800 shrink-0">
                  Balance: ₹{Math.round(Math.max(0, grandTotal - (Number(form.paidAmount) || 0)))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Purchase Notes / Remarks</label>
            <input
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Delivery by Balaji courier, Received 10 boxes intact"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition shadow-md shadow-indigo-300 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? 'Recording...' : 'Save & Record Purchase'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* View Purchase Invoice Breakdown Modal (for inspecting records in list view) */}
      <Modal isOpen={!!viewPurchase} onClose={() => setViewPurchase(null)} maxWidth="max-w-lg">
        {viewPurchase && (
          <>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <Eye className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Purchase Invoice Details</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{formatDate(viewPurchase.purchaseDate)} • {viewPurchase.supplier?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setViewPurchase(null)}
                className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Invoice Number</span>
                  <div className="font-bold text-slate-800 mt-0.5 font-mono">{viewPurchase.invoiceNumber || '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Info</span>
                  <div className="font-bold text-slate-800 mt-0.5">{viewPurchase.paymentMethod} • {viewPurchase.paymentStatus}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Item Details</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Purchase Price</th>
                      <th className="py-2.5 px-3 text-right">MRP</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewPurchase.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div>{it.itemName || it.product?.name || '—'}</div>
                          {(it.sku || it.product?.sku) && (
                            <div className="text-[10px] text-slate-400 font-mono font-medium">SKU: {it.sku || it.product?.sku}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{Math.round(Number(it.unitPrice))}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">₹{Math.round(Number(it.mrp || 0))}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-800">₹{Math.round(Number(it.totalPrice))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-bold text-slate-800">₹{Math.round(Number(viewPurchase.totalAmount))}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Discount:</span>
                  <span className="font-bold text-rose-600">₹{Math.round(Number(viewPurchase.discount))}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-sm font-black text-indigo-700">₹{Math.round(Number(viewPurchase.grandTotal))}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Amount Paid:</span>
                  <span>₹{Math.round(Number(viewPurchase.paidAmount || 0))}</span>
                </div>
                {viewPurchase.paymentStatus !== 'PAID' && (
                  <div className="flex justify-between font-black text-amber-700 pt-1.5 border-t border-amber-200">
                    <span>Balance Due:</span>
                    <span className="text-sm">₹{Math.round(Math.max(0, Number(viewPurchase.grandTotal) - Number(viewPurchase.paidAmount || 0)))}</span>
                  </div>
                )}
              </div>

              {viewPurchase.notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Notes:</span> {viewPurchase.notes}
                </div>
              )}

              {/* Payment History in Invoice View */}
              {paymentHistory.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Payment History</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400">{paymentHistory.length} payment(s)</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/60 text-slate-400 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-left">#</th>
                          <th className="py-2 px-3 text-left">Date & Time</th>
                          <th className="py-2 px-3 text-center">Method</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((ph, i) => (
                          <tr key={ph.id || i} className="hover:bg-slate-50/40">
                            <td className="py-2 px-3 text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-2 px-3 text-slate-600 font-medium">
                              {formatDateTime(ph.paidAt)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {ph.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-black text-emerald-700">₹{Math.round(Number(ph.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {viewPurchase.paymentStatus !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    const p = viewPurchase;
                    setViewPurchase(null);
                    openPayBalance(p);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-200 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Remaining Balance (₹{Math.round(Math.max(0, Number(viewPurchase.grandTotal) - Number(viewPurchase.paidAmount || 0)))})</span>
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Pay Supplier Balance Modal */}
      <Modal isOpen={showPayModal} onClose={() => { setShowPayModal(false); setPayPurchase(null); }} maxWidth="max-w-md">
        {payPurchase && (() => {
          const grandTotal = Number(payPurchase.grandTotal || 0);
          const paidAmount = Number(payPurchase.paidAmount || 0);
          const balance = Math.max(0, grandTotal - paidAmount);
          const payingNow = Number(payAmount) || 0;
          const remainingAfter = Math.max(0, balance - payingNow);

          return (
            <div className="space-y-4 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                    <CreditCard className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Pay Supplier Balance</h2>
                    <p className="text-xs text-slate-400 font-medium">Clear remaining dues for this purchase</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowPayModal(false); setPayPurchase(null); }}
                  className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Supplier & Bill Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Supplier</span>
                  <span className="font-bold text-slate-800">{payPurchase.supplier?.name || '—'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice #</span>
                  <span className="font-mono font-bold text-slate-700">{payPurchase.invoiceNumber || '—'}</span>
                </div>
              </div>

              {/* Balance Breakdown Box */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Total Bill Amount:</span>
                  <span className="font-bold text-slate-800">₹{Math.round(grandTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Amount Already Paid:</span>
                  <span className="font-bold">₹{Math.round(paidAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-amber-900 pt-2 border-t border-amber-200/80 text-sm">
                  <span>Balance Due:</span>
                  <span>₹{Math.round(balance)}</span>
                </div>
              </div>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Payment History</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400">{paymentHistory.length} payment(s)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/60 text-slate-400 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-left">#</th>
                          <th className="py-2 px-3 text-left">Date & Time</th>
                          <th className="py-2 px-3 text-center">Method</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((ph, i) => (
                          <tr key={ph.id || i} className="hover:bg-slate-50/40">
                            <td className="py-2 px-3 text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-2 px-3 text-slate-600 font-medium">
                              {formatDateTime(ph.paidAt)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {ph.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-black text-emerald-700">₹{Math.round(Number(ph.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amount Paying Now (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20">
                  <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={Math.round(balance)}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-800 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(balance))}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold transition shrink-0"
                  >
                    Pay Full
                  </button>
                </div>
                {payingNow > 0 && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                    Remaining balance after this payment: <span className="font-bold text-slate-700">₹{Math.round(remainingAfter)}</span>
                  </p>
                )}
              </div>

              {/* Payment Method Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'UPI', 'CARD'].map(m => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                        payMethod === m
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setPayPurchase(null); }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={payLoading || !payingNow || payingNow <= 0 || payingNow > balance}
                  onClick={handlePayBalance}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition shadow-md shadow-amber-200 active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{payLoading ? 'Processing...' : `Confirm Payment of ₹${Math.round(payingNow)}`}</span>
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
