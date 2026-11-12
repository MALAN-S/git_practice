import React, { useState, useEffect } from 'react';
import { Store, Printer, Server, CheckCircle2, RotateCcw } from 'lucide-react';
import { useStoreSettings, saveSettingsToServer, loadSettingsFromServer } from '../services/settings';
import api from '../services/api';

export default function Settings() {
  const settings = useStoreSettings();

  const [shopName, setShopName] = useState(settings.shopName || 'Shop');
  const [tagline, setTagline] = useState(settings.tagline || 'Xerox, Print & Stationery Store');
  const [timezone] = useState(settings.timezone || 'Asia/Kolkata (IST)');
  const [billPrefix, setBillPrefix] = useState(settings.billPrefix || 'BILL');
  const [headerNote, setHeaderNote] = useState(settings.headerNote || 'Welcome to our Xerox & Print Center');
  const [footerNote, setFooterNote] = useState(settings.footerNote || 'Thank you for visiting! Please come again.');

  const [savingStore, setSavingStore] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [receiptSaved, setReceiptSaved] = useState(false);
  const [resettingCounter, setResettingCounter] = useState(false);
  const [counterReset, setCounterReset] = useState(false);

  // Sync inputs if settings loaded asynchronously
  useEffect(() => {
    if (settings.shopName !== undefined) setShopName(settings.shopName);
    if (settings.tagline !== undefined) setTagline(settings.tagline);
    if (settings.billPrefix !== undefined) setBillPrefix(settings.billPrefix);
    if (settings.headerNote !== undefined) setHeaderNote(settings.headerNote);
    if (settings.footerNote !== undefined) setFooterNote(settings.footerNote);
  }, [settings]);

  const handleSaveStore = async () => {
    setSavingStore(true);
    await saveSettingsToServer({
      shopName: shopName.trim() || 'Shop',
      tagline: tagline.trim() || 'Xerox, Print & Stationery Store',
      billPrefix: billPrefix.trim().toUpperCase() || 'BILL'
    });
    setSavingStore(false);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 3000);
  };

  const handleSaveReceipt = async () => {
    setSavingReceipt(true);
    await saveSettingsToServer({
      headerNote: headerNote.trim(),
      footerNote: footerNote.trim()
    });
    setSavingReceipt(false);
    setReceiptSaved(true);
    setTimeout(() => setReceiptSaved(false), 3000);
  };

  const handleResetCounter = async () => {
    if (!window.confirm('Are you sure you want to reset the bill counter? Next bill will start from 001.')) return;
    setResettingCounter(true);
    try {
      await api.post('/settings/reset-bill-counter');
      await loadSettingsFromServer();
      setCounterReset(true);
      setTimeout(() => setCounterReset(false), 3000);
    } catch (e) {
      console.error('Failed to reset counter:', e);
    }
    setResettingCounter(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Store configuration, receipt headers, and system parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">Store Profile</h3>
              </div>
              {storeSaved && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved & Applied</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Shop Name"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Address / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Store address or tagline"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bill Number Prefix</label>
              <input
                type="text"
                value={billPrefix}
                onChange={(e) => setBillPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. BILL, INV, SHOP"
                maxLength={10}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
              />
              <p className="text-[10px] text-slate-400 mt-1">Next bill: {billPrefix || 'BILL'}-{String(Number(settings.billCounter || 0) + 1).padStart(3, '0')}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bill Counter</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-600">
                  Current: {settings.billCounter || '0'} bills generated
                </div>
                <button
                  onClick={handleResetCounter}
                  disabled={resettingCounter}
                  className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {resettingCounter ? 'Resetting...' : 'Reset'}
                </button>
              </div>
              {counterReset && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Counter reset! Next bill starts from 001</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Default Timezone</label>
              <input
                disabled
                value={timezone}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveStore}
              disabled={savingStore}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>{savingStore ? 'Saving...' : 'Save Store Info'}</span>
            </button>
          </div>
        </div>

        {/* Customer Receipt Options Card */}
        <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">Customer Receipt Options</h3>
              </div>
              {receiptSaved && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved & Applied</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Header Note</label>
              <input
                type="text"
                value={headerNote}
                onChange={(e) => setHeaderNote(e.target.value)}
                placeholder="Welcome note on customer receipt"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Footer Note</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder="Thank you note on customer receipt"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveReceipt}
              disabled={savingReceipt}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>{savingReceipt ? 'Saving...' : 'Save Receipt Template'}</span>
            </button>
          </div>
        </div>

        {/* System Architecture Diagnostic */}
        <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Server className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">Connected Services & Infrastructure</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Backend API</div>
              <div className="font-black text-slate-800 mt-1">Spring Boot 3.2.2</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Frontend</div>
              <div className="font-black text-slate-800 mt-1">React + Tailwind v3</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Database</div>
              <div className="font-black text-slate-800 mt-1">PostgreSQL 16</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Migration Engine</div>
              <div className="font-black text-slate-800 mt-1">Flyway v9</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
