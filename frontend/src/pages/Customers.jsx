import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from '../context/ToastContext';
import {
  Users, Search, Phone, User, IndianRupee, Eye,
  X, AlertCircle, CheckCircle2, Banknote, QrCode,
  CreditCard, Clock, Plus, UserPlus, ChevronDown,
  ChevronUp, Receipt, History
} from 'lucide-react';

const formatDate = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | cleared
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalTab, setModalTab] = useState('bills'); // 'bills' | 'payments'
  const [expandedBillId, setExpandedBillId] = useState(null);

  // Add customer modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: '',
    customerPhone: '',
    totalAmount: '',
    paidAmount: '',
    paymentMethod: 'CASH',
    notes: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Pay balance modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBill, setPayBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/customers');
      setCustomers(r.data || []);
      // If customer detail modal is open, keep its data fresh
      if (selectedCustomer) {
        const updated = (r.data || []).find(
          c => c.customerPhone === selectedCustomer.customerPhone &&
               c.customerName === selectedCustomer.customerName
        );
        if (updated) setSelectedCustomer(updated);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalCustomers = customers.length;
  const pendingCustomers = customers.filter(c => Number(c.totalBalance) > 0).length;
  const totalDue = customers.reduce((sum, c) => sum + Number(c.totalBalance || 0), 0);
  const totalCollected = customers.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = (c.customerName || '').toLowerCase().includes(q);
      const matchPhone = (c.customerPhone || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone) return false;
    }
    if (filter === 'pending') return Number(c.totalBalance) > 0;
    if (filter === 'cleared') return Number(c.totalBalance) <= 0;
    return true;
  });

  const formTotal = Number(addForm.totalAmount) || 0;
  const formPaid = Number(addForm.paidAmount) || 0;
  const formBalance = Math.max(0, formTotal - formPaid);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!addForm.customerName.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    if (!addForm.customerPhone.trim()) {
      toast.error('Phone number is required.');
      return;
    }
    if (formPaid > formTotal && formTotal > 0) {
      toast.error('Paid amount cannot exceed total amount.');
      return;
    }

    setAddLoading(true);
    try {
      await api.post('/customers', {
        customerName: addForm.customerName.trim(),
        customerPhone: addForm.customerPhone.trim(),
        totalAmount: formTotal,
        paidAmount: formPaid,
        paymentMethod: addForm.paymentMethod,
        notes: addForm.notes.trim()
      });
      toast.success(`Customer '${addForm.customerName.trim()}' added successfully!`);
      setShowAddModal(false);
      setAddForm({
        customerName: '',
        customerPhone: '',
        totalAmount: '',
        paidAmount: '',
        paymentMethod: 'CASH',
        notes: ''
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer');
    }
    setAddLoading(false);
  };

  const openPayModal = (bill) => {
    setPayBill(bill);
    setPayAmount(Math.round(Number(bill.balanceAmount)));
    setPayMethod(bill.paymentMethod || 'CASH');
    setShowPayModal(true);
  };

  const handlePayBalance = async () => {
    if (!payBill) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (amount > Number(payBill.balanceAmount)) {
      toast.error(`Amount cannot exceed balance of ₹${Math.round(Number(payBill.balanceAmount))}`);
      return;
    }

    setPayLoading(true);
    try {
      await api.post(`/bill-history/${payBill.id}/pay-balance`, {
        amount,
        paymentMethod: payMethod
      });
      toast.success(`Payment of ₹${Math.round(amount)} recorded successfully!`);
      setShowPayModal(false);
      setPayBill(null);
      setPayAmount('');
      
      // Reload and refresh selected customer with full payment history
      const r = await api.get('/customers');
      setCustomers(r.data || []);
      if (selectedCustomer) {
        const updated = (r.data || []).find(
          c => c.customerPhone === selectedCustomer.customerPhone &&
               c.customerName === selectedCustomer.customerName
        );
        setSelectedCustomer(updated || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    }
    setPayLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage customer profiles, billing history, and partial payment dues.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Customers</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalCustomers}</div>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Pending Dues</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{pendingCustomers}</div>
          </div>
        </div>

        {/* Balance Due (Unpaid) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Balance Due (Unpaid)</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">₹{Math.round(totalDue)}</div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Collected</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">₹{Math.round(totalCollected)}</div>
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
            placeholder="Search customers by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Customers ({totalCustomers})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'pending'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Pending Dues ({pendingCustomers})
          </button>
          <button
            onClick={() => setFilter('cleared')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === 'cleared'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Fully Paid ({totalCustomers - pendingCustomers})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-3 w-12 text-center">S.NO</th>
                <th className="py-3.5 px-3">Customer Name</th>
                <th className="py-3.5 px-3 text-center">Phone</th>
                <th className="py-3.5 px-3 text-center">Bills</th>
                <th className="py-3.5 px-3 text-center">Total</th>
                <th className="py-3.5 px-3 text-center">Paid</th>
                <th className="py-3.5 px-3 text-center">Balance Due</th>
                <th className="py-3.5 px-3 text-center">Last Visit</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-xs text-slate-400 font-medium">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-xs text-slate-400 font-medium">
                    No customers found matching your filter. Click "Add Customer" to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const hasDue = Number(c.totalBalance) > 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-3 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                            {(c.customerName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-black text-slate-900 text-xs tracking-tight">
                            {c.customerName || 'Anonymous Customer'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                        {c.customerPhone ? (
                          <span className="font-mono text-slate-700 font-semibold">{c.customerPhone}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] font-mono whitespace-nowrap">
                          {c.totalBills} {c.totalBills === 1 ? 'bill' : 'bills'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 text-xs">
                        ₹{Math.round(Number(c.totalAmount || 0))}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-600 text-xs">
                        ₹{Math.round(Number(c.totalPaid || 0))}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-xs">
                        {hasDue ? (
                          <span className="text-rose-600 font-black">₹{Math.round(Number(c.totalBalance))}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium text-xs whitespace-nowrap">
                        {formatDate(c.lastVisit)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                            hasDue
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              hasDue ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span>{hasDue ? 'Pay Due' : 'Paid'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDue && (
                            <button
                              onClick={() => {
                                const pendingBill = (c.bills || []).find(
                                  b => b.status === 'PARTIAL' && Number(b.balanceAmount) > 0
                                );
                                if (pendingBill) openPayModal(pendingBill);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold shadow-sm shadow-amber-200 hover:shadow-md hover:shadow-amber-200 transition active:scale-95 whitespace-nowrap cursor-pointer"
                              title="Pay Due"
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Pay Due</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setModalTab('bills');
                              setExpandedBillId(null);
                            }}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                            title="View Customer Bills & Payment History"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Add Customer</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Register customer and record opening bill / dues.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddCustomer} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={addForm.customerName}
                onChange={e => setAddForm(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={addForm.customerPhone}
                onChange={e => setAddForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Total Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={addForm.totalAmount}
                  onChange={e => setAddForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Paid Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={addForm.paidAmount}
                  onChange={e => setAddForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Computed Summary Preview */}
            {(formTotal > 0 || formPaid > 0) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Balance Due: </span>
                  <span className={`font-black ${formBalance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    ₹{Math.round(formBalance)}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      formBalance > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        formBalance > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{formBalance > 0 ? 'Pending Due' : 'Paid in Full'}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Payment method if paid > 0 */}
            {formPaid > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Payment Method *</label>
                <div className="flex gap-2">
                  {[
                    { v: 'CASH', icon: Banknote, label: 'Cash' },
                    { v: 'UPI', icon: QrCode, label: 'UPI' },
                    { v: 'CARD', icon: CreditCard, label: 'Card' }
                  ].map(m => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, paymentMethod: m.v }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        addForm.paymentMethod === m.v
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Notes / Purpose (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Xerox printing, project work, opening balance"
                value={addForm.notes}
                onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {addLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Customer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Customer Bills Detail Modal */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} maxWidth="max-w-3xl">
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                  {(selectedCustomer.customerName || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {selectedCustomer.customerName}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {selectedCustomer.customerPhone || 'No phone'}
                    <span className="mx-1">•</span>
                    {selectedCustomer.totalBills} bill{selectedCustomer.totalBills !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Cards in Modal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-center">
                <div className="text-[11px] font-semibold text-slate-500">Total Billed</div>
                <div className="text-base font-black text-slate-900 mt-0.5">₹{Math.round(Number(selectedCustomer.totalAmount))}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-center">
                <div className="text-[11px] font-semibold text-emerald-600">Total Paid</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">₹{Math.round(Number(selectedCustomer.totalPaid))}</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-center">
                <div className="text-[11px] font-semibold text-rose-600">Balance Due</div>
                <div className="text-base font-black text-rose-600 mt-0.5">₹{Math.round(Number(selectedCustomer.totalBalance))}</div>
              </div>
            </div>

            {/* Tabs for Bills vs Payment History */}
            <div className="flex items-center justify-between gap-2 pt-1 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModalTab('bills')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'bills'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Bills ({selectedCustomer.bills?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('payments')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    modalTab === 'payments'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Payment History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold font-mono">
                    {selectedCustomer.payments?.length || 0}
                  </span>
                </button>
              </div>

              {Number(selectedCustomer.totalBalance) > 0 && (
                <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Due: ₹{Math.round(Number(selectedCustomer.totalBalance))}</span>
                </div>
              )}
            </div>

            {/* TAB 1: Bills List View */}
            {modalTab === 'bills' && (
              <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80 sticky top-0">
                      <tr>
                        <th className="py-3 px-3.5">Bill #</th>
                        <th className="py-3 px-3.5">Date</th>
                        <th className="py-3 px-3.5 text-center">Total</th>
                        <th className="py-3 px-3.5 text-center">Paid</th>
                        <th className="py-3 px-3.5 text-center">Balance</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Installments</th>
                        <th className="py-3 px-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedCustomer.bills || []).map((bill, idx) => {
                        const bal = Number(bill.balanceAmount || 0);
                        const billPayments = bill.payments || [];
                        const isExpanded = expandedBillId === bill.id;

                        return (
                          <React.Fragment key={bill.id || idx}>
                            <tr className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-3.5 font-black text-blue-600 text-xs">{bill.billNumber}</td>
                              <td className="py-3 px-3.5 text-slate-500 font-medium text-xs">{formatDate(bill.createdAt)}</td>
                              <td className="py-3 px-3.5 text-center font-bold text-slate-900 text-xs">₹{Math.round(Number(bill.grandTotal))}</td>
                              <td className="py-3 px-3.5 text-center font-bold text-emerald-600 text-xs">₹{Math.round(Number(bill.paidAmount || 0))}</td>
                              <td className="py-3 px-3.5 text-center font-black text-rose-600 text-xs">
                                {bal > 0 ? `₹${Math.round(bal)}` : '—'}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    bill.status === 'PARTIAL'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  <span
                                    className={`w-1 h-1 rounded-full ${
                                      bill.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                  />
                                  <span>{bill.status === 'PARTIAL' ? 'Partial' : 'Paid'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                {billPayments.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                                  >
                                    <span>{billPayments.length} paid</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                {bill.status === 'PARTIAL' && bal > 0 && (
                                  <button
                                    onClick={() => openPayModal(bill)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm shadow-amber-200 hover:shadow-md hover:shadow-amber-200 transition active:scale-95 cursor-pointer"
                                  >
                                    <Banknote className="w-3.5 h-3.5" />
                                    Pay Due
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Expanded Payments Breakdown for this specific Bill */}
                            {isExpanded && billPayments.length > 0 && (
                              <tr className="bg-slate-50/70 border-y border-slate-200/60">
                                <td colSpan="8" className="p-3">
                                  <div className="bg-white rounded-xl p-3 border border-slate-200/70 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1.5 border-b border-slate-100">
                                      <span className="flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5 text-blue-600" />
                                        Payment Installments for {bill.billNumber}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-normal">
                                        Total Paid: <strong className="text-emerald-600">₹{Math.round(Number(bill.paidAmount))}</strong> of ₹{Math.round(Number(bill.grandTotal))}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                      {billPayments.map((p, pIdx) => {
                                        const isInitial = !p.transactionRef || !p.transactionRef.startsWith('BAL_');
                                        return (
                                          <div key={p.id || pIdx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition">
                                            <div className="flex items-center gap-2">
                                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                {pIdx + 1}
                                              </span>
                                              <span className="font-semibold text-slate-800">
                                                {isInitial ? 'Initial Payment' : `Balance Installment #${pIdx}`}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-bold uppercase">
                                                {p.method || 'CASH'}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="text-[11px] text-slate-400 font-medium">
                                                {formatDateTime(p.createdAt)}
                                              </span>
                                              <span className="font-black text-emerald-600 text-xs">
                                                + ₹{Math.round(Number(p.amount))}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Full Payment & Installments Timeline View */}
            {modalTab === 'payments' && (
              <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
                <div className="max-h-72 overflow-y-auto">
                  {(selectedCustomer.payments || []).length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No payment installment records found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80 sticky top-0">
                        <tr>
                          <th className="py-3 px-3.5 w-12 text-center">#</th>
                          <th className="py-3 px-3.5">Date & Time</th>
                          <th className="py-3 px-3.5">Bill #</th>
                          <th className="py-3 px-3.5 text-center">Payment Mode</th>
                          <th className="py-3 px-3.5">Payment Type</th>
                          <th className="py-3 px-3.5 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedCustomer.payments || []).map((pm, pIdx) => {
                          const isInitial = !pm.transactionRef || !pm.transactionRef.startsWith('BAL_');
                          return (
                            <tr key={pm.id || pIdx} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-3.5 text-center font-bold text-slate-500 text-[11px]">
                                {pIdx + 1}
                              </td>
                              <td className="py-3 px-3.5 font-medium text-slate-600">
                                {formatDateTime(pm.createdAt)}
                              </td>
                              <td className="py-3 px-3.5 font-black text-blue-600 font-mono">
                                {pm.billNumber}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] uppercase font-mono">
                                  {pm.method === 'UPI' ? <QrCode className="w-3 h-3 text-purple-600" /> : pm.method === 'CARD' ? <CreditCard className="w-3 h-3 text-blue-600" /> : <Banknote className="w-3 h-3 text-emerald-600" />}
                                  {pm.method || 'CASH'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isInitial
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {isInitial ? 'Initial Bill Payment' : 'Balance Installment'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right font-black text-emerald-600 text-xs">
                                + ₹{Math.round(Number(pm.amount))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Pay Balance Modal */}
      <Modal isOpen={showPayModal} onClose={() => { setShowPayModal(false); setPayBill(null); }} maxWidth="max-w-md">
        {payBill && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Banknote className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Pay Balance</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Bill #{payBill.billNumber} • Due: <span className="text-rose-600 font-bold">₹{Math.round(Number(payBill.balanceAmount))}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowPayModal(false); setPayBill(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Amount Paying Now (₹) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={`Enter amount (max ₹${Math.round(Number(payBill.balanceAmount))})`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Payment Method *</label>
                <div className="flex gap-2">
                  {[
                    { v: 'CASH', icon: Banknote, label: 'Cash' },
                    { v: 'UPI', icon: QrCode, label: 'UPI' },
                    { v: 'CARD', icon: CreditCard, label: 'Card' }
                  ].map(m => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setPayMethod(m.v)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        payMethod === m.v
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayBalance}
                disabled={payLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {payLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
