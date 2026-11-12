import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import SearchableFilterDropdown from '../components/SearchableFilterDropdown';
import FormSelect from '../components/FormSelect';
import {
  Boxes, Plus, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, X, History, UploadCloud,
  Box, Layers, ArrowUpDown, FileText, ChevronDown, Check, Search, Filter
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '', reference: '' });

  const load = () => {
    api.get('/products').then(r => setProducts(r.data));
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/inventory/low-stock').then(r => setLowStock(r.data));
  };
  useEffect(load, []);

  const loadTransactions = (prod) => {
    setSelectedProduct(prod);
    api.get(`/inventory/transactions/${prod.id}`).then(r => setTransactions(r.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = form.type === 'IN' ? '/inventory/stock-in' : form.type === 'OUT' ? '/inventory/stock-out' : '/inventory/adjust';
    try {
      await api.post(endpoint, {
        productId: form.productId,
        type: form.type,
        quantity: Number(form.quantity),
        reference: form.reference
      });
      setShowModal(false);
      setForm({ productId: '', type: 'IN', quantity: '', reference: '' });
      load();
      if (selectedProduct && selectedProduct.id === form.productId) {
        loadTransactions(selectedProduct);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventory</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Track stationery stock levels, perform stock-in, and view audit trail</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/import-csv"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200/80 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Import CSV</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Stock Entry</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center gap-2 mb-2 text-xs font-black text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Products ({lowStock.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {lowStock.map(p => (
              <div key={p.id} className="p-2.5 rounded-xl bg-white border border-amber-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 truncate">{p.name}</span>
                <span className="font-black text-rose-600 shrink-0">{p.currentStock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Stock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Inventory Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stock item or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <SearchableFilterDropdown
              value={catFilter}
              onChange={(val) => setCatFilter(val)}
              placeholder="All Categories"
              searchPlaceholder="Search categories..."
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: String(c.id), label: c.name }))
              ]}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Min Limit</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      if (search) {
                        const term = search.toLowerCase().trim();
                        const matchName = p.name?.toLowerCase().includes(term);
                        const matchSku = p.sku?.toLowerCase().includes(term);
                        if (!matchName && !matchSku) return false;
                      }
                      if (catFilter && String(p.categoryId || p.category?.id) !== String(catFilter)) {
                        return false;
                      }
                      return true;
                    })
                    .map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => loadTransactions(p)}
                    className={`cursor-pointer transition ${selectedProduct?.id === p.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-black ${p.lowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                        {p.currentStock}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{p.minStockLevel}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.lowStock ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.lowStock ? 'Reorder' : 'Healthy'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[11px] font-bold text-indigo-600 hover:underline">History</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* Transaction History Panel */}
        <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">
              {selectedProduct ? `${selectedProduct.name}` : 'Select a Product'}
            </h3>
          </div>

          {selectedProduct ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {transactions.map(t => (
                <div key={t.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : t.type === 'OUT' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {t.type === 'IN' ? <ArrowDown className="w-3 h-3" /> : t.type === 'OUT' ? <ArrowUp className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                    </span>
                    <div>
                      <div className="font-bold text-slate-700">{t.type}</div>
                      <div className="text-[10px] text-slate-400">{t.reference}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-800">{t.quantity} pcs</span>
                    <div className="text-[10px] text-slate-400">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">No stock transactions recorded yet.</div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400 font-medium">
              Click on any product on the left to inspect its complete stock audit trail.
            </div>
          )}
        </div>
      </div>

      {/* Stock Entry Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-300/50 shrink-0">
                  <Boxes className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Record Stock Transaction
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Adjust stock in, stock out, or log manual physical count
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
              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Product <span className="text-rose-500">*</span>
                </label>
                <FormSelect
                  value={form.productId}
                  onChange={(val) => setForm({ ...form, productId: val })}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (Stock: ${p.currentStock})`
                  }))}
                  placeholder="Select item"
                  icon={Box}
                  triggerClassName="!py-3 !rounded-2xl !bg-slate-100/70 hover:!bg-slate-100/90 !border-slate-200/50 shadow-inner"
                />
              </div>

              {/* Type & Quantity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Transaction Type <span className="text-rose-500">*</span>
                  </label>
                  <FormSelect
                    value={form.type}
                    onChange={(val) => setForm({ ...form, type: val })}
                    options={[
                      { value: 'IN', label: 'Stock In (+)' },
                      { value: 'OUT', label: 'Stock Out (-)' },
                      { value: 'ADJUST', label: 'Adjustment (=)' }
                    ]}
                    icon={ArrowUpDown}
                    triggerClassName="!py-3 !rounded-2xl !bg-slate-100/70 hover:!bg-slate-100/90 !border-slate-200/50 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                    <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g. 25"
                      className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reference / Note
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/70 hover:bg-slate-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 border border-slate-200/50 transition-all duration-200 shadow-inner">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    placeholder="e.g. Supplier Invoice #9912 or Stock count"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
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
                  <span>Submit Entry</span>
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
