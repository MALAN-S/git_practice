import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useStoreSettings } from '../services/settings';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const settings = useStoreSettings();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let start = new Date();
      let end = new Date();

      if (activeTab === 'daily') {
        // Today
      } else if (activeTab === 'weekly') {
        start.setDate(today.getDate() - 6);
      } else if (activeTab === 'monthly') {
        start.setDate(today.getDate() - 29);
      }

      const startDate = formatDate(start);
      const endDate = formatDate(end);

      const res = await api.get('/reports/range', { params: { startDate, endDate } });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const totalSales = Number(reportData?.totalSales ?? 0);
  const totalBills = Number(reportData?.totalBills ?? 0);
  const avgBillValue = totalBills > 0 ? (totalSales / totalBills) : 0;

  // Chart dataset dynamically derived from real backend sales
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = (reportData?.dailySales || []).map(d => {
    const parts = (d.date || '').split('-');
    const label = parts.length === 3 
      ? `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`
      : d.date;

    return {
      date: label,
      xerox: Number(d.xerox ?? 0),
      colorPrint: Number(d.colorPrint ?? 0),
      stationery: Number(d.stationery ?? 0),
      total: Number(d.total ?? 0)
    };
  });

  // Export to Excel
  const exportExcel = () => {
    const wsData = [
      ['Metric', 'Value'],
      ['Total Sales', totalSales],
      ['Total Bills', totalBills],
      ['Average Bill Value', avgBillValue.toFixed(2)],
      ['Xerox Sales', Number(reportData?.xeroxSales ?? 0)],
      ['Color Print Sales', Number(reportData?.colorPrintSales ?? 0)],
      ['Stationery Sales', Number(reportData?.stationerySales ?? 0)],
      [],
      ['Day', 'Xerox (₹)', 'Color Print (₹)', 'Stationery (₹)', 'Total (₹)'],
      ...chartData.map(d => [d.date, d.xerox, d.colorPrint, d.stationery, d.total])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${settings.shopName || 'Shop'} Sales Report`);
    XLSX.writeFile(wb, `${(settings.shopName || 'Shop').replace(/\s+/g, '_')}_Sales_Report_${activeTab}.xlsx`);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${settings.shopName || 'Shop'} Analytics & Sales Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${activeTab.toUpperCase()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Summary Metric', 'Amount']],
      body: [
        ['Total Revenue', `Rs. ${totalSales.toFixed(2)}`],
        ['Total Transactions', `${totalBills} Bills`],
        ['Avg Bill Value', `Rs. ${avgBillValue.toFixed(2)}`],
        ['Xerox Services', `Rs. ${Number(reportData?.xeroxSales ?? 0).toFixed(2)}`],
        ['Color Printing', `Rs. ${Number(reportData?.colorPrintSales ?? 0).toFixed(2)}`],
        ['Stationery Products', `Rs. ${Number(reportData?.stationerySales ?? 0).toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    if (chartData.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Date', 'Xerox (Rs.)', 'Color Print (Rs.)', 'Stationery (Rs.)', 'Total (Rs.)']],
        body: chartData.map(d => [
          d.date,
          d.xerox.toFixed(2),
          d.colorPrint.toFixed(2),
          d.stationery.toFixed(2),
          d.total.toFixed(2)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });
    }

    doc.save(`Sales_Report_${activeTab}.pdf`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Analyze your shop performance</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100/60 text-xs font-bold transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-100 text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 transition relative ${activeTab === 'daily' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
        >
          Daily Report
          {activeTab === 'daily' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 transition relative ${activeTab === 'weekly' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
        >
          Weekly Report
          {activeTab === 'weekly' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-3 transition relative ${activeTab === 'monthly' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
        >
          Monthly Report
          {activeTab === 'monthly' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
        </button>
      </div>

      {/* Modern KPI Pill Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sales Card */}
        <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
          <div className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
            ₹ {totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Bills Card */}
        <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bills</span>
          <div className="mt-2 text-2xl font-black text-sky-700 tracking-tight">
            {totalBills}
          </div>
        </div>

        {/* Avg Bill Value Card */}
        <div className="p-5 rounded-2xl bg-fuchsia-50/40 border border-fuchsia-100/80 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg. Bill Value</span>
          <div className="mt-2 text-2xl font-black text-fuchsia-700 tracking-tight">
            ₹ {avgBillValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Sales Comparison Chart Card */}
      <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Sales Comparison</h2>
            {totalSales === 0 && (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                No sales recorded during this period
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
              <span>Xerox</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-600" />
              <span>Color Print</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
              <span>Stationery</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
              <YAxis domain={[0, totalSales > 0 ? 'auto' : 100]} stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                formatter={(val, name) => [`₹ ${Number(val).toFixed(2)}`, name]}
              />
              <Bar dataKey="xerox" name="Xerox" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="colorPrint" name="Color Print" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stationery" name="Stationery" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
