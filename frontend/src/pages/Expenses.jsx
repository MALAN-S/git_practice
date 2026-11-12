import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import SearchableFilterDropdown from '../components/SearchableFilterDropdown';
import FormSelect from '../components/FormSelect';
import {
  CreditCard, Plus, Trash2, Calendar, Banknote, QrCode, X,
  IndianRupee, Tag, ChevronDown, FileText, Check, Search, Filter
} from 'lucide-react';

const CATEGORIES = [
  'Paper Purchase',
  'Ink and Toner',
  'Electricity',
  'Rent',
  'Machine Maintenance',
  'Other Expenses'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: 'Paper Purchase',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'CASH'
  });

  const load = () => {
    api.get('/expenses').then(r => setExpenses(r.data));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/expenses', { ...form, amount: Number(form.amount) });
    setForm({
      category: 'Paper Purchase',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: 'CASH'
    });
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  const filteredExpenses = expenses.filter((e) => {
    const term = search.toLowerCase().trim();
    if (term) {
      const matchCat = (e.category || '').toLowerCase().includes(term);
      const matchDesc = (e.description || '').toLowerCase().includes(term);
      const matchMethod = (e.paymentMethod || '').toLowerCase().includes(term);
      if (!matchCat && !matchDesc && !matchMethod) return false;
    }
    if (catFilter && e.category !== catFilter) return false;
    return true;
  });

  const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const availableCategories = Array.from(
    new Set([...CATEGORIES, ...expenses.map((e) => e.category).filter(Boolean)])
  );

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Expenses</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Track paper purchases, toner cartridges, electricity and maintenance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Modern Expense Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Recorded Expenses</span>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expense Entries</span>
          <div className="mt-2 text-2xl font-black text-slate-800 tracking-tight">
            {filteredExpenses.length} Records
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average per Entry</span>
          <div className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
            ₹ {(filteredExpenses.length > 0 ? total / filteredExpenses.length : 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by note, method..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          />
        </div>

        <SearchableFilterDropdown
          value={catFilter}
          onChange={(val) => setCatFilter(val)}
          placeholder="All Categories"
          searchPlaceholder="Search expense categories..."
          options={[
            { value: '', label: 'All Categories' },
            ...availableCategories.map((c) => ({ value: c, label: c }))
          ]}
        />
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{e.category}</td>
                  <td className="py-3.5 px-4 font-black text-rose-600">₹{Number(e.amount).toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{e.expenseDate}</td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{e.description || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 inline-flex items-center justify-center transition"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">
                    {expenses.length === 0
                      ? 'No expenses recorded yet.'
                      : 'No expenses found matching the selected filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-300/50 shrink-0">
                  <CreditCard className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Record Shop Expense
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Log utility, stock purchase, rent or operational costs
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
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Expense Category <span className="text-rose-500">*</span>
                </label>
                <FormSelect
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  icon={Tag}
                  triggerClassName="!py-3 !rounded-2xl !bg-slate-100/70 hover:!bg-slate-100/90 !border-slate-200/50 shadow-inner"
                />
              </div>

              {/* Amount & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                    <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                      className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <FormSelect
                  value={form.paymentMethod}
                  onChange={(val) => setForm({ ...form, paymentMethod: val })}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'CARD', label: 'Card' }
                  ]}
                  icon={Banknote}
                  triggerClassName="!py-3 !rounded-2xl !bg-slate-100/70 hover:!bg-slate-100/90 !border-slate-200/50 shadow-inner"
                />
              </div>

              {/* Description / Vendor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description / Vendor Note
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    placeholder="e.g. 5 Rims JK Paper from supplier"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
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
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
