import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Clock,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MaterialDatePicker from '../components/MaterialDatePicker';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(getTodayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isToday = selectedDate === getTodayStr();

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const stepDay = (days) => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + days);
      const pad = (n) => String(n).padStart(2, '0');
      const nextDateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      setSelectedDate(nextDateStr);
    } catch (e) {
      console.error('Error stepping date:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard', { params: { date: selectedDate } })
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const todaySales = Number(data?.todaySales ?? 0);
  const todayBills = Number(data?.todayBills ?? 0);
  const totalExpenses = Number(data?.totalExpenses ?? 0);
  const estimatedProfit = Number(data?.estimatedProfit ?? 0);
  const xeroxSales = Number(data?.xeroxSales ?? 0);
  const colorPrintSales = Number(data?.colorPrintSales ?? 0);
  const stationerySales = Number(data?.stationerySales ?? 0);
  const lowStock = data?.lowStockProducts ?? [];
  const recent = data?.recentTransactions ?? [];

  // Calculate actual sales progression across business hours
  // Only display real data when sales actually occurred at that time
  const timeSlots = [
    { label: '6 AM', hour: 6 },
    { label: '8 AM', hour: 8 },
    { label: '10 AM', hour: 10 },
    { label: '12 PM', hour: 12 },
    { label: '2 PM', hour: 14 },
    { label: '4 PM', hour: 16 },
    { label: '6 PM', hour: 18 },
    { label: '8 PM', hour: 20 },
    { label: '10 PM', hour: 22 },
    { label: '11 PM', hour: 23 },
  ];

  const trendData = timeSlots.map(slot => {
    // If no sales today, strictly display 0
    if (todaySales === 0) {
      return { time: slot.label, sales: 0 };
    }

    // If we have transactions for this selected date, sum sales up to this hour
    if (recent && recent.length > 0) {
      const cumulativeSales = recent
        .filter(tx => {
          if (!tx.createdAt) return false;
          const txHour = new Date(tx.createdAt).getHours();
          return txHour <= slot.hour;
        })
        .reduce((sum, tx) => sum + Number(tx.grandTotal || tx.totalAmount || 0), 0);
      return { time: slot.label, sales: cumulativeSales };
    }

    // If todaySales > 0 but transaction list was not populated
    const currentHour = isToday ? new Date().getHours() : 23;
    return {
      time: slot.label,
      sales: slot.hour <= currentHour ? todaySales : 0
    };
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {isToday
              ? "Live sales counters, analytics, and shop overview"
              : `Sales counters, analytics, and overview for ${formattedDisplayDate}`}
          </p>
        </div>

        {/* Date Filter & Day Navigation */}
        <div className="flex items-center gap-3">
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayStr())}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/80 transition active:scale-95 cursor-pointer"
              title="Reset to today"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              <span>Today</span>
            </button>
          )}

          {/* Inline Date Selector with Arrows & Underline */}
          <MaterialDatePicker
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            onPrev={() => stepDay(-1)}
            onNext={() => stepDay(1)}
            align="right"
          />
        </div>
      </div>

      {/* KPI Cards Grid - Matching Pill Card Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isToday ? "Today's Sales" : "Sales"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-700 tracking-tight">
            ₹ {todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Bills */}
        <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isToday ? "Today's Bills" : "Bills"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-sky-700 tracking-tight">
            {todayBills} Bills
          </div>
        </div>

        {/* Expenses */}
        <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isToday ? "Today's Expenses" : "Expenses"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600 tracking-tight">
            ₹ {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimated Profit</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-700 tracking-tight">
            ₹ {estimatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Xerox Services</span>
            <span className="text-slate-800 font-extrabold">₹{xeroxSales.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${todaySales > 0 ? (xeroxSales / todaySales) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Color Printing</span>
            <span className="text-slate-800 font-extrabold">₹{colorPrintSales.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-violet-600 h-full rounded-full transition-all duration-500" style={{ width: `${todaySales > 0 ? (colorPrintSales / todaySales) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Stationery Products</span>
            <span className="text-slate-800 font-extrabold">₹{stationerySales.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${todaySales > 0 ? (stationerySales / todaySales) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 tracking-tight">
            {isToday ? "Today's Sales Progression" : `Sales Progression (${formattedDisplayDate})`}
          </h2>
          {todaySales > 0 ? (
            <span className="text-xs font-bold text-indigo-600">
              {isToday ? "Realtime" : "Recorded"}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {isToday ? "No sales recorded yet today" : `No sales recorded on ${formattedDisplayDate}`}
            </span>
          )}
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} interval={0} />
              <YAxis
                domain={[0, todaySales > 0 ? 'auto' : 100]}
                stroke="#94a3b8"
                tick={{ fontSize: 11, fontWeight: 600 }}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [`₹ ${Number(val).toFixed(2)}`, 'Sales']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Recent Bills & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              {isToday ? "Recent Transactions" : `Transactions (${formattedDisplayDate})`}
            </h3>
            <Link to="/bill-history" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium">
              {isToday ? "No recent transactions recorded today yet." : `No transactions recorded for ${formattedDisplayDate}.`}
            </div>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 5).map(b => (
                <div key={b.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      #{b.billNumber.slice(-4)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{b.billNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{b.paymentMethod}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">₹{Number(b.grandTotal).toFixed(2)}</div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Alerts</span>
            </h3>
            <Link to="/inventory" className="text-xs font-bold text-indigo-600">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              ✨ All products healthy and well-stocked.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 4).map(p => (
                <div key={p.id} className="p-3 rounded-xl bg-white border border-amber-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{p.name}</div>
                    <div className="text-[10px] text-slate-400">Min: {p.minStockLevel}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600">{p.currentStock} left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
