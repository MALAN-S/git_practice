import React from 'react';
import { useStoreSettings } from '../services/settings';

export default function ReceiptSlip({ bill }) {
  const settings = useStoreSettings();
  if (!bill) return null;

  const items = bill.items || [];
  const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const formattedDate = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="receipt-slip bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 font-mono text-xs w-full max-w-sm mx-auto shadow-sm print:shadow-none print:border print:border-dashed print:border-slate-400 print:p-4 print:max-w-[80mm] print:w-[80mm] print:mx-auto">
      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-slate-300">
        <h2 className="text-base font-black tracking-widest text-slate-900 uppercase">
          {settings.shopName || 'SHOP'}
        </h2>
        <p className="text-[10px] text-slate-500 font-sans mt-0.5">
          {settings.tagline || 'Xerox, Print & Stationery Store'}
        </p>
        {settings.headerNote && (
          <p className="text-[9px] text-slate-600 font-sans mt-0.5 italic">
            {settings.headerNote}
          </p>
        )}
        <p className="text-[9px] text-slate-400 font-sans tracking-wide uppercase mt-0.5">Tax Invoice / Cash Memo</p>
      </div>

      {/* Bill Details */}
      <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Bill No:</span>
          <span className="font-bold text-slate-900">{bill.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date:</span>
          <span className="text-slate-700">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Payment Mode:</span>
          <span className="font-bold text-slate-900">{bill.paymentMethod}</span>
        </div>
        {bill.status && (
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-emerald-700">{bill.status}</span>
          </div>
        )}
      </div>

      {/* Product Items Table */}
      <div className="py-2.5 border-b border-dashed border-slate-300">
        <div className="flex justify-between font-bold text-[10px] uppercase text-slate-400 pb-1.5 border-b border-slate-100 mb-2">
          <span>Item</span>
          <div className="flex gap-3 text-right">
            <span className="w-8">Qty</span>
            <span className="w-12">Rate</span>
            <span className="w-14">Amount</span>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-start text-[11px]">
              <div className="flex-1 pr-2">
                <div className="font-bold text-slate-900 leading-tight">{it.itemName}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {it.type === 'SERVICE' ? 'Service' : 'Product'}
                </div>
              </div>
              <div className="flex gap-3 text-right shrink-0">
                <span className="w-8 text-slate-700 font-medium">{it.quantity}</span>
                <span className="w-12 text-slate-600 font-sans">₹{Number(it.unitPrice).toFixed(2)}</span>
                <span className="w-14 font-bold text-slate-900 font-sans">
                  ₹{Number(it.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-2 text-slate-400 text-xs font-sans">No products recorded</div>
          )}
        </div>
      </div>

      {/* Totals Summary */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
        <div className="flex justify-between text-slate-600 font-sans">
          <span>Items: {items.length} (Qty: {totalQty})</span>
          <span>₹{Number(bill.totalAmount || bill.grandTotal).toFixed(2)}</span>
        </div>
        {Number(bill.discount) > 0 && (
          <div className="flex justify-between text-emerald-700 font-sans font-semibold">
            <span>Discount:</span>
            <span>-₹{Number(bill.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-200">
          <span>GRAND TOTAL:</span>
          <span>₹{Number(bill.grandTotal).toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-3 text-[10px] text-slate-500 font-sans space-y-0.5">
        <p className="font-bold text-slate-700">
          {settings.footerNote || 'Thank you for visiting! Please come again.'}
        </p>
        <p className="text-[9px] text-slate-400">Goods once sold cannot be returned</p>
      </div>
    </div>
  );
}

