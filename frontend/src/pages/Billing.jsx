import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  QrCode
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

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/service-rates').then(r => setServiceRates(r.data)).catch(() => {});
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
        const newQty = c.qty + delta;
        if (c.type === 'PRODUCT' && newQty > c.stock) {
          alert(`Max stock available: ${c.stock}`);
          return c;
        }
        return newQty > 0 ? { ...c, qty: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const items = cart.map(c => ({
        productId: c.type === 'PRODUCT' ? c.itemId : null,
        serviceId: c.type === 'SERVICE' ? c.itemId : null,
        quantity: c.qty,
        unitPrice: c.price
      }));
      const res = await api.post('/billing/create-bill', {
        items,
        discount: Number(discount || 0),
        paymentMethod
      });
      setBillResult(res.data);
      setCart([]);
      setDiscount(0);
      loadCatalog();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Checkout failed');
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((p) => {
    if (p.status !== 'ACTIVE') return false;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchSearch) return false;
    if (catFilter && String(p.categoryId || p.category?.id) !== String(catFilter)) {
      return false;
    }
    return true;
  });
  const activeRates = serviceRates.filter((r) => r.active);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full lg:h-[calc(100vh-3rem)] flex flex-col print:border-none print:shadow-none print:p-0 print:m-0 print:h-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
        {/* Left Side: Service & Product Catalog (Scrollable) */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto pr-2 space-y-6 print:hidden no-print w-full">
          {/* Header & Search (Sticky at top) */}
          <div className="sticky top-0 bg-white z-10 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80 sm:border-none">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Billing (POS)</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Tap items to add to cart → process payment</p>
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
                  placeholder="Search products or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Quick Xerox & Printing Services */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Xerox & Printing Services</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeRates.map(rate => (
                <button
                  key={rate.id}
                  onClick={() => addServiceToCart(rate)}
                  className="p-4 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/70 border border-indigo-100/80 text-left transition duration-200 group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition leading-tight">
                      {rate.serviceName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      {rate.paperSize} • {rate.sides}
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-black text-indigo-700">
                    ₹{Number(rate.pricePerPage).toFixed(2)}
                  </div>
                </button>
              ))}
              {activeRates.length === 0 && (
                <div className="col-span-3 text-xs text-slate-400 py-4 text-center">No service rates configured yet.</div>
              )}
            </div>
          </div>

          {/* Stationery Products Grid */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Stationery Products</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  disabled={p.currentStock <= 0}
                  onClick={() => addProductToCart(p)}
                  className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between cursor-pointer ${
                    p.currentStock <= 0
                      ? 'bg-slate-50 border-slate-200/60 opacity-50 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/80 group'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">
                      SKU: {p.sku}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800">₹{Number(p.sellingPrice).toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.lowStock ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.currentStock} in stock
                    </span>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-3 text-xs text-slate-400 py-8 text-center">No products found.</div>
              )}
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
                        <div className="flex-1 pr-2">
                          <div className="font-bold text-slate-800 leading-tight">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">₹{item.price.toFixed(2)} each</div>
                        </div>

                        {/* Qty Selector */}
                        <div className="flex items-center gap-1.5 mr-3">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-black text-slate-800">{item.qty}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="font-black text-slate-800 text-right w-14">
                          ₹{(item.price * item.qty).toFixed(2)}
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
                  <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
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
                  <span className="text-xl text-indigo-700">₹{grandTotal.toFixed(2)}</span>
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
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            paymentMethod === m.id
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

                <button
                  disabled={cart.length === 0 || loading}
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 active:scale-98 cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Complete & Generate Bill'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
