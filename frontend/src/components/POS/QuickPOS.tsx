import React, { useState, useMemo } from 'react';
import {
  RiceProduct,
  CartItem,
  ProductUnitConfig,
  Party,
  SaleInvoice,
  PaymentSplit,
  Language,
  NumberFormat,
  Warehouse
} from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, toBengaliDigits } from '../../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface QuickPOSProps {
  products: RiceProduct[];
  parties: Party[];
  warehouses: Warehouse[];
  lang: Language;
  numFormat: NumberFormat;
  onCompleteSale: (invoice: SaleInvoice) => void;
  onOpenReceipt: (invoice: SaleInvoice) => void;
}

export const QuickPOS: React.FC<QuickPOSProps> = ({
  products,
  parties,
  warehouses,
  lang,
  numFormat,
  onCompleteSale,
  onOpenReceipt
}) => {
  const t = translations[lang];

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [selectedClientId, setSelectedClientId] = useState<string>('walkin');
  
  // Cart & Hold state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; name: string; items: CartItem[]; time: string }[]>([]);
  
  // Checkout & Payment modal state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [discountTaka, setDiscountTaka] = useState<number>(0);
  const [deliveryChargeTaka, setDeliveryChargeTaka] = useState<number>(0);
  const [paidCashTaka, setPaidCashTaka] = useState<number>(0);
  const [paidBkashTaka, setPaidBkashTaka] = useState<number>(0);
  const [paidNagadTaka, setPaidNagadTaka] = useState<number>(0);
  const [paidBankTaka, setPaidBankTaka] = useState<number>(0);

  // Filtered Products
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const selectedClient = useMemo(() => {
    if (selectedClientId === 'walkin') return null;
    return parties.find((p) => p.id === selectedClientId) || null;
  }, [parties, selectedClientId]);

  // Add product to cart
  const addToCart = (product: RiceProduct, defaultUnitId?: string, qty: number = 1) => {
    const unit = product.availableUnits.find((u) => u.id === (defaultUnitId || 'u-sack-50')) || product.availableUnits[0];
    
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedUnit.id === unit.id
      );

      // Determine price per unit based on wholesale/retail and unit type
      let unitPricePaisa = 0;
      if (unit.id === 'u-sack-50') {
        unitPricePaisa = priceType === 'wholesale' ? product.sack50WholesalePricePaisa : product.sack50RetailPricePaisa;
      } else {
        const perKgRate = priceType === 'wholesale' ? product.wholesalePricePaisa : product.retailPricePaisa;
        unitPricePaisa = Math.round(perKgRate * unit.kgPerUnit);
      }

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].unitQuantity + qty;
        const newTotalKg = newQty * unit.kgPerUnit;
        const newLineTotal = newQty * unitPricePaisa;

        updated[existingIndex] = {
          ...updated[existingIndex],
          unitQuantity: newQty,
          totalKg: newTotalKg,
          lineTotalPaisa: newLineTotal,
          costSnapshotPaisa: Math.round(product.wacPerKgPaisa * newTotalKg)
        };
        return updated;
      } else {
        const totalKg = qty * unit.kgPerUnit;
        const lineTotal = qty * unitPricePaisa;
        return [
          ...prev,
          {
            product,
            selectedUnit: unit,
            unitQuantity: qty,
            totalKg,
            unitPricePaisa,
            discountPaisa: 0,
            lineTotalPaisa: lineTotal,
            costSnapshotPaisa: Math.round(product.wacPerKgPaisa * totalKg)
          }
        ];
      }
    });
  };

  // Quick Add Kg directly to loose item
  const addQuickKg = (product: RiceProduct, kgAmount: number) => {
    const kgUnit = product.availableUnits.find((u) => u.id === 'u-kg') || {
      id: 'u-kg',
      nameBn: 'কেজি',
      nameEn: 'Kg',
      kgPerUnit: 1,
      isBase: true
    };
    addToCart(product, kgUnit.id, kgAmount);
  };

  // Modify Cart Item quantity
  const updateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const totalKg = newQty * item.selectedUnit.kgPerUnit;
      const lineTotal = newQty * item.unitPricePaisa;

      updated[index] = {
        ...item,
        unitQuantity: newQty,
        totalKg,
        lineTotalPaisa: lineTotal,
        costSnapshotPaisa: Math.round(item.product.wacPerKgPaisa * totalKg)
      };
      return updated;
    });
  };

  // Change Unit of cart item (e.g. from 50kg bag to Kg)
  const changeItemUnit = (index: number, unitId: string) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newUnit = item.product.availableUnits.find((u) => u.id === unitId) || item.selectedUnit;

      let unitPricePaisa = 0;
      if (newUnit.id === 'u-sack-50') {
        unitPricePaisa = priceType === 'wholesale' ? item.product.sack50WholesalePricePaisa : item.product.sack50RetailPricePaisa;
      } else {
        const perKgRate = priceType === 'wholesale' ? item.product.wholesalePricePaisa : item.product.retailPricePaisa;
        unitPricePaisa = Math.round(perKgRate * newUnit.kgPerUnit);
      }

      const totalKg = item.unitQuantity * newUnit.kgPerUnit;
      const lineTotal = item.unitQuantity * unitPricePaisa;

      updated[index] = {
        ...item,
        selectedUnit: newUnit,
        unitPricePaisa,
        totalKg,
        lineTotalPaisa: lineTotal,
        costSnapshotPaisa: Math.round(item.product.wacPerKgPaisa * totalKg)
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart Totals
  const subtotalPaisa = useMemo(() => cart.reduce((sum, item) => sum + item.lineTotalPaisa, 0), [cart]);
  const totalKg = useMemo(() => cart.reduce((sum, item) => sum + item.totalKg, 0), [cart]);
  const totalCostPaisa = useMemo(() => cart.reduce((sum, item) => sum + item.costSnapshotPaisa, 0), [cart]);

  const discountPaisa = Math.round(discountTaka * 100);
  const deliveryChargePaisa = Math.round(deliveryChargeTaka * 100);
  const grandTotalPaisa = Math.max(0, subtotalPaisa - discountPaisa + deliveryChargePaisa);

  // Estimated profit calculation (Section 5.7)
  const estimatedProfitPaisa = Math.max(0, grandTotalPaisa - totalCostPaisa);

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const clientName = selectedClient ? selectedClient.name : 'কাউন্টার কাস্টমার';
    const newHold = {
      id: `hold-${Date.now()}`,
      name: `${clientName} (${cart.length} আইটেম)`,
      items: [...cart],
      time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };
    setHeldCarts((prev) => [...prev, newHold]);
    setCart([]);
  };

  // Resume held cart
  const handleResumeCart = (holdId: string) => {
    const hold = heldCarts.find((h) => h.id === holdId);
    if (!hold) return;
    setCart(hold.items);
    setHeldCarts((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Trigger Checkout Modal
  const openCheckout = () => {
    if (cart.length === 0) return;
    // Pre-fill cash payment with grand total for quick 1-click checkout
    setPaidCashTaka(grandTotalPaisa / 100);
    setPaidBkashTaka(0);
    setPaidNagadTaka(0);
    setPaidBankTaka(0);
    setIsCheckoutModalOpen(true);
  };

  // Complete Sale
  const handleFinalizeSale = () => {
    const paidCashPaisa = Math.round(paidCashTaka * 100);
    const paidBkashPaisa = Math.round(paidBkashTaka * 100);
    const paidNagadPaisa = Math.round(paidNagadTaka * 100);
    const paidBankPaisa = Math.round(paidBankTaka * 100);

    const paidTotalPaisa = paidCashPaisa + paidBkashPaisa + paidNagadPaisa + paidBankPaisa;
    const dueAmountPaisa = Math.max(0, grandTotalPaisa - paidTotalPaisa);

    if (dueAmountPaisa > 0 && selectedClientId === 'walkin') {
      alert(lang === 'bn' 
        ? 'সতর্কতা: ওয়াক-ইন কাউন্টার কাস্টমারকে বাকি দেওয়া যাবে না। অনুগ্রহ করে কাস্টমার সিলেক্ট করুন অথবা পুরো টাকা পরিশোধ করুন।' 
        : 'Warning: Cannot give credit to walk-in customer. Please select a registered party or pay full amount.');
      return;
    }

    const payments: PaymentSplit[] = [];
    if (paidCashPaisa > 0) payments.push({ method: 'cash', amountPaisa: paidCashPaisa, accountName: 'প্রধান ক্যাশ ড্রয়ার' });
    if (paidBkashPaisa > 0) payments.push({ method: 'bkash', amountPaisa: paidBkashPaisa, accountName: 'বিকাশ মার্চেন্ট' });
    if (paidNagadPaisa > 0) payments.push({ method: 'nagad', amountPaisa: paidNagadPaisa, accountName: 'নগদ উদ্যোক্তা' });
    if (paidBankPaisa > 0) payments.push({ method: 'bank', amountPaisa: paidBankPaisa, accountName: 'ব্যাংক একাউন্ট' });

    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      docNo: `INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString(),
      clientName: selectedClient ? selectedClient.name : 'কাউন্টার কাস্টমার (নগদ)',
      clientPhone: selectedClient ? selectedClient.phone : '01700-000000',
      clientType: selectedClient ? (selectedClient.clientType || 'wholesale') : 'walkin',
      warehouseId: selectedWarehouseId,
      items: [...cart],
      subtotalPaisa,
      discountPaisa,
      deliveryChargePaisa,
      grandTotalPaisa,
      paidTotalPaisa,
      dueAmountPaisa,
      payments,
      status: 'confirmed',
      totalKg,
      totalCostSnapshotPaisa: totalCostPaisa,
      estimatedProfitPaisa,
      createdBy: 'হাজী মো: রফিকুল ইসলাম'
    };

    onCompleteSale(newInvoice);
    setIsCheckoutModalOpen(false);
    clearCart();
    setDiscountTaka(0);
    setDeliveryChargeTaka(0);
    onOpenReceipt(newInvoice);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5.5rem)] pb-16 md:pb-2">
      
      {/* LEFT: Rice Catalog & Quick Select (60% width) */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Top Controls: Search, Price Type, Category */}
        <div className="p-3.5 border-b border-slate-200/90 space-y-3 bg-slate-50/50">
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchRice}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Wholesale vs Retail Price Toggle */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPriceType('retail')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  priceType === 'retail'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.retailRate}
              </button>
              <button
                onClick={() => setPriceType('wholesale')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  priceType === 'wholesale'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.wholesaleRate}
              </button>
            </div>

            {/* Godown / Warehouse selector */}
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {lang === 'bn' ? w.nameBn : w.nameEn}
                </option>
              ))}
            </select>

          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.allCategories}
            </button>
            {categories.filter((c) => c !== 'all').map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat} চাল
              </button>
            ))}
          </div>

        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const isLowStock = product.stockKg <= product.minStockKg;
            const currentPerKgRate = priceType === 'wholesale' ? product.wholesalePricePaisa : product.retailPricePaisa;
            const sackRate = priceType === 'wholesale' ? product.sack50WholesalePricePaisa : product.sack50RetailPricePaisa;

            return (
              <div
                key={product.id}
                className="group relative bg-white border border-slate-200 hover:border-emerald-500/80 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Badge & Stock */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {product.variety} • {product.grade}
                    </span>
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isLowStock ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-500'
                    }`}>
                      {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      {formatWeight(product.stockKg, numFormat, lang)}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                    {lang === 'bn' ? product.nameBn : product.nameEn}
                  </h4>

                  {/* Rates */}
                  <div className="mt-2 flex items-baseline justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t.ratePerKg}</span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {formatCurrency(currentPerKgRate, numFormat)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{t.unitSack50}</span>
                      <span className="text-xs font-bold text-slate-700">
                        {formatCurrency(sackRate, numFormat)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons (+1 বস্তা, +১ কেজি, +৫ কেজি, +১০ কেজি) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                  
                  {/* Primary Add: 1 Sack (50kg) */}
                  <button
                    onClick={() => addToCart(product, 'u-sack-50', 1)}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+১ বস্তা ({formatCurrency(sackRate, numFormat)})</span>
                  </button>

                  {/* Quick Kg Loose Chips */}
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <button
                      onClick={() => addQuickKg(product, 1)}
                      className="py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-bold text-slate-700 transition"
                    >
                      +১ কেজি
                    </button>
                    <button
                      onClick={() => addQuickKg(product, 5)}
                      className="py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-bold text-slate-700 transition"
                    >
                      +৫ কেজি
                    </button>
                    <button
                      onClick={() => addQuickKg(product, 10)}
                      className="py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-bold text-slate-700 transition"
                    >
                      +১০ কেজি
                    </button>
                    <button
                      onClick={() => addQuickKg(product, 25)}
                      className="py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-bold text-slate-700 transition"
                    >
                      +২৫ কেজি
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* RIGHT: Cart, Customer & Checkout (40% width) */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
        
        {/* Customer Selector & Hold Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              {t.selectClient}
            </span>

            {/* Held Cart Buttons */}
            {heldCarts.length > 0 && (
              <div className="flex items-center gap-1">
                {heldCarts.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleResumeCart(h.id)}
                    className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                  >
                    <PlayCircle className="w-3 h-3 text-amber-600" />
                    {h.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="walkin">🛒 {t.walkInCustomer}</option>
            {parties.filter((p) => p.type === 'client' || p.type === 'both').map((party) => (
              <option key={party.id} value={party.id}>
                {party.name} {party.shopName ? `(${party.shopName})` : ''} — বাকি: {formatCurrency(party.balancePaisa, numFormat)}
              </option>
            ))}
          </select>

          {/* Client Balance Badge if registered client selected */}
          {selectedClient && (
            <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">পূর্বের বকেয়া বাকি:</span>
                <span className="font-extrabold text-amber-800">
                  {formatCurrency(selectedClient.balancePaisa, numFormat)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">ক্রেডিট লিমিট:</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(selectedClient.creditLimitPaisa, numFormat)}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <span className="text-4xl mb-2">🌾</span>
              <p className="font-bold text-slate-600 text-sm">{lang === 'bn' ? 'কার্ট খালি আছে' : 'Cart is Empty'}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {lang === 'bn' ? 'বাম পাশ থেকে চালে ক্লিক করে বস্তা বা কেজি যোগ করুন' : 'Click any rice on the left to add to bill'}
              </p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.product.id}-${item.selectedUnit.id}-${index}`} className="pt-2 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-slate-900 leading-snug">
                      {lang === 'bn' ? item.product.nameBn : item.product.nameEn}
                    </h5>

                    {/* Unit Selector & Price per unit */}
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={item.selectedUnit.id}
                        onChange={(e) => changeItemUnit(index, e.target.value)}
                        className="text-[11px] font-semibold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                      >
                        {item.product.availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {lang === 'bn' ? u.nameBn : u.nameEn}
                          </option>
                        ))}
                      </select>

                      <span className="text-[11px] text-slate-500">
                        @{formatCurrency(item.unitPricePaisa, numFormat)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateItemQuantity(index, item.unitQuantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-extrabold text-slate-900">
                      {numFormat === 'bn' ? toBengaliDigits(item.unitQuantity) : item.unitQuantity}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(index, item.unitQuantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="text-right flex flex-col items-end">
                    <span className="font-extrabold text-xs text-emerald-800">
                      {formatCurrency(item.lineTotalPaisa, numFormat)}
                    </span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-slate-300 hover:text-red-500 mt-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtext: Total KG for this line */}
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>মোট ওজন: {formatWeight(item.totalKg, numFormat, lang)}</span>
                  <span>আসল খরচ: {formatCurrency(item.costSnapshotPaisa, numFormat)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Footer */}
        {cart.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
            
            {/* Quick calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{t.totalKg}:</span>
                <span className="font-bold text-slate-800">{formatWeight(totalKg, numFormat, lang)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t.subtotal}:</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotalPaisa, numFormat)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  {t.estimatedProfit}:
                </span>
                <span className="font-extrabold">{formatCurrency(estimatedProfitPaisa, numFormat)}</span>
              </div>
            </div>

            {/* Grand Total Highlight */}
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-emerald-100 uppercase tracking-wider block font-bold">
                  {t.grandTotal}
                </span>
                <span className="text-xl font-extrabold">
                  {formatCurrency(grandTotalPaisa, numFormat)}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-100">
                <span>{cart.length} টি চাল</span>
              </div>
            </div>

            {/* Action Buttons: Hold, Clear, Checkout */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleHoldCart}
                title={t.holdCart}
                className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
              >
                <PauseCircle className="w-5 h-5" />
              </button>

              <button
                onClick={clearCart}
                title={t.clearCart}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={openCheckout}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <span>{t.completeSale}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* FULL PAYMENT & CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ৳
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {lang === 'bn' ? 'পেমেন্ট ও ইনভয়েস কনফার্ম' : 'Payment & Checkout'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {selectedClient ? selectedClient.name : 'কাউন্টার ক্যাশ কাস্টমার'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Discount & Delivery Charge */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-600 font-semibold mb-1 block">{t.discount} (টাকা)</label>
                <input
                  type="number"
                  value={discountTaka || ''}
                  onChange={(e) => setDiscountTaka(Number(e.target.value))}
                  placeholder="০.০০"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold mb-1 block">{t.deliveryCharge} (টাকা)</label>
                <input
                  type="number"
                  value={deliveryChargeTaka || ''}
                  onChange={(e) => setDeliveryChargeTaka(Number(e.target.value))}
                  placeholder="০.০০"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Net Amount to Pay */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-semibold">পরিশোধযোগ্য সর্বমোট বিল</span>
                <div className="text-2xl font-extrabold text-emerald-950">
                  {formatCurrency(grandTotalPaisa, numFormat)}
                </div>
              </div>
              <div className="text-right text-xs text-emerald-700">
                <div>ওজন: {formatWeight(totalKg, numFormat, lang)}</div>
                <div>আইটেম: {cart.length} টি</div>
              </div>
            </div>

            {/* Split Payment Methods inputs */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">টাকা গ্রহণ পদ্ধতি (স্প্লিট পেমেন্ট):</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                
                {/* Cash */}
                <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.cashPayment}</span>
                  </div>
                  <input
                    type="number"
                    value={paidCashTaka || ''}
                    onChange={(e) => setPaidCashTaka(Number(e.target.value))}
                    placeholder="০"
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-extrabold text-slate-900"
                  />
                </div>

                {/* bKash */}
                <div className="p-2 border border-pink-200 rounded-xl bg-pink-50/50">
                  <div className="flex items-center gap-1.5 text-pink-700 font-bold mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                    <span>{t.bkashPayment}</span>
                  </div>
                  <input
                    type="number"
                    value={paidBkashTaka || ''}
                    onChange={(e) => setPaidBkashTaka(Number(e.target.value))}
                    placeholder="০"
                    className="w-full p-1.5 bg-white border border-pink-300 rounded-lg font-extrabold text-pink-900"
                  />
                </div>

                {/* Nagad */}
                <div className="p-2 border border-orange-200 rounded-xl bg-orange-50/50">
                  <div className="flex items-center gap-1.5 text-orange-700 font-bold mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                    <span>{t.nagadPayment}</span>
                  </div>
                  <input
                    type="number"
                    value={paidNagadTaka || ''}
                    onChange={(e) => setPaidNagadTaka(Number(e.target.value))}
                    placeholder="০"
                    className="w-full p-1.5 bg-white border border-orange-300 rounded-lg font-extrabold text-orange-900"
                  />
                </div>

                {/* Bank */}
                <div className="p-2 border border-blue-200 rounded-xl bg-blue-50/50">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.bankPayment}</span>
                  </div>
                  <input
                    type="number"
                    value={paidBankTaka || ''}
                    onChange={(e) => setPaidBankTaka(Number(e.target.value))}
                    placeholder="০"
                    className="w-full p-1.5 bg-white border border-blue-300 rounded-lg font-extrabold text-blue-900"
                  />
                </div>

              </div>
            </div>

            {/* Calculated Due or Change */}
            {(() => {
              const totalPaidPaisa = Math.round((paidCashTaka + paidBkashTaka + paidNagadTaka + paidBankTaka) * 100);
              const duePaisa = grandTotalPaisa - totalPaidPaisa;

              return (
                <div className={`p-2.5 rounded-xl text-xs font-bold flex justify-between ${
                  duePaisa > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  <span>{duePaisa > 0 ? `${t.dueAmount}:` : 'সম্পূর্ণ পরিশোধ:'}</span>
                  <span>{formatCurrency(Math.abs(duePaisa), numFormat)}</span>
                </div>
              );
            })()}

            {/* Submit */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleFinalizeSale}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'bn' ? 'বিক্রি কনফার্ম ও প্রিন্ট' : 'Confirm Sale & Print'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
