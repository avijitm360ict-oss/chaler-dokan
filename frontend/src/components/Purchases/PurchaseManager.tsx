import React, { useState } from 'react';
import { PurchaseBill, RiceProduct, Party, Warehouse, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { standardUnits } from '../../data/mockData';
import { Truck, Plus, CheckCircle2, Sparkles, Building2, Package, Warehouse as WarehouseIcon } from 'lucide-react';

interface PurchaseManagerProps {
  purchases: PurchaseBill[];
  products: RiceProduct[];
  parties: Party[];
  warehouses: Warehouse[];
  lang: Language;
  numFormat: NumberFormat;
  onAddPurchase: (bill: PurchaseBill) => void;
}

// Resilient default fallbacks to guarantee zero runtime crashes
const fallbackDefaultProduct: RiceProduct = {
  id: 'prod-fallback-miniket',
  nameBn: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
  nameEn: 'Miniket Rice (50kg)',
  variety: 'Miniket',
  grade: 'Standard',
  category: 'parboiled',
  sku: 'MINI-50KG-01',
  stockKg: 0,
  minStockKg: 500,
  wacPerKgPaisa: 6500,
  retailPricePaisa: 7000,
  wholesalePricePaisa: 6700,
  sack50RetailPricePaisa: 350000,
  sack50WholesalePricePaisa: 335000,
  availableUnits: standardUnits,
};

const fallbackDefaultVendor: Party = {
  id: 'vendor-fallback-01',
  name: 'মেসার্স ভাই ভাই রাইস মিল (মোকাম)',
  phone: '01712000000',
  type: 'vendor',
  shopName: 'নওগাঁ মোকাম',
  address: 'নওগাঁ',
  balancePaisa: 0,
  creditLimitPaisa: 50000000,
};

const fallbackDefaultWarehouse: Warehouse = {
  id: 'wh-01',
  nameBn: 'প্রধান গোডাউন',
  nameEn: 'Main Warehouse',
  location: 'দোকান সংলগ্ন',
  isDefault: true,
  totalStockKg: 0,
};

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  purchases = [],
  products = [],
  parties = [],
  warehouses = [],
  lang,
  numFormat,
  onAddPurchase
}) => {
  const t = translations[lang] || translations.bn;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter existing vendors or fallback
  const existingVendors = parties.filter((p) => p.type === 'vendor' || p.type === 'both');
  const availableVendors = existingVendors.length > 0 ? existingVendors : [fallbackDefaultVendor];
  const availableProducts = products.length > 0 ? products : [fallbackDefaultProduct];
  const availableWarehouses = warehouses.length > 0 ? warehouses : [fallbackDefaultWarehouse];

  // Purchase Form State
  const [vendorId, setVendorId] = useState<string>(availableVendors[0]?.id || '');
  const [isCustomVendor, setIsCustomVendor] = useState<boolean>(false);
  const [customVendorName, setCustomVendorName] = useState<string>('');
  const [customVendorPhone, setCustomVendorPhone] = useState<string>('');

  const [warehouseId, setWarehouseId] = useState<string>(availableWarehouses[0]?.id || '');

  const [productId, setProductId] = useState<string>(availableProducts[0]?.id || '');
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [customProductName, setCustomProductName] = useState<string>('');

  const [vendorBillNo, setVendorBillNo] = useState<string>('');
  const [unitSacks, setUnitSacks] = useState<number>(60); // 60 sacks = 3000 kg
  const [rawPricePerKgTaka, setRawPricePerKgTaka] = useState<number>(63.50);
  const [truckFareTaka, setTruckFareTaka] = useState<number>(5250); // Total truck freight
  const [labourFareTaka, setLabourFareTaka] = useState<number>(2250); // Total unloading labour
  const [paidTaka, setPaidTaka] = useState<number>(100000); // Amount paid to mill
  const [validationError, setValidationError] = useState<string | null>(null);

  // Crash-safe selection resolution
  const selectedProduct = isCustomProduct
    ? null
    : (availableProducts.find((p) => p.id === productId) || availableProducts[0]);

  const selectedVendor = isCustomVendor
    ? null
    : (availableVendors.find((v) => v.id === vendorId) || availableVendors[0]);

  // Calculations
  const safeSacks = Math.max(0, Number(unitSacks) || 0);
  const safeRawPrice = Math.max(0, Number(rawPricePerKgTaka) || 0);
  const safeTruckFare = Math.max(0, Number(truckFareTaka) || 0);
  const safeLabourFare = Math.max(0, Number(labourFareTaka) || 0);
  const safePaidTaka = Math.max(0, Number(paidTaka) || 0);

  const totalKg = safeSacks * 50;
  const rawSubtotalTaka = totalKg * safeRawPrice;
  const totalExtraCostTaka = safeTruckFare + safeLabourFare;
  const grandTotalTaka = rawSubtotalTaka + totalExtraCostTaka;

  // Landed Cost calculations (Per Kg)
  const truckPerKgTaka = totalKg > 0 ? safeTruckFare / totalKg : 0;
  const labourPerKgTaka = totalKg > 0 ? safeLabourFare / totalKg : 0;
  const landedCostPerKgTaka = safeRawPrice + truckPerKgTaka + labourPerKgTaka;
  const dueTaka = Math.max(0, grandTotalTaka - safePaidTaka);

  // Weighted Average Cost (WAC) forecast (Crash-Safe)
  const oldStockKg = selectedProduct?.stockKg || 0;
  const oldWacTaka = (selectedProduct?.wacPerKgPaisa || 0) / 100;
  const newForecastWacTaka = (oldStockKg + totalKg) > 0
    ? ((oldStockKg * oldWacTaka) + (totalKg * landedCostPerKgTaka)) / (oldStockKg + totalKg)
    : landedCostPerKgTaka;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const finalVendorName = isCustomVendor
      ? customVendorName.trim()
      : (selectedVendor?.name || 'মিলার / মোকাম');

    const finalVendorPhone = isCustomVendor
      ? customVendorPhone.trim()
      : (selectedVendor?.phone || '01700000000');

    if (!finalVendorName) {
      setValidationError('সরবরাহকারী বা মিলের নাম অবশ্যই প্রদান করতে হবে!');
      return;
    }

    if (safeSacks <= 0) {
      setValidationError('বস্তার সংখ্যা কমপক্ষে ১ হতে হবে!');
      return;
    }

    if (safeRawPrice <= 0) {
      setValidationError('মিলের প্রতি কেজির দর ০ এর বেশি হতে হবে!');
      return;
    }

    // Determine product object
    let finalProduct: RiceProduct;
    if (isCustomProduct && customProductName.trim()) {
      finalProduct = {
        id: `prod-${Date.now()}`,
        nameBn: customProductName.trim(),
        nameEn: customProductName.trim(),
        variety: 'চাল',
        grade: 'Standard',
        category: 'parboiled',
        sku: `RICE-${Date.now().toString().slice(-4)}`,
        stockKg: 0,
        minStockKg: 200,
        wacPerKgPaisa: Math.round(landedCostPerKgTaka * 100),
        retailPricePaisa: Math.round((landedCostPerKgTaka + 4) * 100),
        wholesalePricePaisa: Math.round((landedCostPerKgTaka + 2) * 100),
        sack50RetailPricePaisa: Math.round((landedCostPerKgTaka + 4) * 50 * 100),
        sack50WholesalePricePaisa: Math.round((landedCostPerKgTaka + 2) * 50 * 100),
        availableUnits: standardUnits,
      };
    } else {
      finalProduct = selectedProduct || fallbackDefaultProduct;
    }

    const newBill: PurchaseBill = {
      id: `pur-${Date.now()}`,
      docNo: `PUR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString(),
      vendorName: finalVendorName,
      vendorPhone: finalVendorPhone,
      warehouseId: warehouseId || availableWarehouses[0]?.id || 'wh-01',
      vendorBillNo: vendorBillNo.trim() || `MILL-${Math.floor(100 + Math.random() * 900)}`,
      items: [
        {
          product: finalProduct,
          unit: standardUnits[1] || { id: 'u-sack-50', nameBn: '৫০ কেজি বস্তা', nameEn: '50kg bag', kgPerUnit: 50, isBase: false },
          unitQuantity: safeSacks,
          totalKg,
          rawPricePerKgPaisa: Math.round(safeRawPrice * 100),
          truckFareAllocatedPaisa: Math.round(truckPerKgTaka * 100),
          labourFareAllocatedPaisa: Math.round(labourPerKgTaka * 100),
          landedCostPerKgPaisa: Math.round(landedCostPerKgTaka * 100),
          lineTotalPaisa: Math.round(grandTotalTaka * 100),
        }
      ],
      subtotalPaisa: Math.round(rawSubtotalTaka * 100),
      truckFarePaisa: Math.round(safeTruckFare * 100),
      labourFarePaisa: Math.round(safeLabourFare * 100),
      otherExpensesPaisa: 0,
      grandTotalPaisa: Math.round(grandTotalTaka * 100),
      paidAmountPaisa: Math.round(safePaidTaka * 100),
      dueAmountPaisa: Math.round(dueTaka * 100),
      status: 'confirmed'
    };

    onAddPurchase(newBill);
    setIsModalOpen(false);

    // Reset temporary states
    setCustomVendorName('');
    setCustomVendorPhone('');
    setIsCustomVendor(false);
    setCustomProductName('');
    setIsCustomProduct(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'ক্রয় ও চাল আনয়ন (Landed Cost ইনভয়েস)' : 'Rice Purchases & Landed Cost'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'মিলের চালের দামের সাথে ট্রাক ভাড়া ও লেবার খরচ যোগ করে প্রকৃত কেনা-দর (WAC) নির্ধারণ' 
              : 'Calculate true landed purchase cost factoring in truck freight and unloading costs.'}
          </p>
        </div>

        <button
          onClick={() => {
            setValidationError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ নতুন চাল ক্রয় চালান এন্ট্রি' : '+ New Purchase Bill'}</span>
        </button>
      </div>

      {/* Purchase Bills Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">{lang === 'bn' ? 'চালান / ইনভয়েস' : 'Doc No'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'মিল / আড়তদার' : 'Vendor'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'চালের আইটেম ও ওজন' : 'Rice & Weight'}</th>
                <th className="py-3 px-3 bg-emerald-50/50">{lang === 'bn' ? 'প্রকৃত কেনা-দর (কেজি)' : 'Landed Cost/Kg'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'সর্বমোট বিল' : 'Grand Total'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'পরিশোধ ও বাকি' : 'Paid & Due'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl">
                        🚛
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        কোনো ক্রয় চালান বা ইনভয়েস পাওয়া যায়নি
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        সাপ্লায়ার বা মিল থেকে নতুন চাল কেনার ইনভয়েস, গাড়িভাড়া ও লেবার খরচ এন্ট্রি করতে নিচের বাটনে চাপ দিন।
                      </p>
                      <button
                        onClick={() => {
                          setValidationError(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        নতুন চাল ক্রয় চালান এন্ট্রি
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {bill.docNo}
                      {bill.vendorBillNo && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          মিল মেমো: {bill.vendorBillNo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatDateBangla(bill.date)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {bill.vendorName}
                      {bill.vendorPhone && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {bill.vendorPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {(bill.items || []).map((item, idx) => (
                        <div key={idx}>
                          <span className="font-bold text-slate-900">
                            {item.product?.nameBn || item.product?.nameEn || 'চাল'}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {numFormat === 'bn' ? toBengaliDigits(item.unitQuantity) : item.unitQuantity} বস্তা ({numFormat === 'bn' ? toBengaliDigits(item.totalKg) : item.totalKg} কেজি)
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 bg-emerald-50/50 font-extrabold text-emerald-800 text-sm">
                      {formatCurrency(bill.items?.[0]?.landedCostPerKgPaisa || 0, numFormat)}/কেজি
                      <div className="text-[10px] font-normal text-slate-500">
                        (মূল: {formatCurrency(bill.items?.[0]?.rawPricePerKgPaisa || 0, numFormat)} + ভাড়া)
                      </div>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatCurrency(bill.grandTotalPaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-emerald-700 font-bold">
                        জমা: {formatCurrency(bill.paidAmountPaisa, numFormat)}
                      </div>
                      {bill.dueAmountPaisa > 0 && (
                        <div className="text-amber-700 font-bold text-[11px]">
                          বাকি: {formatCurrency(bill.dueAmountPaisa, numFormat)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE MODAL WITH LANDED COST ENGINE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {lang === 'bn' ? 'নতুন চাল ক্রয় ও প্রকৃত কেনা-দর নির্ধারণ' : 'Record Inbound Rice Purchase'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {lang === 'bn' ? 'গাড়িভাড়া ও লেবার খরচ বন্টন করে সঠিক গড় ক্রয়মূল্য নির্ণয়' : 'Freight & labour cost allocation engine'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl animate-in fade-in">
                ⚠️ {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Vendor & Warehouse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>সরবরাহকারী / মিল / আড়তদার</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomVendor(!isCustomVendor)}
                      className="text-[11px] text-emerald-700 hover:underline font-bold"
                    >
                      {isCustomVendor ? 'তালিকা থেকে বাছুন' : '+ নতুন মিল লিখুন'}
                    </button>
                  </div>

                  {isCustomVendor ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="মিলের নাম (যেমন: একতা রাইস মিল)"
                        value={customVendorName}
                        onChange={(e) => setCustomVendorName(e.target.value)}
                        className="w-full p-2 rounded-xl border border-emerald-400 font-bold bg-white text-slate-900"
                        required
                      />
                      <input
                        type="text"
                        placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                        value={customVendorPhone}
                        onChange={(e) => setCustomVendorPhone(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 font-medium bg-white text-slate-900"
                      />
                    </div>
                  ) : (
                    <select
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900"
                    >
                      {availableVendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} ({v.shopName || 'মিল'})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <WarehouseIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>কোন গোডাউনে মাল ঢুকবে</span>
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900"
                  >
                    {availableWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.nameBn || w.nameEn || 'প্রধান গোডাউন'}</option>
                    ))}
                  </select>

                  <div className="mt-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      মিল মেমো / চালান নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: MILL-4820"
                      value={vendorBillNo}
                      onChange={(e) => setVendorBillNo(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-medium bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Product & Quantity Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span>চালের জাত</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomProduct(!isCustomProduct)}
                        className="text-[11px] text-emerald-700 hover:underline font-bold"
                      >
                        {isCustomProduct ? 'তালিকা থেকে' : '+ নতুন চাল'}
                      </button>
                    </div>

                    {isCustomProduct ? (
                      <input
                        type="text"
                        placeholder="যেমন: কাটারিভোগ চাল (৫০ কেজি)"
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        className="w-full p-2 rounded-xl border border-emerald-400 font-bold bg-white text-slate-900"
                        required
                      />
                    ) : (
                      <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-emerald-900 bg-white"
                      >
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>{p.nameBn}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">৫০ কেজির বস্তা সংখ্যা</label>
                    <input
                      type="number"
                      min="1"
                      value={unitSacks}
                      onChange={(e) => setUnitSacks(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block font-semibold">
                      মোট ওজন: {numFormat === 'bn' ? toBengaliDigits(totalKg) : totalKg} কেজি ({numFormat === 'bn' ? toBengaliDigits((totalKg / 40).toFixed(1)) : (totalKg / 40).toFixed(1)} মণ)
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মিলের মূল রেট (প্রতি কেজি ৳)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={rawPricePerKgTaka}
                      onChange={(e) => setRawPricePerKgTaka(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      বস্তাপ্রতি মিল রেট: ৳{toBengaliDigits(Math.round(safeRawPrice * 50))}
                    </span>
                  </div>
                </div>

                {/* Additional Expenses: Truck & Labour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মোট ট্রাক ভাড়া (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={truckFareTaka}
                      onChange={(e) => setTruckFareTaka(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                      প্রতি কেজিতে ট্রাকভাড়া যোগ হবে: +{formatCurrency(Math.round(truckPerKgTaka * 100), numFormat)}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মোট লেবার ও খালাস খরচ (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={labourFareTaka}
                      onChange={(e) => setLabourFareTaka(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-900"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                      প্রতি কেজিতে লেবার খরচ যোগ হবে: +{formatCurrency(Math.round(labourPerKgTaka * 100), numFormat)}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE LANDED COST CARD */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>প্রকৃত কেনা-দর (গাড়িভাড়া ও লেবার সহ)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">প্রতি কেজির আসল ক্রয়মূল্য:</span>
                    <div className="text-lg font-extrabold text-emerald-800">
                      {formatCurrency(Math.round(landedCostPerKgTaka * 100), numFormat)}/কেজি
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-emerald-700 border-t border-emerald-200/60 pt-1.5 font-medium">
                  <span>পূর্বের গড় কেনা দর: {formatCurrency(selectedProduct?.wacPerKgPaisa || 0, numFormat)}</span>
                  <span className="font-bold">নতুন প্রত্যাশিত WAC: {formatCurrency(Math.round(newForecastWacTaka * 100), numFormat)}</span>
                </div>
              </div>

              {/* Payment to Vendor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সর্বমোট প্রদেয় বিল</label>
                  <div className="text-base font-extrabold text-slate-900 p-2.5 bg-slate-100 rounded-xl">
                    {formatCurrency(Math.round(grandTotalTaka * 100), numFormat)}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মিলকে নগদ/ব্যাংকে পরিশোধ (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={paidTaka}
                    onChange={(e) => setPaidTaka(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2 rounded-xl border border-slate-300 font-extrabold text-emerald-700 bg-white"
                  />
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    মিলের বাকি পাওনা: {formatCurrency(Math.round(dueTaka * 100), numFormat)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ক্রয় চালান নিশ্চিত করুন</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
