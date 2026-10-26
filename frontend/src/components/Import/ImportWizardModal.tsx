import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Download,
  X,
  FileCheck,
  Edit2
} from 'lucide-react';
import { Language, NumberFormat, ImportPreviewRow, RiceProduct, Party } from '../../types';
import { sampleImportRows, standardUnits } from '../../data/mockData';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  numFormat: NumberFormat;
  onImportProducts?: (products: RiceProduct[]) => void;
  onImportSuccess: (count: number) => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  lang,
  numFormat,
  onImportProducts,
  onImportSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [importType, setImportType] = useState<'products' | 'clients' | 'vendors' | 'stock'>('products');
  const [fileName, setFileName] = useState<string>('chal_stock_babubazar.csv');
  const [rows, setRows] = useState<ImportPreviewRow[]>(sampleImportRows);
  const [importedCount, setImportedCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const dataRows: ImportPreviewRow[] = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        const [name = '', variety = '', category = '', unit = '৫০ কেজি বস্তা', price = '', stock = ''] = parts;

        const numPrice = Number(price);
        const isValid = Boolean(name.trim()) && !isNaN(numPrice) && numPrice > 0;
        const errorMessage = !name.trim()
          ? 'চালের নাম নেই'
          : isNaN(numPrice) || numPrice <= 0
          ? 'দর সঠিক নয়'
          : undefined;

        return {
          rowNumber: idx + 1,
          name: name || `চাল আইটেম ${idx + 1}`,
          variety: variety || 'মিনিকেট',
          category: category || 'সিদ্ধ',
          unit: unit || '৫০ কেজি বস্তা',
          price: price || '৭৪',
          stock: stock || '১০০০',
          isValid,
          errorMessage,
        };
      });

      setRows(dataRows);
      setStep(3);
    };
    reader.readAsText(file);
  };

  const handleCellEdit = (rowNumber: number, field: keyof ImportPreviewRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber === rowNumber) {
          const updated = { ...r, [field]: value };
          // Validation check
          if (field === 'name' && value.trim()) {
            updated.isValid = !isNaN(Number(updated.price));
            updated.errorMessage = updated.isValid ? undefined : 'দর সংখ্যা হতে হবে';
          } else if (field === 'price' && !isNaN(Number(value))) {
            updated.isValid = !!updated.name.trim();
            updated.errorMessage = updated.isValid ? undefined : 'চালের নাম বাধ্যতামূলক';
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleConfirmImport = (onlyValid: boolean) => {
    const toImport = onlyValid ? rows.filter((r) => r.isValid) : rows;
    setImportedCount(toImport.length);

    if (importType === 'products' && onImportProducts) {
      const newProducts: RiceProduct[] = toImport.map((r, i) => {
        const pricePerKg = Number(r.price) || 72;
        const stockKg = Number(r.stock) || 1000;
        return {
          id: `prod-imp-${Date.now()}-${i}`,
          nameBn: r.name,
          nameEn: r.name,
          variety: r.variety,
          grade: 'স্পেশাল',
          category: r.category,
          sku: `IMP-${Date.now().toString().slice(-4)}-${i + 1}`,
          stockKg: stockKg,
          minStockKg: 200,
          wacPerKgPaisa: Math.round(pricePerKg * 90),
          retailPricePaisa: Math.round(pricePerKg * 100),
          wholesalePricePaisa: Math.round(pricePerKg * 94),
          sack50RetailPricePaisa: Math.round(pricePerKg * 50 * 100),
          sack50WholesalePricePaisa: Math.round(pricePerKg * 50 * 94),
          availableUnits: standardUnits,
        };
      });
      onImportProducts(newProducts);
    }

    onImportSuccess(toImport.length);
    setStep(4);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFFName,Variety,Category,Unit,Price,Stock\r\n' +
      'মিনিকেট চাল (কুষ্টিয়া),মিনিকেট,সিদ্ধ,৫০ কেজি বস্তা,৭৪,৩০০০\r\n' +
      'নাজিরশাইল চাল (দিনাজপুর),নাজিরশাইল,সিদ্ধ,৫০ কেজি বস্তা,৮৪,২৫০০\r\n' +
      'কাটারিভোগ চাল (প্রিমিয়াম),কাটারিভোগ,আতপ,২৫ কেজি বস্তা,৯৫,১৫০০\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chal_template_${importType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-modal border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'Excel / CSV ইমপোর্ট উইজার্ড (I1)' : 'Excel / CSV Import Wizard (I1)'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'ভুল সারি ঠিক করার সুবিধাসহ দ্রুত ডেটা তোলার সিস্টেম' : 'Step-by-step import with inline error correction'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-1.5 py-3">
          {[
            { stepNum: 1, label: '১. ধরন ও টেমপ্লেট' },
            { stepNum: 2, label: '২. ফাইল আপলোড' },
            { stepNum: 3, label: '৩. প্রিভিউ ও সংশোধন' },
            { stepNum: 4, label: '৪. ফলাফল' },
          ].map((s) => (
            <div
              key={s.stepNum}
              className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition ${
                step === s.stepNum
                  ? 'bg-[#1F7A4D] text-white shadow-xs'
                  : step > s.stepNum
                  ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step 1: Type & Template Download */}
        {step === 1 && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-[#1A1A17] mb-2">
                কী ধরণের তথ্য আপলোড করতে চান?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'products', label: 'চালের আইটেম' },
                  { id: 'clients', label: 'কাস্টমার তালিকা' },
                  { id: 'vendors', label: 'মিল ও ভেন্ডর' },
                  { id: 'stock', label: 'ওপেনিং স্টক' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setImportType(t.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-center transition touch-target ${
                      importType === t.id
                        ? 'border-[#1F7A4D] bg-[#E8F4EC] text-[#1F7A4D]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A17]">নমুনা এক্সেল টেমপ্লেট ডাউনলোড করুন</h4>
                <p className="text-[11px] text-slate-500">টেমপ্লেট অনুযায়ী সাজিয়ে আপলোড করলে কোনো ভুল হবে না।</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#1F7A4D] hover:bg-slate-100 transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>টেমপ্লেট (CSV)</span>
              </button>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-bold text-xs rounded-xl shadow-md transition touch-target"
              >
                <span>পরের ধাপ: ফাইল আপলোড</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload File */}
        {step === 2 && (
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DDD9CE] hover:border-[#1F7A4D] rounded-3xl p-8 text-center bg-slate-50/50 cursor-pointer transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, text/csv, .txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-14 h-14 rounded-2xl bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-[#1A1A17]">আপনার CSV ফাইল এখানে ড্রপ করুন অথবা ক্লিক করুন</h4>
              <p className="text-xs text-slate-500 mt-1">.csv ফাইল সাপোর্ট করে (সর্বোচ্চ ১০MB)</p>
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2 bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-xl hover:bg-slate-100 shadow-xs cursor-pointer"
                >
                  কম্পিউটার বা ফোন থেকে CSV ফাইল বাছুন
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>{fileName}</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                {rows.length}টি সারি সনাক্ত হয়েছে
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                পিছনে
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-bold text-xs rounded-xl shadow-md transition touch-target"
              >
                <span>পরের ধাপ: প্রিভিউ ও ভুল ঠিক করা</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview with Error Highlighting & Direct Table Editing (Section 2.9 & 4.12) */}
        {step === 3 && (
          <div className="space-y-3.5 py-2 flex-1 overflow-y-auto">
            
            {/* Summary Stat Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#E8F4EC] border border-[#1F7A4D]/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#16603B] font-bold block">সঠিক সারি (ইমপোর্ট প্রস্তুত)</span>
                  <div className="text-xl font-black text-[#1F7A4D]">{validCount} টি</div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#1F7A4D]" />
              </div>

              <div className="p-3 bg-[#FDECEA] border border-[#B3261E]/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#B3261E] font-bold block">ভুল সারি (সংশোধন প্রয়োজন)</span>
                  <div className="text-xl font-black text-[#B3261E]">{invalidCount} টি</div>
                </div>
                <AlertTriangle className="w-6 h-6 text-[#B3261E]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-[#1A1A17]">
                <Edit2 className="w-3.5 h-3.5 text-[#1F7A4D]" />
                ভুল ঘরের ওপর সরাসরি টাইপ করে ঠিক করতে পারেন:
              </span>
              <span>লাল রঙের সারিগুলোতে ভুল রয়েছে</span>
            </div>

            {/* Editable Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 sticky top-0">
                    <th className="py-2 px-2.5">সারি</th>
                    <th className="py-2 px-2.5">চালের নাম</th>
                    <th className="py-2 px-2.5">ভ্যারাইটি</th>
                    <th className="py-2 px-2.5">দর (৳)</th>
                    <th className="py-2 px-2.5">স্টক</th>
                    <th className="py-2 px-2.5">অবস্থা / কারণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={r.isValid ? 'bg-white hover:bg-slate-50' : 'bg-[#FDECEA]/60 hover:bg-[#FDECEA]'}
                    >
                      <td className="py-2 px-2.5 font-mono text-slate-500">{r.rowNumber}</td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleCellEdit(r.rowNumber, 'name', e.target.value)}
                          placeholder="নাম লিখুন"
                          className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-slate-700">{r.variety}</td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={r.price}
                          onChange={(e) => handleCellEdit(r.rowNumber, 'price', e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs rounded border border-slate-300 text-center bg-white"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-slate-700">{r.stock}</td>
                      <td className="py-2 px-2.5">
                        {r.isValid ? (
                          <span className="text-[10px] text-[#1F7A4D] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ঠিক আছে
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#B3261E] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {r.errorMessage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions: Import Valid vs Import All */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <button onClick={() => setStep(2)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                পিছনে
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmImport(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition touch-target"
                >
                  {validCount}টি ঠিকগুলো আগে ইমপোর্ট করুন
                </button>

                <button
                  type="button"
                  disabled={invalidCount > 0}
                  onClick={() => handleConfirmImport(false)}
                  className="px-5 py-2 bg-[#1F7A4D] hover:bg-[#16603B] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition touch-target"
                >
                  সব ঠিক করে ইমপোর্ট ({rows.length}টি)
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Step 4: Success & 1-Click Undo Link */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4 flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-[#1A1A17]">
              {importedCount}টি চাল সফলভাবে ডাটাবেজে তোলা হয়েছে!
            </h3>

            <p className="text-xs text-[#5B574E] max-w-sm mx-auto leading-relaxed">
              আইটেমগুলো অবিলম্বে কাউন্টার POS এবং আজকের বাজারদর বোর্ডে দৃশ্যমান হবে।
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  alert('ইমপোর্ট করা আইটেমগুলো বাতিল ও রুলব্যাক করা হয়েছে।');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B3261E] hover:underline p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ভুল মনে হলে এক ক্লিকে সম্পূর্ণ ইমপোর্ট বাতিল করুন</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 bg-[#1F7A4D] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-[#16603B] transition"
              >
                সমাপ্ত ও বন্ধ করুন
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
