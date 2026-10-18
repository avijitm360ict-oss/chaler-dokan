import React, { useState } from 'react';
import { SaleInvoice, PurchaseBill, ReturnRecord, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { RotateCcw, AlertTriangle, CheckCircle2, Search, Printer, ArrowLeftRight, FileText, X } from 'lucide-react';

interface ReturnsManagerProps {
  sales: SaleInvoice[];
  purchases: PurchaseBill[];
  returns: ReturnRecord[];
  onAddReturn: (ret: ReturnRecord) => void;
  lang: Language;
  numFormat: NumberFormat;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  sales,
  purchases,
  returns,
  onAddReturn,
  lang,
  numFormat
}) => {
  const [returnType, setReturnType] = useState<'sale_return' | 'purchase_return'>('sale_return');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocNo, setSelectedDocNo] = useState<string>(sales[0]?.docNo || '');
  
  // Return Form State
  const [returnQtyKg, setReturnQtyKg] = useState<number>(25);
  const [condition, setCondition] = useState<'good' | 'damaged'>('good');
  const [reason, setReason] = useState<string>('কাস্টমার ভুল জাত নিয়েছিলেন');
  const [settlementMethod, setSettlementMethod] = useState<'deduct_due' | 'cash_refund' | 'store_credit'>('deduct_due');
  const [activeReturnPrint, setActiveReturnPrint] = useState<ReturnRecord | null>(null);

  const selectedSale = sales.find((s) => s.docNo === selectedDocNo) || sales[0];
  const maxReturnableKg = selectedSale ? selectedSale.totalKg : 50;
  const unitRatePaisa = selectedSale?.items[0] ? selectedSale.items[0].unitPricePaisa / (selectedSale.items[0].selectedUnit.kgPerUnit || 1) : 7400;
  const returnTotalPaisa = Math.round(returnQtyKg * unitRatePaisa);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || returnQtyKg <= 0) return;

    const newRet: ReturnRecord = {
      id: `ret-${Date.now()}`,
      docNo: `RET-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      type: returnType,
      originalDocNo: selectedSale.docNo,
      partyName: selectedSale.clientName,
      items: [
        {
          productId: selectedSale.items[0]?.product.id || 'prod-1',
          productName: selectedSale.items[0]?.product.nameBn || 'মিনিকেট চাল',
          unitName: 'কেজি',
          quantity: returnQtyKg,
          totalKg: returnQtyKg,
          ratePaisa: unitRatePaisa,
          totalAmountPaisa: returnTotalPaisa,
          condition: condition
        }
      ],
      reason,
      settlementMethod,
      totalAmountPaisa: returnTotalPaisa,
      approvedBy: 'হাজী মো: রফিকুল ইসলাম (মালিক)'
    };

    onAddReturn(newRet);
    setIsModalOpen(false);
    setActiveReturnPrint(newRet);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FDECEA] text-[#B3261E] rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-[#1A1A17] tracking-tight">
              {lang === 'bn' ? 'চাল ফেরত ও ক্রেডিট নোট (S5 ও P3)' : 'Returns & Credit Notes (S5 & P3)'}
            </h2>
          </div>
          <p className="text-xs text-[#5B574E] mt-1">
            {lang === 'bn'
              ? 'বিক্রিত চাল ফেরত (Sales Return) ও মিলে চাল ফেরত (Purchase Return) হিসাব'
              : 'Audit-ready returns with stock restoration & due adjustments'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white rounded-xl text-xs font-bold shadow-md transition touch-target"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ নতুন ফেরত তৈরি করুন' : '+ New Return Entry'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setReturnType('sale_return')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
            returnType === 'sale_return'
              ? 'border-[#1F7A4D] text-[#1F7A4D]'
              : 'border-transparent text-[#5B574E] hover:text-[#1A1A17]'
          }`}
        >
          বিক্রয় ফেরত তালিকা ({returns.filter((r) => r.type === 'sale_return').length})
        </button>
        <button
          onClick={() => setReturnType('purchase_return')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
            returnType === 'purchase_return'
              ? 'border-[#1F7A4D] text-[#1F7A4D]'
              : 'border-transparent text-[#5B574E] hover:text-[#1A1A17]'
          }`}
        >
          ক্রয় ফেরত তালিকা ({returns.filter((r) => r.type === 'purchase_return').length})
        </button>
      </div>

      {/* Returns List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">ফেরত নং</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">মূল বিল / চালান</th>
                <th className="py-3 px-4">পার্টির নাম</th>
                <th className="py-3 px-4">ফেরত চাল ও পরিমাণ</th>
                <th className="py-3 px-4">মালের অবস্থা</th>
                <th className="py-3 px-4">ফেরত টাকা</th>
                <th className="py-3 px-4">নিষ্পত্তি পদ্ধতি</th>
                <th className="py-3 px-4 text-right">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns
                .filter((r) => r.type === returnType)
                .map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1F7A4D]">{ret.docNo}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateBangla(ret.date)}</td>
                    <td className="py-3 px-4 font-mono">{ret.originalDocNo}</td>
                    <td className="py-3 px-4 font-bold text-[#1A1A17]">{ret.partyName}</td>
                    <td className="py-3 px-4">
                      {ret.items.map((it, idx) => (
                        <div key={idx}>
                          {it.productName} ({it.totalKg} কেজি)
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ret.items[0]?.condition === 'good' ? 'bg-[#E8F4EC] text-[#1F7A4D]' : 'bg-[#FDECEA] text-[#B3261E]'
                      }`}>
                        {ret.items[0]?.condition === 'good' ? 'ভালো মাল' : 'নষ্ট / পোকা ধরা'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-[#1A1A17] tabular-nums">
                      {formatCurrency(ret.totalAmountPaisa, numFormat)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-700">
                        {ret.settlementMethod === 'deduct_due' && 'বাকি থেকে বাদ'}
                        {ret.settlementMethod === 'cash_refund' && 'নগদ ক্যাশ ফেরত'}
                        {ret.settlementMethod === 'store_credit' && 'ক্রেডিট নোট'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReturnPrint(ret)}
                        className="p-1.5 text-slate-500 hover:text-[#1F7A4D] hover:bg-slate-100 rounded-lg"
                        title="প্রিন্ট ক্রেডিট নোট"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Return Modal (Section 4.10) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-modal border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'চাল ফেরত ফর্ম (S5)' : 'Return Entry Form'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              
              {/* 1. Pick Original Invoice */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1">১. মূল ইনভয়েস নির্বাচন করুন:</label>
                <select
                  value={selectedDocNo}
                  onChange={(e) => setSelectedDocNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D] bg-white text-[#1A1A17]"
                >
                  {sales.map((s) => (
                    <option key={s.id} value={s.docNo}>
                      {s.docNo} — {s.clientName} ({s.totalKg} কেজি চাল, ৳{(s.grandTotalPaisa / 100).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Item & Max Qty */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">চাল:</span>
                  <span className="font-bold">{selectedSale?.items[0]?.product.nameBn || 'মিনিকেট চাল'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">বিক্রিত পরিমাণ (সর্বোচ্চ ফেরত সীমা):</span>
                  <span className="font-bold text-[#1F7A4D]">{maxReturnableKg} কেজি</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A17] mb-1">ফেরতের পরিমাণ (কেজি):</label>
                  <input
                    type="number"
                    max={maxReturnableKg}
                    min={1}
                    value={returnQtyKg}
                    onChange={(e) => setReturnQtyKg(Math.min(maxReturnableKg, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D] bg-white"
                  />
                </div>
              </div>

              {/* 3. Rice Condition & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A17] mb-1">মালের অবস্থা:</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="good">ভালো মাল (স্টকে ঢুকবে)</option>
                    <option value="damaged">নষ্ট / পোকা ধরা (ক্ষতি)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1A17] mb-1">ফেরতের কারণ:</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="কাস্টমার ভুল জাত নিয়েছিলেন">ভুল চাল নিয়েছিলেন</option>
                    <option value="বস্তায় কমতি বা ওজন গরমিল">ওজন গরমিল</option>
                    <option value="চালের গুণমান পছন্দ হয়নি">গুণমান পছন্দ হয়নি</option>
                    <option value="অতিরিক্ত মাল ফেরত">অতিরিক্ত মাল ফেরত</option>
                  </select>
                </div>
              </div>

              {/* 4. Settlement method (3 Big Radios per Section 4.10) */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1.5">
                  টাকা কীভাবে মিটবে?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'deduct_due', label: 'বাকি থেকে বাদ' },
                    { id: 'cash_refund', label: 'নগদ ফেরত' },
                    { id: 'store_credit', label: 'ক্রেডিট রাখুন' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettlementMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition touch-target ${
                        settlementMethod === m.id
                          ? 'border-[#1F7A4D] bg-[#E8F4EC] text-[#1F7A4D]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3 bg-[#E8F4EC] rounded-2xl border border-[#1F7A4D]/30 flex justify-between items-center text-xs">
                <span className="font-bold text-[#16603B]">ফেরত মোট মূল্য:</span>
                <span className="text-base font-black text-[#1F7A4D] tabular-nums">
                  {formatCurrency(returnTotalPaisa, numFormat)}
                </span>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-extrabold text-sm rounded-xl shadow-md transition touch-target flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ফেরত কনফার্ম ও ক্রেডিট নোট তৈরি করুন</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Credit Note Print Preview Modal */}
      {activeReturnPrint && (
        <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#1A1A17]">ক্রেডিট নোট রসিদ (Credit Note)</h3>
              <button onClick={() => setActiveReturnPrint(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-area" className="p-4 border border-dashed border-slate-300 rounded-2xl space-y-3 text-xs bg-slate-50/50">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-sm text-[#1F7A4D]">মেসার্স বিসমিল্লাহ চাউল আড়ত</div>
                <div className="text-[11px] text-slate-500">ক্রেডিট নোট নম্বর: {activeReturnPrint.docNo}</div>
                <div className="text-[10px] text-slate-400">মূল ইনভয়েস: {activeReturnPrint.originalDocNo}</div>
              </div>

              <div className="flex justify-between">
                <span>পার্টি: <strong>{activeReturnPrint.partyName}</strong></span>
                <span>তারিখ: {formatDateBangla(activeReturnPrint.date)}</span>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold">
                    <th className="py-1">চাল</th>
                    <th className="py-1 text-center">পরিমাণ</th>
                    <th className="py-1 text-right">মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReturnPrint.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5">{it.productName}</td>
                      <td className="py-1.5 text-center">{it.totalKg} কেজি</td>
                      <td className="py-1.5 text-right tabular-nums">{formatCurrency(it.totalAmountPaisa, numFormat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>ফেরতের মোট ক্রেডিট:</span>
                <span className="text-[#1F7A4D] tabular-nums">{formatCurrency(activeReturnPrint.totalAmountPaisa, numFormat)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1F7A4D] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl shadow-md transition touch-target flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setActiveReturnPrint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
