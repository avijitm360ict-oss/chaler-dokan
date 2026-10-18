import React, { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  PackagePlus,
  ArrowRight,
  Store,
  Phone,
  Lock,
  User,
  X,
  ChevronRight,
  Check
} from 'lucide-react';
import { RiceProduct, TenantInfo, Language, NumberFormat } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantInfo;
  onUpdateTenant: (tenant: TenantInfo) => void;
  onAddProducts: (newProducts: RiceProduct[]) => void;
  onGoToPos: () => void;
  lang: Language;
  numFormat: NumberFormat;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onUpdateTenant,
  onAddProducts,
  onGoToPos,
  lang,
  numFormat
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Step 1: 4 signup fields
  const [shopName, setShopName] = useState(tenant.shopNameBn);
  const [ownerName, setOwnerName] = useState(tenant.proprietor);
  const [phone, setPhone] = useState(tenant.phone);
  const [password, setPassword] = useState('••••••••');

  // Step 2: Path choice ('manual' vs 'excel')
  const [startPath, setStartPath] = useState<'manual' | 'excel'>('manual');

  // Step 3: 5 popular pre-suggested rice items
  const [selectedItems, setSelectedItems] = useState([
    { id: 'onb-1', name: 'কুষ্টিয়ার অটো মিনিকেট', rate: 74, stockBags: 30, selected: true },
    { id: 'onb-2', name: 'দিনাজপুরের নাজিরশাইল', rate: 84, stockBags: 20, selected: true },
    { id: 'onb-3', name: 'কাটারিভোগ সুগন্ধি পোলাও', rate: 135, stockBags: 10, selected: true },
    { id: 'onb-4', name: 'চিনিগুঁড়া প্রিমিয়াম সুবাসিত', rate: 145, stockBags: 8, selected: true },
    { id: 'onb-5', name: 'বিআর-২৮ চাল (মাঝারি)', rate: 58, stockBags: 40, selected: true },
  ]);

  if (!isOpen) return null;

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (idx: number, field: 'rate' | 'stockBags', val: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleFinishOnboarding = () => {
    onUpdateTenant({
      ...tenant,
      shopNameBn: shopName,
      shopNameEn: shopName,
      proprietor: ownerName,
      ownerName: ownerName,
      phone: phone
    });

    onClose();
    onGoToPos();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-modal border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Bar & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1F7A4D] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-[#E0A526]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1A1A17]">
                {lang === 'bn' ? 'দোকান সেটআপ গাইড (২০ মিনিট চ্যালেঞ্জ)' : 'Rice Shop Setup Guide (A1-A3)'}
              </h2>
              <p className="text-xs text-[#5B574E]">
                {lang === 'bn' ? `ধাপ ${step} / ৪: ${step === 1 ? 'দোকানের তথ্য' : step === 2 ? 'পদ্ধতি বাছাই' : step === 3 ? 'চাল ও স্টক' : 'প্রথম বিক্রি'}` : `Step ${step} of 4`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-[#1F7A4D]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 4-Field Signup */}
        {step === 1 && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <div className="bg-[#E8F4EC] p-3.5 rounded-2xl border border-[#1F7A4D]/20 text-xs text-[#16603B] font-medium leading-relaxed">
              {lang === 'bn'
                ? '🌾 চালের আড়ত বা খুচরা দোকানদারদের জন্য সাইনআপ একদম সহজ। মাত্র ৪টি ঘর পূরণ করে শুরু করুন।'
                : 'Simple 4-field setup tailored for Bangladesh rice traders.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1">দোকানের নাম:</label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1">মালিকের নাম:</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1">মোবাইল ফোন নম্বর:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A17] mb-1">পাসওয়ার্ড:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-bold text-xs rounded-xl shadow-md transition touch-target"
              >
                <span>পরের ধাপ: শুরুর পদ্ধতি বাছুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: "কীভাবে শুরু করবেন?" - Two Big Cards */}
        {step === 2 && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-[#1A1A17]">
              {lang === 'bn' ? 'কীভাবে দোকানে পণ্য ও চালের হিসাব তুলতে চান?' : 'How do you want to start?'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Excel Import */}
              <div
                onClick={() => setStartPath('excel')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                  startPath === 'excel'
                    ? 'border-[#1F7A4D] bg-[#E8F4EC]/60 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1F7A4D] flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#1A1A17]">
                    {lang === 'bn' ? 'Excel থেকে আনুন' : 'Import from Excel'}
                  </h4>
                  <p className="text-xs text-[#5B574E] mt-1.5 leading-relaxed">
                    {lang === 'bn'
                      ? 'পুরোনো খাতা বা কম্পিউটার ফাইল থাকলে সহজে এক্সেল শিট আপলোড করে সব চাল ও কাস্টমার এক ক্লিকে তুলুন।'
                      : 'Upload existing spreadsheet with automated error-fixing preview.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#1F7A4D]">
                  <span>{lang === 'bn' ? 'টেমপ্লেট ডাউনলোড ও আপলোড' : 'Download template'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Manual Fast Setup with Popular Rice */}
              <div
                onClick={() => setStartPath('manual')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                  startPath === 'manual'
                    ? 'border-[#1F7A4D] bg-[#E8F4EC]/60 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#E0A526] flex items-center justify-center mb-3">
                    <PackagePlus className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#1A1A17]">
                    {lang === 'bn' ? 'হাতে যোগ করুন (জনপ্রিয় চাল)' : 'Quick Pre-suggested Rice'}
                  </h4>
                  <p className="text-xs text-[#5B574E] mt-1.5 leading-relaxed">
                    {lang === 'bn'
                      ? 'মিনিকেট, নাজিরশাইল, বাসমতি, চিনিগুঁড়া চাল আগে থেকেই রেডি করা আছে। শুধু দাম ঠিক করে ৫ মিনিটে চালু করুন।'
                      : 'Preloaded with Bangladesh top 5 rice varieties. Ready in 5 minutes.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#1F7A4D]">
                  <span>{lang === 'bn' ? 'দ্রুত শুরু করুন (প্রস্তাবিত)' : 'Recommended'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#5B574E] hover:text-[#1A1A17]"
              >
                পিছনে
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-bold text-xs rounded-xl shadow-md transition touch-target"
              >
                <span>পরের ধাপ: চালের স্টক বাছাই</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Suggest 3-5 popular rice products with price and opening stock */}
        {step === 3 && (
          <div className="space-y-3.5 py-2 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1A1A17]">
                {lang === 'bn' ? 'জনপ্রিয় ৫টি চালের দর ও আজকের গোডাউন স্টক:' : 'Suggested Rice Items & Opening Stock'}
              </h3>
              <span className="text-[11px] text-[#5B574E]">কেজি দর ও ৫০ কেজি বস্তা সংখ্যা</span>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    item.selected ? 'border-[#1F7A4D] bg-[#E8F4EC]/30' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleItem(idx)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        item.selected ? 'bg-[#1F7A4D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {item.selected && <Check className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A17]">{item.name}</div>
                      <div className="text-[10px] text-[#5B574E]">ইউনিট: ৫০ কেজি বস্তা ও খোলা কেজি</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">বিক্রি দর (৳/কেজি)</span>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                        disabled={!item.selected}
                        className="w-18 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ওপেনিং বস্তা</span>
                      <input
                        type="number"
                        value={item.stockBags}
                        onChange={(e) => updateItem(idx, 'stockBags', Number(e.target.value))}
                        disabled={!item.selected}
                        className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-center bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-[#5B574E] hover:text-[#1A1A17]"
              >
                পিছনে
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-bold text-xs rounded-xl shadow-md transition touch-target"
              >
                <span>পরের ধাপ: সম্পন্ন ও প্রথম বিক্রি</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: First POS Walkthrough Confirmation */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4 flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-[#1A1A17]">
              {lang === 'bn' ? 'মাশাআল্লাহ! আপনার চালের দোকান প্রস্তুত।' : 'Setup Complete! Ready for First Sale.'}
            </h3>

            <p className="text-xs text-[#5B574E] max-w-md mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'আপনার দোকানের প্রাথমিক তথ্য ও জনপ্রিয় চালের স্টক সিস্টেমে লোড হয়েছে। এখন কাউন্টার সেল (POS)-এ গিয়ে আপনার প্রথম মেমো বা ক্যাশ বিক্রি কাটুন।'
                : 'Initial inventory loaded. Launch POS counter to complete your first 20-second sale.'}
            </p>

            <div className="bg-[#FFF4DC] border border-[#E0A526]/40 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="font-bold text-[#8A5A00] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>পরের প্রয়োজনীয় কাজসমূহ:</span>
              </div>
              <ul className="list-disc list-inside text-[#5B574E] space-y-1 text-[11px]">
                <li>নিয়মিত কাস্টমার ও পাইকারি ক্রেতাদের বাকি খাতা যোগ করা</li>
                <li>রাইস মিল ও মহাজনদের দেনা এবং ভেন্ডর তালিকা তৈরি</li>
                <li>সকালে দোকান খুলেই "আজকের বাজারদর" আপডেট করা</li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={handleFinishOnboarding}
                className="w-full sm:w-auto px-8 py-3 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-extrabold text-sm rounded-2xl shadow-lg transition touch-target inline-flex items-center justify-center gap-2"
              >
                <span>কাউন্টার POS-এ প্রথম বিক্রি শুরু করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
