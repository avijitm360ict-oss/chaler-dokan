import React, { useState } from 'react';
import { RiceProduct, Warehouse, Language, NumberFormat, StockMovement } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { Warehouse as WarehouseIcon, ArrowRightLeft, Sliders, AlertTriangle, CheckCircle2, Plus, Clock, Edit2 } from 'lucide-react';
import { StockCardTimelineModal } from './StockCardTimelineModal';
import { api } from '../../api/client';

interface StockManagementProps {
  products: RiceProduct[];
  warehouses: Warehouse[];
  lang: Language;
  numFormat: NumberFormat;
  onAdjustStock: (productId: string, diffKg: number, reason: string) => void;
  onTransferStock?: (
    fromWarehouseId: string,
    toWarehouseId: string,
    productId: string,
    qtyKg: number,
    note?: string
  ) => Promise<void> | void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  warehouses,
  lang,
  numFormat,
  onAdjustStock,
  onTransferStock,
}) => {
  const t = translations[lang];

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [adjustKg, setAdjustKg] = useState<number>(-15); // e.g. -15 kg moisture loss
  const [reasonCode, setReasonCode] = useState<string>('moisture_loss');
  const [note, setNote] = useState<string>('রোদে শুকিয়ে ওজন হ্রাস');

  // Inter-Warehouse Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFromWh, setTransferFromWh] = useState<string>(warehouses[0]?.id || '');
  const [transferToWh, setTransferToWh] = useState<string>(warehouses[1]?.id || warehouses[0]?.id || '');
  const [transferProductId, setTransferProductId] = useState<string>(products[0]?.id || '');
  const [transferBags, setTransferBags] = useState<number>(10);
  const [transferNote, setTransferNote] = useState<string>('দোকানের চাহিদা মেটাতে গোডাউন থেকে স্থানান্তর');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<RiceProduct | null>(null);
  const [editNameBn, setEditNameBn] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editMinStockKg, setEditMinStockKg] = useState(100);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const handleOpenEdit = (p: RiceProduct) => {
    setEditingProduct(p);
    setEditNameBn(p.nameBn);
    setEditVariety(p.variety);
    setEditGrade(p.grade);
    setEditMinStockKg(p.minStockKg);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSavingProduct(true);
      await api.products.update(editingProduct.id, {
        nameBn: editNameBn,
        variety: editVariety,
        grade: editGrade,
        minStockKg: editMinStockKg,
      });
      editingProduct.nameBn = editNameBn;
      editingProduct.variety = editVariety;
      editingProduct.grade = editGrade;
      editingProduct.minStockKg = editMinStockKg;
      setEditingProduct(null);
      alert('চালের তথ্য সফলভাবে আপডেট সম্পন্ন হয়েছে!');
    } catch (err: any) {
      alert('আপডেট ব্যর্থ হয়েছে: ' + (err?.message || 'সমস্যা হয়েছে'));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Stock Card Timeline Modal State
  const [timelineProduct, setTimelineProduct] = useState<RiceProduct | null>(null);
  const [timelineMovements, setTimelineMovements] = useState<StockMovement[]>([]);

  const handleOpenTimeline = async (prod: RiceProduct) => {
    setTimelineProduct(prod);
    try {
      const res: any = await api.inventory.getTimeline(prod.id);
      if (res?.timeline && Array.isArray(res.timeline)) {
        const moves: StockMovement[] = res.timeline.map((item: any) => ({
          id: item.id,
          date: item.date,
          type: item.movementType === 'purchase' ? 'purchase' : item.movementType === 'sale' ? 'sale' : 'adjustment',
          productId: prod.id,
          productName: prod.nameBn,
          warehouseName: item.warehouseName,
          diffKg: item.changeKg,
          resultingStockKg: item.runningBalanceKg,
          reason: item.reason,
          user: 'সিস্টেম',
        }));
        setTimelineMovements(moves);
        return;
      }
    } catch (err) {
      console.warn('Could not load live timeline:', err);
    }
    // Demo fallback movements if offline or empty
    setTimelineMovements([
      {
        id: 'm-1',
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        type: 'purchase',
        productId: prod.id,
        productName: prod.nameBn,
        warehouseName: 'প্রধান গোডাউন',
        diffKg: 1000,
        resultingStockKg: prod.stockKg,
        reason: 'মোকাম থেকে নতুন চালান রিসিভ',
        user: 'ম্যানেজার'
      },
      {
        id: 'm-2',
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        type: 'sale',
        productId: prod.id,
        productName: prod.nameBn,
        warehouseName: 'প্রধান গোডাউন',
        diffKg: -100,
        resultingStockKg: prod.stockKg - 100,
        reason: 'ক্যাশ মেমো বিক্রয়',
        user: 'ক্যাশিয়ার'
      }
    ]);
  };

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  const totalStockKg = products.reduce((sum, p) => sum + p.stockKg, 0);
  const totalValuationPaisa = products.reduce((sum, p) => sum + Math.round(p.stockKg * p.wacPerKgPaisa), 0);
  const lowStockCount = products.filter((p) => p.stockKg <= p.minStockKg).length;

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjustStock(selectedProductId, adjustKg, `${reasonCode}: ${note}`);
    setAdjustmentModalOpen(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (transferFromWh === transferToWh) {
      setTransferError('উৎস গোডাউন এবং গন্তব্য গোডাউন একই হতে পারে না');
      return;
    }

    const qtyKg = Number(transferBags) * 50;
    if (qtyKg <= 0) {
      setTransferError('স্থানান্তরের পরিমাণ ০ এর বেশি হতে হবে');
      return;
    }

    try {
      setIsSubmittingTransfer(true);
      if (onTransferStock) {
        await onTransferStock(transferFromWh, transferToWh, transferProductId, qtyKg, transferNote);
      } else {
        await api.inventory.transfer({
          fromWarehouseId: transferFromWh,
          toWarehouseId: transferToWh,
          productId: transferProductId,
          qtyKg,
          note: transferNote,
        });
      }
      setTransferModalOpen(false);
      alert(`চাল সফলভাবে স্থানান্তর সম্পন্ন হয়েছে (${transferBags} বস্তা / ${qtyKg} কেজি)!`);
    } catch (err: any) {
      setTransferError(err?.message || 'স্থানান্তর প্রক্রিয়াকরণে ত্রুটি হয়েছে');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট চালের মজুদ (সকল গোডাউন)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatWeight(totalStockKg, numFormat, lang)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            প্রায় {Math.floor(totalStockKg / 50)} বস্তা চাল স্টকে আছে
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট স্টক ভ্যালু (গড় কেনা-দামে)</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(totalValuationPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
            WAC অনুযায়ী প্রকৃত ইনভেন্টরি ভ্যালু
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">লো-স্টক সতর্কতা</span>
            <div className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockCount} টি চাল
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">পুনরায় ক্রয় প্রয়োজন</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>স্থানান্তর</span>
            </button>

            <button
              onClick={() => setAdjustmentModalOpen(true)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>এডজাস্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse Selector & Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Godown Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">গোডাউন অনুযায়ী চালের ব্যালেন্স:</span>
          </div>

          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
            {warehouses.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWarehouseId(w.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedWarehouseId === w.id ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                {w.nameBn}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">চালের নাম ও জাত</th>
                <th className="py-3 px-3">বর্তমান মজুদ (কেজি ও বস্তা)</th>
                <th className="py-3 px-3">গড় ক্রয়মূল্য (WAC)</th>
                <th className="py-3 px-3">খুচরা দর / কেজি</th>
                <th className="py-3 px-3">পাইকারি দর / কেজি</th>
                <th className="py-3 px-3">মোট স্টক ভ্যালু</th>
                <th className="py-3 px-3">স্টক স্ট্যাটাস</th>
                <th className="py-3 px-3 text-center">একশন / টাইমলাইন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.stockKg <= p.minStockKg;
                const valuePaisa = Math.round(p.stockKg * p.wacPerKgPaisa);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.nameBn}</div>
                      <div className="text-[11px] text-slate-500">{p.variety} • {p.grade} • SKU: {p.sku}</div>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatWeight(p.stockKg, numFormat, lang)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-bold">
                      {formatCurrency(p.wacPerKgPaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">
                      {formatCurrency(p.retailPricePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 text-teal-700 font-bold">
                      {formatCurrency(p.wholesalePricePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatCurrency(valuePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          লো-স্টক ({p.minStockKg} কেজির কম)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          পর্যাপ্ত মজুদ ✓
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenTimeline(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition border border-emerald-200 shadow-2xs"
                          title="স্টক কার্ড ও মুভমেন্ট হিস্ট্রি দেখুন"
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>কার্ড</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-300 shadow-2xs"
                          title="চালের বিবরণ ও তথ্য সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>এডিট</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                স্টক এডজাস্টমেন্ট (Stock Adjustment)
              </h3>
              <button onClick={() => setAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">কোন চালের স্টক পরিবর্তন করবেন</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.nameBn} (বর্তমান: {p.stockKg} কেজি)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ওজন সমন্বয় (কেজি: মাইনাস অথবা প্লাস)</label>
                <input
                  type="number"
                  value={adjustKg}
                  onChange={(e) => setAdjustKg(Number(e.target.value))}
                  placeholder="-১৫ বা +৫০"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ওজন কমে গেলে ঋণাত্মক সংখ্যা দিন (যেমন: -১৫), বাড়লে ধনাত্মক (+৫০)
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বাধ্যতামূলক কারণ (PRD 5.3 অনুযায়ী)</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="moisture_loss">ওজন কমে যাওয়া (Moisture loss / শুকানো)</option>
                  <option value="damage">পোকা ধরা / চাল নষ্ট / আর্দ্রতা</option>
                  <option value="theft_loss">চুরি বা অনিচ্ছাকৃত ক্ষতি</option>
                  <option value="counting_error">গণনায় ভুল সমন্বয়</option>
                  <option value="other">অন্যান্য কারণ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিস্তারিত নোট</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md"
                >
                  এডজাস্টমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Warehouse Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">আন্তঃগোডাউন চাল স্থানান্তর (Transfer)</h3>
                  <p className="text-[11px] text-slate-500">এক গোডাউন থেকে অন্য গোডাউনে চাল পাঠানো ও ডব্লিউএসি সমন্বয়</p>
                </div>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">উৎস গোডাউন (From)</label>
                  <select
                    value={transferFromWh}
                    onChange={(e) => setTransferFromWh(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">গন্তব্য গোডাউন (To)</label>
                  <select
                    value={transferToWh}
                    onChange={(e) => setTransferToWh(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">স্থানান্তরের চাল নির্বাচন করুন</label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameBn} ({p.variety}) - বর্তমান মোট স্টক: {formatWeight(p.stockKg, numFormat, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">বস্তার সংখ্যা (৫০ কেজি বস্তা)</label>
                  <input
                    type="number"
                    min="1"
                    value={transferBags}
                    onChange={(e) => setTransferBags(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-base text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোট কেজি (স্বয়ংক্রিয়)</label>
                  <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-extrabold text-base text-blue-700">
                    {transferBags * 50} কেজি
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">স্থানান্তরের নোট / বিবরণ</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="যেমন: দোকানের চলতি বিক্রয় মেটাতে মেইন গোডাউন হতে স্থানান্তর"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isSubmittingTransfer ? 'স্থানান্তর হচ্ছে...' : 'স্থানান্তর সম্পন্ন করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    চাল ও পণ্যের তথ্য সম্পাদনা
                  </h3>
                  <p className="text-xs text-slate-500">আইটেম কোড / SKU: {editingProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">চালের নাম (বাংলায়)</label>
                <input
                  type="text"
                  required
                  value={editNameBn}
                  onChange={(e) => setEditNameBn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">জাত (Variety)</label>
                  <input
                    type="text"
                    required
                    value={editVariety}
                    onChange={(e) => setEditVariety(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মান / গ্রেড</label>
                  <input
                    type="text"
                    required
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">সর্বনিম্ন সতর্কতা স্টক লেভেল (কেজি)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editMinStockKg}
                  onChange={(e) => setEditMinStockKg(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  মজুদ এই পরিমাণের নিচে নামলে সিস্টেমে লো-স্টক সতর্কতা দেখাবে
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingProduct ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Card Timeline Modal */}
      <StockCardTimelineModal
        isOpen={!!timelineProduct}
        onClose={() => setTimelineProduct(null)}
        product={timelineProduct}
        movements={timelineMovements}
        lang={lang}
        numFormat={numFormat}
      />

    </div>
  );
};
