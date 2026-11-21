import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ReceiptSlip from '../components/ReceiptSlip';
import SearchableFilterDropdown from '../components/SearchableFilterDropdown';
import { toast } from '../context/ToastContext';
import { History, Search, Printer, Receipt, CheckCircle, Clock, X, Banknote, QrCode, CreditCard, AlertCircle, User, Phone, ArrowRight } from 'lucide-react';

export default function BillHistory() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  // Pay balance modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBill, setPayBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);

  const load = () => {
    api.get('/bill-history').then(r => {
      setBills(r.data);
      if (r.data.length > 0 && !selectedBill) {
        setSelectedBill(r.data[0]);
      } else if (selectedBill) {
        const updated = r.data.find(b => b.id === selectedBill.id);
        if (updated) setSelectedBill(updated);
      }
    });
  };
  useEffect(load, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this bill? All product stock will be refunded back to inventory.')) return;
    try {
      await api.post(`/bill-history/${id}/cancel`);
      toast.success('Bill cancelled and inventory refunded successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    }
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
      const res = await api.post(`/bill-history/${payBill.id}/pay-balance`, {
        amount,
        paymentMethod: payMethod
      });
      toast.success(`Payment of ₹${Math.round(amount)} recorded successfully!`);
      setShowPayModal(false);
      setPayBill(null);
      setPayAmount('');
      if (selectedBill && selectedBill.id === res.data.id) {
        setSelectedBill(res.data);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    }
    setPayLoading(false);
  };

  const filteredBills = bills.filter((b) => {
    const searchLower = search.toLowerCase().trim();
    if (search) {
      const matchBillNumber = b.billNumber?.toLowerCase().includes(searchLower);
      const matchCustomer = (b.customerName || '').toLowerCase().includes(searchLower);
      const matchPhone = (b.customerPhone || '').toLowerCase().includes(searchLower);
      if (!matchBillNumber && !matchCustomer && !matchPhone) return false;
    }
    if (paymentFilter && b.paymentMethod !== paymentFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bill History</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Search past transactions, reprint customer receipts, or cancel bills</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchableFilterDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="All Status"
            searchPlaceholder="Filter status..."
            options={[
              { value: '', label: 'All Status' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'PARTIAL', label: 'Partial (Due)' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]}
          />
          <SearchableFilterDropdown
            value={paymentFilter}
            onChange={(val) => setPaymentFilter(val)}
            placeholder="All Payment Modes"
            searchPlaceholder="Search payment mode..."
            options={[
              { value: '', label: 'All Payment Modes' },
              { value: 'CASH', label: 'Cash' },
              { value: 'UPI', label: 'UPI / QR' },
              { value: 'CARD', label: 'Card' }
            ]}
          />
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bill, customer or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Main Container: Table (Left, flex-1) + Interactive Receipt (Right, 350px) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Bills Table */}
        <div className="flex-1 min-w-0 w-full rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white print:hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[17%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-2 text-center">S.NO</th>
                  <th className="py-3 px-4 text-left">Bill Number</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-3 text-center">Date</th>
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-3 text-center">Paid / Balance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b, idx) => {
                  const isPartial = b.status === 'PARTIAL';
                  const isSelected = selectedBill?.id === b.id;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      className={`cursor-pointer transition ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'}`}
                    >
                      {/* S.NO / # */}
                      <td className="py-3 px-2 align-middle text-center text-slate-400 font-bold text-xs">{idx + 1}</td>

                      {/* BILL NUMBER */}
                      <td className="py-3 px-4 align-middle text-left whitespace-nowrap">
                        <div className="font-black text-indigo-600 text-xs truncate" title={b.billNumber}>{b.billNumber}</div>
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 tracking-wide">
                            {b.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-3 px-4 align-middle text-left">
                        {b.customerName ? (
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate" title={b.customerName}>{b.customerName}</div>
                            {b.customerPhone && (
                              <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{b.customerPhone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">Walk-in</span>
                        )}
                      </td>

                      {/* DATE */}
                      <td className="py-3 px-3 align-middle text-slate-600 font-medium text-xs whitespace-nowrap text-center">
                        {b.createdAt ? (
                          <div>
                            <div className="font-semibold text-slate-700">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                          </div>
                        ) : '—'}
                      </td>

                      {/* TOTAL */}
                      <td className="py-3 px-3 align-middle font-black text-slate-800 text-xs whitespace-nowrap text-center">
                        ₹{Math.round(Number(b.grandTotal))}
                      </td>

                      {/* PAID / BALANCE */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-center">
                        {isPartial ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-emerald-600 text-[11px]">
                              ₹{Math.round(Number(b.paidAmount))} <span className="font-normal text-[9px]">paid</span>
                            </div>
                            <div className="font-bold text-amber-600 text-[11px]">
                              ₹{Math.round(Number(b.balanceAmount))} <span className="font-normal text-[9px]">due</span>
                            </div>
                          </div>
                        ) : (
                          <div className="font-bold text-emerald-600 text-xs">
                            Fully Paid
                          </div>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                          b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          b.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center">
                          <div className="w-[84px] text-right pr-2.5">
                            {isPartial ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); openPayModal(b); }}
                                className="font-black text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition cursor-pointer whitespace-nowrap"
                              >
                                Pay Balance
                              </button>
                            ) : null}
                          </div>
                          <div className="w-[50px] text-left">
                            {(b.status === 'COMPLETED' || b.status === 'PARTIAL') ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                                className="font-bold text-xs text-rose-500 hover:text-rose-700 transition cursor-pointer whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-xs text-slate-400 font-medium">No bills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Printable Customer Receipt Card */}
        <div className="w-full lg:w-[350px] xl:w-[360px] shrink-0 rounded-2xl bg-slate-50/70 border border-slate-100 p-5 space-y-4 print:w-full print:p-0 print:border-none print:bg-white print:m-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden no-print">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800">Customer Receipt</h3>
            </div>
            {selectedBill && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint</span>
              </button>
            )}
          </div>

          {/* Quick Pay Balance Bar if selected bill is partial */}
          {selectedBill && selectedBill.status === 'PARTIAL' && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between print:hidden no-print">
              <div>
                <div className="text-xs font-bold text-amber-900">
                  Balance Due: ₹{Math.round(Number(selectedBill.balanceAmount))}
                </div>
                <div className="text-[10px] text-amber-700 font-medium">
                  Paid ₹{Math.round(Number(selectedBill.paidAmount))} of ₹{Math.round(Number(selectedBill.grandTotal))}
                </div>
              </div>
              <button
                onClick={() => openPayModal(selectedBill)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <span>Pay Balance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {selectedBill ? (
            <ReceiptSlip bill={selectedBill} />
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 font-medium">
              Click on any bill in the list to inspect or reprint the receipt.
            </div>
          )}
        </div>
      </div>

      {/* Pay Balance Modal */}
      <Modal isOpen={showPayModal && Boolean(payBill)} onClose={() => setShowPayModal(false)} maxWidth="max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-300/50 shrink-0">
              <Banknote className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Pay Balance</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Bill: <span className="font-bold text-indigo-600">{payBill?.billNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPayModal(false)}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 relative z-10 pt-1">
          {/* Customer Info */}
          {(payBill?.customerName || payBill?.customerPhone) && (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 space-y-1">
              {payBill.customerName && (
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-700">{payBill.customerName}</span>
                </div>
              )}
              {payBill.customerPhone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-600">{payBill.customerPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Bill Summary */}
          {payBill && (
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/60 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Grand Total</span>
                <span>₹{Math.round(Number(payBill.grandTotal))}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Already Paid</span>
                <span>₹{Math.round(Number(payBill.paidAmount))}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-amber-700 pt-1.5 border-t border-amber-200">
                <span>Balance Due</span>
                <span>₹{Math.round(Number(payBill.balanceAmount))}</span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Payment Amount (₹)</label>
            <input
              type="number"
              min="1"
              max={Number(payBill?.balanceAmount || 0)}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-1.5">Payment Method</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      payMethod === m.id
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              disabled={payLoading || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > Number(payBill?.balanceAmount || 0)}
              onClick={handlePayBalance}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-200 disabled:opacity-50 transition duration-200 cursor-pointer"
            >
              {payLoading ? 'Processing...' : `Pay ₹${payAmount || '0.00'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
