import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import SearchableFilterDropdown from '../components/SearchableFilterDropdown';
import FormSelect from '../components/FormSelect';
import {
  Package,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  UploadCloud,
  Box,
  Tag,
  Barcode,
  Layers,
  IndianRupee,
  Bell,
  ChevronDown,
  Folder
} from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock'

  // Notification
  const [success, setSuccess] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: 0,
    minStockLevel: 5,
    status: 'ACTIVE',
    categoryId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      sku: '',
      description: '',
      purchasePrice: '',
      sellingPrice: '',
      currentStock: 0,
      minStockLevel: 5,
      status: 'ACTIVE',
      categoryId: ''
    });
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      currentStock: p.currentStock,
      minStockLevel: p.minStockLevel != null ? p.minStockLevel : 5,
      status: p.status || 'ACTIVE',
      categoryId: p.categoryId || (p.category?.id) || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to deactivate or delete product '${p.name}'?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setSuccess(`Product '${p.name}' removed successfully`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      currentStock: Number(form.currentStock),
      minStockLevel: Number(form.minStockLevel),
      categoryId: form.categoryId ? Number(form.categoryId) : null
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        setSuccess(`Product '${form.name}' updated successfully`);
      } else {
        await api.post('/products', payload);
        setSuccess(`Product '${form.name}' created successfully`);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to save product');
    }
  };

  // Metrics
  const totalProducts = products.length;
  const inStockCount = products.filter(p => Number(p.currentStock) > 0).length;
  const lowStockCount = products.filter(
    p => p.lowStock || Number(p.currentStock) <= Number(p.minStockLevel != null ? p.minStockLevel : 5)
  ).length;
  const totalCategories = categories.length;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    // Search filter
    const term = search.toLowerCase().trim();
    if (term) {
      const matchName = p.name?.toLowerCase().includes(term);
      const matchSku = p.sku?.toLowerCase().includes(term);
      const categoryName = p.categoryName || p.category?.name || '';
      const matchCat = categoryName.toLowerCase().includes(term);
      if (!matchName && !matchSku && !matchCat) return false;
    }

    // Category filter
    if (catFilter) {
      const pCatId = p.categoryId || p.category?.id;
      if (String(pCatId) !== String(catFilter)) return false;
    }

    // Stock Status filter
    if (stockFilter === 'in_stock') {
      return Number(p.currentStock) > 0;
    }
    if (stockFilter === 'low_stock') {
      return p.lowStock || Number(p.currentStock) <= Number(p.minStockLevel != null ? p.minStockLevel : 5);
    }

    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Products</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage shop stationery items, pricing, SKU and inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/import-csv"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200/80 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-blue-600 stroke-[2]" />
            <span>Import CSV</span>
          </Link>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Products</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalProducts}</div>
          </div>
        </div>

        {/* In Stock Items */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">In Stock Items</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{inStockCount}</div>
          </div>
        </div>

        {/* Low / Out of Stock */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Low / Out of Stock</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{lowStockCount}</div>
          </div>
        </div>

        {/* Total Categories */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Categories</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalCategories}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Right side: Category Dropdown & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Category Filter Dropdown (Floating Material Style) */}
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                stockFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All ({totalProducts})
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                stockFilter === 'in_stock'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStockFilter('low_stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                stockFilter === 'low_stock'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">S.NO</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Purchase Price</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-slate-400 font-medium">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-slate-400 font-medium">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isLow = p.lowStock || Number(p.currentStock) <= Number(p.minStockLevel != null ? p.minStockLevel : 5);
                  const inStock = Number(p.currentStock) > 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      {/* # (Row Number) */}
                      <td className="py-4 px-4 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Product Name with Package Outline Icon */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-slate-700 stroke-[2] shrink-0" />
                          <span className="font-black text-slate-900 text-xs tracking-tight">
                            {p.name}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-slate-600 font-semibold">
                        {p.categoryName || p.category?.name || '—'}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-4 px-4 text-slate-600 font-semibold">
                        ₹{Number(p.purchasePrice || 0).toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4 font-black text-blue-600 text-xs">
                        ₹{Number(p.sellingPrice || 0).toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center gap-1 font-bold ${
                            isLow ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          <span>{p.currentStock}</span>
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                            inStock
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                            title="Edit Product"
                          >
                            <Pencil className="w-4 h-4 stroke-[2]" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <div className="space-y-5">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Box className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {editingId ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {editingId
                    ? 'Update product details, pricing, and stock'
                    : 'Fill in product details, pricing, and opening stock'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. A4 Copier Paper 75 GSM (500 Sheets)"
                  className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* SKU & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  SKU / Code <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. P-A4-75"
                    className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <FormSelect
                  value={form.categoryId}
                  onChange={(val) => setForm({ ...form, categoryId: val })}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select Category"
                  icon={Layers}
                />
              </div>
            </div>

            {/* Purchase Price & Selling Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Purchase Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <IndianRupee className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Current Stock & Min Stock Level Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Stock <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Box className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    placeholder="0"
                    className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Min Stock Alert Level <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                    placeholder="5"
                    className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                {editingId ? <Pencil className="w-4 h-4 stroke-[2]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                <span>{editingId ? 'Update Product' : 'Add Product'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
