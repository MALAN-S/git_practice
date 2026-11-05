import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Plus, Trash2, Calendar, Banknote, QrCode, X } from 'lucide-react';

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

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
            {expenses.length} Records
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average per Entry</span>
          <div className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
            ₹ {(expenses.length > 0 ? total / expenses.length : 0).toFixed(2)}
          </div>
        </div>
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
              {expenses.map(e => (
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
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">No expenses recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">Record Shop Expense</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expense Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (₹)</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date</label>
                  <input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description / Vendor</label>
                <input placeholder="e.g. 5 Rims JK Paper from supplier" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
