import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import ImportCsv from './pages/ImportCsv';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import BillHistory from './pages/BillHistory';
import Users from './pages/Users';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:overflow-visible print:p-0 print:m-0 print:h-auto print:block">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/products" element={<Products />} />
            <Route path="/import-csv" element={<ImportCsv />} />
            <Route path="/products/import" element={<ImportCsv />} />
            <Route path="/services" element={<Services />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/bill-history" element={<BillHistory />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
