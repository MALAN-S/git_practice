import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Layers,
  Box,
  CheckCircle2,
  Folder,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'empty'

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name: categoryName.trim() });
        setSuccess(`Category '${categoryName.trim()}' updated successfully`);
      } else {
        await api.post('/categories', { name: categoryName.trim() });
        setSuccess(`Category '${categoryName.trim()}' created successfully`);
      }
      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save category');
    }
    setSubmitting(false);
  };

  const handleDelete = async (cat) => {
    const productCount = products.filter(
      p => p.category?.id === cat.id || p.categoryId === cat.id
    ).length;

    if (productCount > 0) {
      alert(`Cannot delete '${cat.name}' because it contains ${productCount} product(s). Please reassign or delete those products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category '${cat.name}'?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${cat.id}`);
      setSuccess(`Category '${cat.name}' deleted successfully`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const getCategoryProducts = (catId) => {
    return products.filter(p => p.category?.id === catId || p.categoryId === catId);
  };

  // Metrics calculation
  const totalCategories = categories.length;
  const activeCount = categories.filter(c => getCategoryProducts(c.id).length > 0).length;
  const emptyCount = totalCategories - activeCount;
  const totalMappedProducts = products.filter(p => p.category?.id != null || p.categoryId != null).length;

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const count = getCategoryProducts(c.id).length;
    if (filterType === 'active') return count > 0;
    if (filterType === 'empty') return count === 0;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categories</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Classify inventory into structured categories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Category</span>
        </button>
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
        {/* Total Categories */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Categories</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalCategories}</div>
          </div>
        </div>

        {/* Mapped Items */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Box className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Mapped Items</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalMappedProducts}</div>
          </div>
        </div>

        {/* Active With Stock */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Active With Stock</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{activeCount}</div>
          </div>
        </div>

        {/* Empty Categories */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Empty Categories</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{emptyCount}</div>
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
            placeholder="Search categories..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold self-end sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All ({totalCategories})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'active'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            With Items ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('empty')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'empty'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Empty ({emptyCount})
          </button>
        </div>
      </div>

      {/* Categories Data Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-slate-700 font-bold text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-6 w-16 text-center">S.NO</th>
                <th className="py-3.5 px-6">Category Name</th>
                <th className="py-3.5 px-6 text-center">Products</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-slate-400 font-medium">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-slate-400 font-medium">
                    No categories found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const count = getCategoryProducts(cat.id).length;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                      {/* # (Row Number) */}
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Category Name with Tag Outline Icon */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-slate-700 stroke-[2]" />
                          <span className="font-black text-slate-900 text-xs tracking-tight">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      {/* Products Count */}
                      <td className="py-4 px-6 text-center font-semibold text-slate-700">
                        {count}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                            count > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count > 0 ? 'In Stock' : 'Empty'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                            title="Edit Category"
                          >
                            <Pencil className="w-4 h-4 stroke-[2]" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition"
                            title="Delete Category"
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

      {/* Add / Edit Category Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-md">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {editingCategory ? 'Update category name' : 'Add a product category'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Stationery, Paper, Spiral Binding"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
