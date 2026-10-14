import React, { useState } from 'react';
import { PurchaseBill, RiceProduct, Party, Warehouse, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla } from '../../utils/formatters';
import { standardUnits } from '../../data/mockData';
import { Truck, Plus, CheckCircle2, FileText, ArrowDownRight, Sparkles, Building2, Package } from 'lucide-react';

interface PurchaseManagerProps {
  purchases: PurchaseBill[];
  products: RiceProduct[];
  parties: Party[];
  warehouses: Warehouse[];
  lang: Language;
  numFormat: NumberFormat;
  onAddPurchase: (bill: PurchaseBill) => void;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  purchases,
  products,
  parties,
  warehouses,
  lang,
  numFormat,
  onAddPurchase
}) => {
  const t = translations[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Purchase Form state
  const vendors = parties.filter((p) => p.type === 'vendor' || p.type === 'both');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [unitSacks, setUnitSacks] = useState<number>(60); // 60 sacks = 3000 kg
  const [rawPricePerKgTaka, setRawPricePerKgTaka] = useState<number>(63.50);
  const [truckFareTaka, setTruckFareTaka] = useState<number>(5250); // Total truck fare
  const [labourFareTaka, setLabourFareTaka] = useState<number>(2250); // Total labour fare
  const [paidTaka, setPaidTaka] = useState<number>(100000); // 1,00,000 paid

  // Calculations
  const selectedProduct = products.find((p) => p.id === productId) || products[0];
  const selectedVendor = vendors.find((v) => v.id === vendorId) || vendors[0];
  const totalKg = unitSacks * 50;
  const rawSubtotalTaka = totalKg * rawPricePerKgTaka;
  const totalExtraCostTaka = truckFareTaka + labourFareTaka;
  const grandTotalTaka = rawSubtotalTaka + totalExtraCostTaka;
  
  // Landed Cost calculations (Per Kg)
  const truckPerKgTaka = totalKg > 0 ? truckFareTaka / totalKg : 0;
  const labourPerKgTaka = totalKg > 0 ? labourFareTaka / totalKg : 0;
  const landedCostPerKgTaka = rawPricePerKgTaka + truckPerKgTaka + labourPerKgTaka;
  const dueTaka = Math.max(0, grandTotalTaka - paidTaka);

  // Weighted Average Cost (WAC) forecast
  const oldStockKg = selectedProduct.stockKg;
  const oldWacTaka = selectedProduct.wacPerKgPaisa / 100;
  const newForecastWacTaka = (oldStockKg + totalKg) > 0
    ? ((oldStockKg * oldWacTaka) + (totalKg * landedCostPerKgTaka)) / (oldStockKg + totalKg)
    : landedCostPerKgTaka;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: PurchaseBill = {
      id: `pur-${Date.now()}`,
      docNo: `PUR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString(),
      vendorName: selectedVendor.name,
      vendorPhone: selectedVendor.phone,
      warehouseId,
      vendorBillNo: `MILL-${Math.floor(100 + Math.random() * 900)}`,
      items: [
        {
          product: selectedProduct,
          unit: standardUnits[1], // 50kg bag
          unitQuantity: unitSacks,
          totalKg,
          rawPricePerKgPaisa: Math.round(rawPricePerKgTaka * 100),
          truckFareAllocatedPaisa: Math.round(truckPerKgTaka * 100),
          labourFareAllocatedPaisa: Math.round(labourPerKgTaka * 100),
          landedCostPerKgPaisa: Math.round(landedCostPerKgTaka * 100),
          lineTotalPaisa: Math.round(grandTotalTaka * 100),
        }
      ],
      subtotalPaisa: Math.round(rawSubtotalTaka * 100),
      truckFarePaisa: Math.round(truckFareTaka * 100),
      labourFarePaisa: Math.round(labourFareTaka * 100),
      otherExpensesPaisa: 0,
      grandTotalPaisa: Math.round(grandTotalTaka * 100),
      paidAmountPaisa: Math.round(paidTaka * 100),
      dueAmountPaisa: Math.round(dueTaka * 100),
      status: 'confirmed'
    };

    onAddPurchase(newBill);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'ক্রয় ও Landed Cost ইনভয়েস' : 'Rice Purchases & Landed Cost'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'মিলের চালের দামের সাথে ট্রাক ভাড়া ও লেবার খরচ যোগ করে প্রকৃত কেনা-দাম (WAC) নির্ধারণ' 
              : 'Calculate true landed purchase cost factoring in truck freight and unloading costs.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ নতুন চাল ক্রয় / চালান এন্ট্রি' : '+ New Purchase Bill'}</span>
        </button>
      </div>

      {/* Purchase List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">{lang === 'bn' ? 'চালান / ইনভয়েস' : 'Doc No'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'মিল / আড়তদার' : 'Vendor'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'চালের আইটেম ও ওজন' : 'Rice & Weight'}</th>
                <th className="py-3 px-3 bg-emerald-50/50">{lang === 'bn' ? 'প্রকৃত কেনা-দর (Landed/Kg)' : 'Landed Cost/Kg'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'সর্বমোট বিল' : 'Grand Total'}</th>
                <th className="py-3 px-3">{lang === 'bn' ? 'পরিশোধ ও বাকি' : 'Paid & Due'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((bill) => (
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
                  </td>
                  <td className="py-3 px-3">
                    {bill.items.map((item, idx) => (
                      <div key={idx}>
                        <span className="font-bold text-slate-900">{item.product.nameBn}</span>
                        <span className="block text-[10px] text-slate-500">
                          {item.unitQuantity} বস্তা ({item.totalKg} কেজি)
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-3 bg-emerald-50/50 font-extrabold text-emerald-800 text-sm">
                    {formatCurrency(bill.items[0]?.landedCostPerKgPaisa || 0, numFormat)}/কেজি
                    <div className="text-[10px] font-normal text-slate-500">
                      (মূল: {formatCurrency(bill.items[0]?.rawPricePerKgPaisa || 0, numFormat)} + ভাড়া)
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE MODAL WITH LANDED COST ENGINE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl my-auto animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {lang === 'bn' ? 'নতুন চাল ক্রয় ও Landed Cost এন্ট্রি' : 'Record Inbound Rice Purchase'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {lang === 'bn' ? 'গাড়িভাড়া ও লেবার খরচ বন্টন করে সঠিক গড় ক্রয়মূল্য নির্ণয়' : 'Freight & labour cost allocation engine'}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Vendor & Warehouse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সরবরাহকারী / মিল / আড়তদার</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.shopName || 'মিল'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">কোন গোডাউনে মাল ঢুকবে</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.nameBn}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product & Quantity */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">চালের জাত</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold text-emerald-900 bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameBn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">৫০ কেজির বস্তা সংখ্যা</label>
                    <input
                      type="number"
                      value={unitSacks}
                      onChange={(e) => setUnitSacks(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      মোট ওজন: {totalKg} কেজি ({totalKg / 40} মণ)
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মিলের মূল রেট (প্রতি কেজি ৳)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rawPricePerKgTaka}
                      onChange={(e) => setRawPricePerKgTaka(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    />
                  </div>
                </div>

                {/* Additional Expenses: Truck & Labour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মোট ট্রাক ভাড়া (৳)</label>
                    <input
                      type="number"
                      value={truckFareTaka}
                      onChange={(e) => setTruckFareTaka(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                      প্রতি কেজিতে যুক্ত হবে: +{truckPerKgTaka.toFixed(2)} ৳
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">মোট লেবার ও আনলোড খরচ (৳)</label>
                    <input
                      type="number"
                      value={labourFareTaka}
                      onChange={(e) => setLabourFareTaka(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                      প্রতি কেজিতে যুক্ত হবে: +{labourPerKgTaka.toFixed(2)} ৳
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE LANDED COST CARD */}
              <div className="p-3.5 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>প্রকৃত কেনা-দাম (Landed Cost Engine)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">প্রতি কেজির আসল ক্রয়মূল্য:</span>
                    <div className="text-lg font-extrabold text-emerald-800">
                      ৳ {landedCostPerKgTaka.toFixed(2)} / কেজি
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-emerald-700 border-t border-emerald-200/60 pt-1.5">
                  <span>পূর্বের গড় খরচ: ৳{(selectedProduct.wacPerKgPaisa / 100).toFixed(2)}</span>
                  <span className="font-bold">নতুন Weighted Average Cost (WAC): ৳{newForecastWacTaka.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment to Vendor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সর্বমোট প্রদেয় বিল</label>
                  <div className="text-base font-extrabold text-slate-900 p-2 bg-slate-100 rounded-xl">
                    ৳ {grandTotalTaka.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মিলকে নগদ/ব্যাংকে পরিশোধ (৳)</label>
                  <input
                    type="number"
                    value={paidTaka}
                    onChange={(e) => setPaidTaka(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 font-extrabold text-emerald-700"
                  />
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    মিল পাবে (বাকি): ৳{dueTaka.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
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
