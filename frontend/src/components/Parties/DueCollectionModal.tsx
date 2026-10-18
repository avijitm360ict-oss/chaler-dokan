import React, { useState } from 'react';
import { Party, Language, NumberFormat } from '../../types';
import { formatCurrency, toBengaliDigits } from '../../utils/formatters';
import { Wallet, Banknote, Smartphone, Building2, CheckCircle2, X, Printer, MessageCircle, AlertCircle } from 'lucide-react';

interface DueCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parties: Party[];
  selectedPartyId?: string;
  lang: Language;
  numFormat: NumberFormat;
  onCollectDue: (partyId: string, amountPaisa: number, method: string, note?: string) => void;
}

export const DueCollectionModal: React.FC<DueCollectionModalProps> = ({
  isOpen,
  onClose,
  parties,
  selectedPartyId,
  lang,
  numFormat,
  onCollectDue
}) => {
  const clients = parties.filter((p) => p.type === 'client' || p.type === 'both');
  const [activePartyId, setActivePartyId] = useState<string>(selectedPartyId || clients[0]?.id || '');
  const [amountTaka, setAmountTaka] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [receiptSaved, setReceiptSaved] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  if (!isOpen) return null;

  const currentParty = parties.find((p) => p.id === activePartyId) || clients[0];
  const partyDuePaisa = currentParty?.balancePaisa || 0;
  const partyDueTaka = partyDuePaisa / 100;

  // Aging estimation (PRD 4.9: 0-7 days, 8-30 days, 30+ days)
  const agingRecent = Math.round(partyDueTaka * 0.5);
  const agingMedium = Math.round(partyDueTaka * 0.35);
  const agingOld = partyDueTaka - agingRecent - agingMedium;

  const numAmount = parseFloat(amountTaka) || 0;
  const numAmountPaisa = Math.round(numAmount * 100);

  // Quick Amount Preset buttons
  const quickAmounts = [1000, 2000, 5000, 10000, Math.floor(partyDueTaka)];

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmountTaka('');
    } else if (val === '⌫') {
      setAmountTaka((prev) => prev.slice(0, -1));
    } else {
      setAmountTaka((prev) => prev + val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParty || numAmount <= 0) return;

    onCollectDue(currentParty.id, numAmountPaisa, paymentMethod);

    setLastReceipt({
      partyName: currentParty.name,
      phone: currentParty.phone,
      amountPaisa: numAmountPaisa,
      oldDuePaisa: partyDuePaisa,
      newDuePaisa: Math.max(0, partyDuePaisa - numAmountPaisa),
      date: new Date().toISOString(),
      method: paymentMethod
    });

    setReceiptSaved(true);
  };

  const handleCloseAll = () => {
    setReceiptSaved(false);
    setAmountTaka('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-modal border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'বাকি আদায় ও জমা (M1)' : 'Due Collection (M1)'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? '৪ ধাপে ২০ সেকেন্ডে বাকি আদায় ও রসিদ তৈরি' : 'Quick 4-step due receipt'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If receipt saved, show Success Receipt Card */}
        {receiptSaved && lastReceipt ? (
          <div className="py-4 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-[#1A1A17]">
                {formatCurrency(lastReceipt.amountPaisa, numFormat)} জমা হয়েছে!
              </h4>
              <p className="text-xs text-[#5B574E] mt-0.5">
                কাস্টমার: <strong>{lastReceipt.partyName}</strong> • বাকি কমে হয়েছে:{' '}
                <strong className="text-[#1D5FA8]">{formatCurrency(lastReceipt.newDuePaisa, numFormat)}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between text-[#5B574E]">
                <span>আগের বাকি:</span>
                <span className="font-bold">{formatCurrency(lastReceipt.oldDuePaisa, numFormat)}</span>
              </div>
              <div className="flex justify-between text-[#1F7A4D] font-bold">
                <span>আজ আদায় (জমা):</span>
                <span>{formatCurrency(lastReceipt.amountPaisa, numFormat)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-[#1D5FA8] font-black">
                <span>বর্তমান অবশিষ্ট বাকি:</span>
                <span>{formatCurrency(lastReceipt.newDuePaisa, numFormat)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1F7A4D] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#16603B] transition touch-target"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট রসিদ</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🌾 চালের দোকান জমা রসিদ 🌾\nকাস্টমার: ${lastReceipt.partyName}\nআদায়কৃত টাকা: ৳${toBengaliDigits(lastReceipt.amountPaisa / 100)}\nনতুন অবশিষ্ট বাকি: ৳${toBengaliDigits(lastReceipt.newDuePaisa / 100)}\nধন্যবাদ!`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1B7F3B] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#16603B] transition touch-target"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp রসিদ</span>
              </a>

              <button
                onClick={handleCloseAll}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition touch-target"
              >
                সমাপ্ত
              </button>
            </div>
          </div>
        ) : (
          /* 4-Step Form */
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            
            {/* Step 1: Customer Select */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A17] mb-1">
                ১. কাস্টমার নির্বাচন করুন:
              </label>
              <select
                value={activePartyId}
                onChange={(e) => setActivePartyId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D] bg-white text-[#1A1A17]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.shopName ? `(${c.shopName})` : ''} — বাকি: ৳{(c.balancePaisa / 100).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Total Due & Aging Breakdown Card (Section 4.9) */}
            <div className="bg-[#FFF4DC] border border-[#E0A526]/50 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8A5A00]">মোট বকেয়া বাকি:</span>
                <span className="text-base font-black text-[#9A4A00] tabular-nums">
                  {formatCurrency(partyDuePaisa, numFormat)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-[#DDD9CE]">
                <div className="bg-white/80 p-1.5 rounded-lg">
                  <div className="text-slate-500">০-৭ দিন</div>
                  <div className="font-bold text-[#1F7A4D]">৳{toBengaliDigits(agingRecent)}</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg">
                  <div className="text-slate-500">৮-৩০ দিন</div>
                  <div className="font-bold text-[#E0A526]">৳{toBengaliDigits(agingMedium)}</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg">
                  <div className="text-slate-500">৩১+ দিন</div>
                  <div className="font-bold text-[#B3261E]">৳{toBengaliDigits(agingOld)}</div>
                </div>
              </div>
            </div>

            {/* Step 3: Amount Input with Preset Chips & Big Numeric Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1A1A17]">২. জমার পরিমাণ লিখুন:</label>
                <span className="text-[10px] text-slate-500">পুরোনো বিল আগে মিটবে</span>
              </div>

              {/* Quick Preset Amount Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickAmounts.map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmountTaka(String(amt))}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F4EC] text-[#1F7A4D] hover:bg-[#1F7A4D] hover:text-white transition"
                  >
                    ৳{toBengaliDigits(amt)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={amountTaka}
                  onChange={(e) => setAmountTaka(e.target.value)}
                  placeholder="০.০০"
                  className="w-full px-4 py-3 text-2xl font-black text-[#1F7A4D] text-center rounded-2xl border-2 border-slate-300 focus:border-[#1F7A4D] focus:ring-0 tabular-nums bg-white shadow-inner"
                />
              </div>

              {numAmount > partyDueTaka && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#8A5A00] bg-[#FFF4DC] p-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    টাকা বাকির চেয়ে বেশি। বাড়তি ৳{toBengaliDigits(Math.round(numAmount - partyDueTaka))} কাস্টমারের অগ্রিম হিসেবে জমা থাকবে।
                  </span>
                </div>
              )}
            </div>

            {/* Step 4: Payment Method Chips */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A17] mb-1.5">
                ৩. আদায়ের মাধ্যম:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'নগদ', icon: Banknote },
                  { id: 'bkash', label: 'বিকাশ', icon: Smartphone },
                  { id: 'nagad', label: 'নগদ ওয়ালেট', icon: Smartphone },
                  { id: 'bank', label: 'ব্যাংক', icon: Building2 },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 touch-target ${
                        isSel
                          ? 'border-[#1F7A4D] bg-[#E8F4EC] text-[#1F7A4D] font-extrabold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button (Section 4.9: 56px touch target "জমা নিন") */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={numAmount <= 0}
                className="w-full h-14 bg-[#1F7A4D] hover:bg-[#16603B] disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-lg transition touch-target-pos flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>৳{toBengaliDigits(numAmount || 0)} টাকা জমা নিন</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
