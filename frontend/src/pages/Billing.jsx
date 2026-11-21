import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ReceiptSlip from '../components/ReceiptSlip';
import SearchableFilterDropdown from '../components/SearchableFilterDropdown';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Phone,
  X,
  Layers
} from 'lucide-react';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [serviceRates, setServiceRates] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [searchTerm, setSearchTerm] = useState('');
  const [billResult, setBillResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Partial payment state
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => { });
    api.get('/categories').then(r => setCategories(r.data)).catch(() => { });
    api.get('/service-rates').then(r => setServiceRates(r.data)).catch(() => { });
  };

  const addProductToCart = (p) => {
    const existing = cart.find(c => c.itemId === p.id && c.type === 'PRODUCT');
    if (existing) {
      if (existing.qty >= p.currentStock) {
        alert(`Cannot add more. Available stock: ${p.currentStock}`);
        return;
      }
      setCart(cart.map(c => c === existing ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { itemId: p.id, name: p.name, price: Number(p.sellingPrice), qty: 1, type: 'PRODUCT', stock: p.currentStock }]);
    }
  };

  const addServiceToCart = (rate) => {
    const existing = cart.find(c => c.itemId === rate.id && c.type === 'SERVICE');
    if (existing) {
      setCart(cart.map(c => c === existing ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        itemId: rate.serviceId,
        rateId: rate.id,
        name: `${rate.serviceName} (${rate.paperSize} ${rate.sides})`,
        price: Number(rate.pricePerPage),
        qty: 1,
        type: 'SERVICE'
      }]);
    }
  };

  const updateQty = (index, delta) => {
    setCart(cart.map((c, i) => {
      if (i === index) {
        const newQty = (Number(c.qty) || 0) + delta;
        if (c.type === 'PRODUCT' && newQty > c.stock) {
          alert(`Max stock available: ${c.stock}`);
          return c;
        }
        return newQty > 0 ? { ...c, qty: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const handleQtyChange = (index, val) => {
    setCart(cart.map((c, i) => {
      if (i === index) {
        if (val === '') return { ...c, qty: '' };
        const num = parseInt(val, 10);
        if (isNaN(num)) return c;
        if (c.type === 'PRODUCT' && num > c.stock) {
          alert(`Max stock available: ${c.stock}`);
          return { ...c, qty: c.stock };
        }
        return { ...c, qty: Math.max(1, num) };
      }
      return c;
    }));
  };

  const handleQtyBlur = (index) => {
    setCart(cart.map((c, i) => {
      if (i === index) {
        if (!c.qty || Number(c.qty) < 1) {
          return { ...c, qty: 1 };
        }
      }
      return c;
    }));
  };

  const handlePriceChange = (index, val) => {
    setCart(cart.map((c, i) => {
      if (i === index) {
        if (val === '') return { ...c, price: 0, customTotalStr: '' };
        const totalNum = parseFloat(val);
        if (isNaN(totalNum)) return c;
        const qty = Math.max(1, Number(c.qty) || 1);
        return { ...c, price: Math.max(0, totalNum / qty), customTotalStr: val };
      }
      return c;
    }));
  };

  const handlePriceBlur = (index) => {
    setCart(cart.map((c, i) => {
      if (i === index) {
        const { customTotalStr, ...rest } = c;
        return rest;
      }
      return c;
    }));
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, c) => sum + (Number(c.price) || 0) * (Number(c.qty) || 0), 0);
  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const handleCheckout = async (isPartial = false) => {
    if (cart.length === 0) return;

    if (isPartial) {
      const paid = Number(paidAmount);
      if (!paid || paid <= 0) {
        alert('Please enter a valid paid amount.');
        return;
      }
      if (paid >= grandTotal) {
        alert('Paid amount must be less than Grand Total for partial payment. Use full payment instead.');
        return;
      }
      if (!customerName.trim()) {
        alert('Customer name is required for partial payment.');
        return;
      }
      if (!customerPhone.trim()) {
        alert('Customer phone number is required for partial payment.');
        return;
      }
    }

    setLoading(true);
    try {
      const items = cart.map(c => ({
        productId: c.type === 'PRODUCT' ? c.itemId : null,
        serviceId: c.type === 'SERVICE' ? c.itemId : null,
        quantity: Math.max(1, Number(c.qty) || 1),
        unitPrice: Number(c.price) || 0
      }));

      const payload = {
        items,
        discount: Number(discount || 0),
        paymentMethod
      };

      if (isPartial) {
        payload.paidAmount = Number(paidAmount);
        payload.customerName = customerName.trim();
        payload.customerPhone = customerPhone.trim();
      }

      const res = await api.post('/billing/create-bill', payload);
      setBillResult(res.data);
      setCart([]);
      setDiscount(0);
      setShowPartialModal(false);
      setPaidAmount('');
      setCustomerName('');
      setCustomerPhone('');
      loadCatalog();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Checkout failed');
    }
    setLoading(false);
  };

  const openPartialPayment = () => {
    if (cart.length === 0) return;
    setPaidAmount('');
    setCustomerName('');
    setCustomerPhone('');
    setShowPartialModal(true);
  };

  // Categorize service rates into speed key groups matching Touch-POS layout
  const categorizeRate = (rate) => {
    const name = (rate.serviceName || '').toLowerCase();
    if (name.includes('lam') || name.includes('bind') || name.includes('punch') || name.includes('staple') || name.includes('fold')) {
      return 'FINISHING';
    }
    if (name.includes('3d') || name.includes('plot') || name.includes('a2') || name.includes('a1') || name.includes('a0') || name.includes('vinyl') || name.includes('card') || name.includes('badge') || name.includes('special')) {
      return 'SPECIALTY';
    }
    return 'PRINT';
  };

  const getServiceBadge = (rate) => {
    const name = (rate.serviceName || '').toLowerCase();
    const paper = rate.paperSize || 'A4';
    const side = rate.sides === 'SINGLE' ? '1S' : '2S';

    if (name.includes('xerox')) return `${paper} • ${side}`;
    if (name.includes('color')) return `${paper} • ${rate.sides === 'SINGLE' ? 'CLR' : 'CLR 2S'}`;
    if (name.includes('scan')) return `${paper} • SCAN`;
    if (name.includes('lam')) return `${paper} • LAM`;
    if (name.includes('bind')) return `${paper} • BIND`;
    if (name.includes('3d')) return '3D PRINT';
    if (name.includes('a2') || name.includes('plot')) return 'A2 PLOT';
    return `${paper} • ${side}`;
  };

  const getServiceSubtitle = (rate) => {
    const name = (rate.serviceName || '').toLowerCase();
    const isSingle = rate.sides === 'SINGLE';

    if (name.includes('xerox')) return isSingle ? 'Single Sided' : 'Double Sided';
    if (name.includes('color')) return isSingle ? `${rate.paperSize} Single Sided` : `${rate.paperSize} Double Sided`;
    if (name.includes('scan')) return `${rate.paperSize} High-Res Scan`;
    if (name.includes('lam')) return `${rate.paperSize} Gloss Pouch`;
    if (name.includes('bind')) return `${rate.paperSize} Standard Binding`;
    if (name.includes('3d')) return 'PLA Rapid Prototype';
    if (name.includes('a2') || name.includes('plot')) return 'Arch CAD / Poster Sheet';
    return `${rate.paperSize} • ${isSingle ? 'Single Sided' : 'Double Sided'}`;
  };

  // Keyboard shortcut listener for fast POS operation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === 'Escape') {
        if (showPartialModal) setShowPartialModal(false);
        else if (cart.length > 0) setCart([]);
      } else if (e.key === 'F4') {
        e.preventDefault();
        openPartialPayment();
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0 && !loading) handleCheckout(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPartialModal, loading]);

  const searchLower = searchTerm.toLowerCase().trim();

  // Find the selected category (if any)
  const selectedCat = categories.find(c => String(c.id) === String(catFilter));
  const selectedCatName = (selectedCat?.name || '').toLowerCase().trim();

  // Intelligent filter for service rates matching the selected category
  const doesRateMatchCategory = (r) => {
    if (!selectedCatName) return true; // "All Categories"
    const sName = (r.serviceName || '').toLowerCase();

    // Xerox Services: matches B&W Xerox, Document Scanning, Lamination, Spiral Binding
    if (selectedCatName === 'xerox services') {
      return sName.includes('xerox') || sName.includes('scan') || sName.includes('lam') || sName.includes('bind');
    }
    // Color Printing: matches Color Printing rates
    if (selectedCatName === 'color printing') {
      return sName.includes('color');
    }
    // Paper & Printing: matches paper printing and photocopying
    if (selectedCatName.includes('paper') && selectedCatName.includes('print')) {
      return sName.includes('xerox') || sName.includes('print') || sName.includes('color') || sName.includes('scan');
    }
    // Name inclusion match
    if (sName.includes(selectedCatName) || selectedCatName.includes(sName)) {
      return true;
    }
    // If it's a physical product category (Stationery, Desk Accessories, etc.), no service rates match
    return false;
  };

  // Filter service rates
  const filteredRates = serviceRates.filter(r => {
    if (!r.active) return false;

    // Check Category Filter
    if (!doesRateMatchCategory(r)) return false;

    // Check Search Filter
    if (searchLower) {
      const matchName = (r.serviceName || '').toLowerCase().includes(searchLower);
      const matchPaper = (r.paperSize || '').toLowerCase().includes(searchLower);
      const matchSide = (r.sides || '').toLowerCase().includes(searchLower);
      const matchPrice = String(r.pricePerPage || '').includes(searchLower);
      const badge = getServiceBadge(r).toLowerCase();
      const subtitle = getServiceSubtitle(r).toLowerCase();
      const matchBadge = badge.includes(searchLower);
      const matchSubtitle = subtitle.includes(searchLower);
      return matchName || matchPaper || matchSide || matchPrice || matchBadge || matchSubtitle;
    }

    return true;
  });

  const printRates = filteredRates.filter(r => categorizeRate(r) === 'PRINT');
  const finishingRates = filteredRates.filter(r => categorizeRate(r) === 'FINISHING');
  const specialtyRates = filteredRates.filter(r => categorizeRate(r) === 'SPECIALTY');

  // Filter stationery products
  const filteredProducts = products.filter((p) => {
    if (p.status !== 'ACTIVE') return false;

    // Check Search Filter
    if (searchLower) {
      const matchName = (p.name || '').toLowerCase().includes(searchLower);
      const matchSku = (p.sku || '').toLowerCase().includes(searchLower);
      const matchPrice = String(p.sellingPrice || '').includes(searchLower);
      const pCat = (p.categoryName || p.category?.name || '').toLowerCase();
      const matchCat = pCat.includes(searchLower);
      if (!matchName && !matchSku && !matchPrice && !matchCat) return false;
    }

    // Check Category Filter
    if (catFilter) {
      const pCatId = String(p.categoryId || p.category?.id || '');
      const pCatName = (p.categoryName || p.category?.name || '').toLowerCase();
      const isDirectMatch = pCatId === String(catFilter) || (selectedCatName && pCatName === selectedCatName);
      const isDefaultStationery = (!pCatId || pCatId === 'null' || pCatId === 'undefined') && selectedCatName === 'stationery';
      if (!isDirectMatch && !isDefaultStationery) return false;
    }

    return true;
  });

  const totalItemsCount = printRates.length + finishingRates.length + specialtyRates.length + filteredProducts.length;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full lg:h-[calc(100vh-3rem)] flex flex-col print:border-none print:shadow-none print:p-0 print:m-0 print:h-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
        {/* Left Side: Service & Product Catalog (Scrollable) */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto pr-2 space-y-5 print:hidden no-print w-full">
          {/* Header & Search (Sticky at top) */}
          <div className="sticky top-0 bg-white z-10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing (POS)</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scan barcode, SKU or rate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 1. PRINT & XEROX SPEED KEYS (BLUE GROUP) */}
          {printRates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h2 className="text-xs font-black text-slate-800 tracking-wider">PRINT & XEROX SPEED KEYS</h2>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold">
                    BLUE GROUP
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Instant Rate / Page</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {printRates.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => addServiceToCart(rate)}
                    className="bg-white hover:bg-blue-50/20 border border-slate-200/90 hover:border-blue-400 rounded-2xl p-3.5 flex flex-col justify-between text-left transition duration-150 shadow-xs hover:shadow-md cursor-pointer group h-full"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 uppercase tracking-tight transition line-clamp-1">
                          {rate.serviceName}
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {getServiceBadge(rate)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {getServiceSubtitle(rate)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-blue-600">
                        ₹{Math.round(rate.pricePerPage)}
                      </span>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white border border-blue-200 group-hover:border-blue-600 transition shadow-2xs">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>ADD</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. FINISHING & BINDING SPEED KEYS (EMERALD GROUP) */}
          {finishingRates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-black text-slate-800 tracking-wider">FINISHING & BINDING SPEED KEYS</h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                    EMERALD GROUP
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Post-Press Services</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {finishingRates.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => addServiceToCart(rate)}
                    className="bg-white hover:bg-emerald-50/20 border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col justify-between text-left transition duration-150 shadow-xs hover:shadow-md cursor-pointer group h-full"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600 uppercase tracking-tight transition line-clamp-1">
                          {rate.serviceName}
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {getServiceBadge(rate)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {getServiceSubtitle(rate)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-600">
                        ₹{Math.round(rate.pricePerPage)}
                      </span>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white border border-emerald-200 group-hover:border-emerald-600 transition shadow-2xs">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>ADD</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. STATIONERY FAST ITEMS (AMBER GROUP) */}
          {filteredProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-black text-slate-800 tracking-wider">STATIONERY FAST ITEMS</h2>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold">
                    AMBER GROUP
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Retail Inventory Stocked</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(p => {
                  const outOfStock = p.currentStock <= 0;
                  return (
                    <button
                      key={p.id}
                      disabled={outOfStock}
                      onClick={() => addProductToCart(p)}
                      className={`bg-white border rounded-2xl p-3.5 flex flex-col justify-between text-left transition duration-150 shadow-xs h-full ${outOfStock
                          ? 'opacity-50 border-slate-200 bg-slate-50 cursor-default'
                          : 'border-slate-200/90 hover:border-amber-400 hover:shadow-md cursor-pointer group hover:bg-amber-50/20'
                        }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div className="font-extrabold text-xs text-slate-900 group-hover:text-amber-800 uppercase tracking-tight transition line-clamp-1" title={p.name}>
                            {p.name}
                          </div>
                          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${outOfStock
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                            {outOfStock ? '0 in stock' : `${p.currentStock} in stock`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          SKU: {p.sku || 'N/A'}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-amber-800">
                          ₹{Math.round(p.sellingPrice)}
                        </span>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${outOfStock
                            ? 'bg-slate-100 text-slate-400 border border-slate-200'
                            : 'bg-amber-50 group-hover:bg-amber-600 text-amber-800 group-hover:text-white border border-amber-200 group-hover:border-amber-600'
                          }`}>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>ADD</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SPECIALTY & LARGE FORMAT (VIOLET GROUP) */}
          {specialtyRates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <h2 className="text-xs font-black text-slate-800 tracking-wider">SPECIALTY & LARGE FORMAT</h2>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 text-[10px] font-bold">
                    VIOLET GROUP
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Studio Equipment</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {specialtyRates.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => addServiceToCart(rate)}
                    className="bg-white hover:bg-purple-50/20 border border-slate-200/90 hover:border-purple-400 rounded-2xl p-3.5 flex flex-col justify-between text-left transition duration-150 shadow-xs hover:shadow-md cursor-pointer group h-full"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="font-extrabold text-xs text-slate-900 group-hover:text-purple-700 uppercase tracking-tight transition line-clamp-1">
                          {rate.serviceName}
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                          {getServiceBadge(rate)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate">
                        {getServiceSubtitle(rate)}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-purple-700">
                        ₹{Math.round(rate.pricePerPage)}
                      </span>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white border border-purple-200 group-hover:border-purple-600 transition shadow-2xs">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>ADD</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no items match */}
            { totalItemsCount === 0 && (
              <div className="py-16 text-center text-xs text-slate-400 font-medium">
                No services or products found matching your search.
              </div>
            )}

          {/* Bottom POS Quick Info Bar (like Image 3) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-3 font-medium">
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">Esc</kbd> Clear Cart</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">F4</kbd> Partial Pay</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]">F12</kbd> Full Pay</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Touchpad POS Active • Instant 1-Tap Add</span>
            </div>
          </div>
        </div>

        {/* Right Side: Cart Panel */}
        <div className="w-full lg:w-96 rounded-3xl bg-slate-50/70 border border-slate-200/70 p-5 flex flex-col justify-between shadow-sm print:w-full print:p-0 print:border-none print:bg-white print:m-0 print:static">
          {billResult ? (
            <div className="flex flex-col items-center space-y-4 w-full h-full overflow-y-auto">
              <div className="flex items-center gap-2 text-emerald-600 print:hidden no-print">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">Receipt Generated Successfully</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full print:hidden no-print">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setBillResult(null)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Next Customer
                </button>
              </div>

              {/* Detailed Itemized Product Receipt */}
              <ReceiptSlip bill={billResult} />
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              {/* Top Section: Cart Header & Scrollable Items */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-800">Current Cart</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {cart.length}
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Cart Items List - Internally Scrollable */}
                <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center text-xs text-slate-400 font-medium">
                      Cart is empty.<br />Tap any service or product to add.
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between text-xs shadow-xs">
                        <div className="flex-1 pr-2 min-w-0">
                          <div className="font-bold text-slate-800 leading-tight truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">₹{Math.round(Number(item.price || 0))} each</div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Quantity Pill */}
                          <div className="flex items-center bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200/80 px-2.5 py-1 gap-1">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              onBlur={() => handleQtyBlur(idx)}
                              className="w-7 text-center text-xs font-black text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              title="Quantity"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(idx, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                          </div>

                          {/* Price Pill */}
                          <div className="flex items-center bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200/80 px-3 py-1">
                            <span className="text-xs font-black text-indigo-950">₹</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={item.customTotalStr !== undefined ? item.customTotalStr : Math.round((Number(item.price) || 0) * (Number(item.qty) || 0))}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              onBlur={() => handlePriceBlur(idx)}
                              className="w-12 text-center text-xs font-black text-indigo-950 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              title="Total amount"
                            />
                          </div>

                          {/* Rose Trash Icon */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Section: Checkout Calculation */}
              {/* Aligned at bottom opposite to the admin user profile card */}
              <div className="pt-3.5 border-t border-slate-200/80 space-y-3 shrink-0 mt-3">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-bold">₹{Math.round(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="w-20 px-2.5 py-1 text-right rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex justify-between items-center text-sm font-black text-slate-800 pt-2 border-t border-slate-200/80">
                  <span>Grand Total</span>
                  <span className="text-xl text-indigo-700">₹{Math.round(grandTotal)}</span>
                </div>

                {/* Payment Methods */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</div>
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
                          onClick={() => setPaymentMethod(m.id)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${paymentMethod === m.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    disabled={cart.length === 0 || loading}
                    onClick={() => handleCheckout(false)}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 disabled:opacity-50 transition duration-200 active:scale-98 cursor-pointer"
                  >
                    {loading ? 'Processing...' : 'Full Payment'}
                  </button>
                  <button
                    disabled={cart.length === 0 || loading}
                    onClick={openPartialPayment}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-200 disabled:opacity-50 transition duration-200 active:scale-98 cursor-pointer"
                  >
                    Partial Payment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Partial Payment Modal */}
      <Modal isOpen={showPartialModal} onClose={() => setShowPartialModal(false)} maxWidth="max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-300/50 shrink-0">
              <Banknote className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Partial Payment</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Grand Total: <span className="font-bold text-indigo-600">₹{Math.round(grandTotal)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPartialModal(false)}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 relative z-10 pt-1">
          {/* Paid Amount */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Amount Paying Now (₹) *</label>
            <input
              type="number"
              min="1"
              max={Math.round(grandTotal - 1)}
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              placeholder={`Enter amount (max ₹${Math.round(grandTotal - 1)})`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            {paidAmount && Number(paidAmount) > 0 && Number(paidAmount) < grandTotal && (
              <p className="text-xs text-amber-600 font-semibold mt-1.5">
                Balance remaining: ₹{Math.round(grandTotal - Number(paidAmount))}
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Customer Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Customer Phone *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Summary Breakdown */}
          {paidAmount && Number(paidAmount) > 0 && Number(paidAmount) < grandTotal && (
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/60 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Grand Total</span>
                <span>₹{Math.round(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-700">
                <span>Paying Now</span>
                <span>₹{Math.round(Number(paidAmount))}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-amber-700 pt-1.5 border-t border-amber-200">
                <span>Balance Due</span>
                <span>₹{Math.round(grandTotal - Number(paidAmount))}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              disabled={loading || !paidAmount || Number(paidAmount) <= 0 || Number(paidAmount) >= grandTotal || !customerName.trim() || !customerPhone.trim()}
              onClick={() => handleCheckout(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-200 disabled:opacity-50 transition duration-200 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Confirm Partial Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
