import React from 'react';
import { Settings as SettingsIcon, Store, Printer, Server, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Store configuration, receipt headers, and system parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Store className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">Store Profile</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shop Name</label>
            <input defaultValue="Shop" className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Address / Tagline</label>
            <input defaultValue="Xerox, Print & Stationery Store" className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Default Timezone</label>
            <input disabled defaultValue="Asia/Kolkata (IST)" className="w-full px-3.5 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed" />
          </div>
          <button onClick={() => alert('Profile settings saved')} className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition">
            Save Store Info
          </button>
        </div>

        {/* Receipt Setup */}
        <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Printer className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">Customer Receipt Options</h3>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Header Note</label>
            <input defaultValue="Welcome to our Xerox & Print Center" className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Footer Note</label>
            <input defaultValue="Thank you for visiting! Please come again." className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none" />
          </div>
          <button onClick={() => alert('Receipt template updated')} className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition">
            Save Receipt Template
          </button>
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
