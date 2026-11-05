import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Boxes, Plus, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, X, History } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '', reference: '' });

  const load = () => {
    api.get('/products').then(r => setProducts(r.data));
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Stock Entry</span>
        </button>
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
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
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
                {products.map(p => (
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
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">Record Stock Transaction</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product</label>
                <select required value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Select item</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="IN">Stock In (+)</option>
                    <option value="OUT">Stock Out (-)</option>
                    <option value="ADJUST">Adjustment (=)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantity</label>
                  <input required type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reference / Note</label>
                <input placeholder="e.g. Supplier Invoice #9912" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
