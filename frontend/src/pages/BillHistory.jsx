import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Search, Printer, Ban, Receipt, CheckCircle, Clock } from 'lucide-react';

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const load = () => {
    api.get('/bill-history').then(r => {
      setBills(r.data);
      if (r.data.length > 0 && !selectedBill) {
        setSelectedBill(r.data[0]);
      }
    });
  };
  useEffect(load, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this bill? All product stock will be refunded back to inventory.')) return;
    try {
      await api.post(`/bill-history/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const filteredBills = search
    ? bills.filter(b => b.billNumber.toLowerCase().includes(search.toLowerCase()))
    : bills;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bill History</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Search past transactions, reprint customer receipts, or cancel bills</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by bill number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Grid: Bill Table + Interactive Receipt Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bills Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBill(b)}
                    className={`cursor-pointer transition ${selectedBill?.id === b.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="py-3.5 px-4 font-black text-indigo-600">{b.billNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800">₹{Number(b.grandTotal).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'COMPLETED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slate-400 font-medium">No bills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Printable Customer Receipt Card */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800">Customer Receipt</h3>
            </div>
            {selectedBill && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint</span>
              </button>
            )}
          </div>

          {selectedBill ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <div className="font-black text-base text-slate-800">SHOP</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Xerox, Print & Stationery Store</div>
                <div className="text-[11px] font-bold text-indigo-600 mt-2">{selectedBill.billNumber}</div>
              </div>

              {/* Items List */}
              <div className="space-y-2 py-1">
                {(selectedBill.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <div className="font-bold text-slate-700">{it.itemName}</div>
                      <div className="text-[10px] text-slate-400">{it.quantity} × ₹{Number(it.unitPrice).toFixed(2)}</div>
                    </div>
                    <span className="font-black text-slate-800">₹{Number(it.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>₹{Number(selectedBill.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Discount</span>
                  <span>-₹{Number(selectedBill.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-800 pt-1.5 border-t border-slate-200">
                  <span>Total Paid</span>
                  <span className="text-indigo-600">₹{Number(selectedBill.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 font-medium">
                Payment: <span className="font-bold text-slate-600">{selectedBill.paymentMethod}</span> • Status: <span className="font-bold text-emerald-600">{selectedBill.status}</span>
                <div className="mt-1">Thank you for visiting!</div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 font-medium">
              Click on any bill in the list to inspect or reprint the receipt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
