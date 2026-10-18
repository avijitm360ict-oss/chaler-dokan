import React, { useState } from 'react';
import { RiceProduct, TenantInfo, Language, NumberFormat } from '../../types';
import { formatCurrency, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { Printer, MessageCircle, Share2, X, Check, TrendingUp, Sparkles, Building } from 'lucide-react';

interface RateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: RiceProduct[];
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
}

export const RateCardModal: React.FC<RateCardModalProps> = ({
  isOpen,
  onClose,
  products,
  tenant,
  lang,
  numFormat
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    products.slice(0, 6).map((p) => p.id)
  );

  if (!isOpen) return null;

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppText = () => {
    const today = new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
    let text = `🌾 *${tenant.shopNameBn}* 🌾\n📅 *আজকের চালের বাজারদর (${today})*\n\n`;
    selectedProducts.forEach((p, idx) => {
      const retail = (p.retailPricePaisa / 100).toFixed(0);
      const sack50 = (p.sack50RetailPricePaisa / 100).toFixed(0);
      text += `${idx + 1}. *${p.nameBn}*\n   • কেজি দর: ৳${toBengaliDigits(retail)} / কেজি\n   • ৫০ কেজি বস্তা: ৳${toBengaliDigits(sack50)}\n\n`;
    });
    text += `📍 ${tenant.address}\n📞 অর্ডার ও ডেলিভারি: ${tenant.phone}\n_বাজারদর পরিবর্তনশীল_`;
    return encodeURIComponent(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-modal border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFF4DC] text-[#8A5A00] rounded-xl">
              <Sparkles className="w-5 h-5 text-[#E0A526]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'আজকের রেট কার্ড (C4 & Z1)' : 'Daily Rice Rate Card'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'হোয়াটসঅ্যাপে কাস্টমারদের পাঠানো বা দোকানে প্রিন্ট টাঙানোর জন্য' : 'Share via WhatsApp or print for shop counter'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product selector filter chips */}
        <div className="py-2.5">
          <span className="text-[11px] font-bold text-[#1A1A17] block mb-1.5">
            {lang === 'bn' ? 'রেট কার্ডে কোন কোন চাল রাখবেন?' : 'Select rice varieties for rate card:'}
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {products.map((p) => {
              const isSelected = selectedProductIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-[#1F7A4D] text-white'
                      : 'bg-[#F6F5F1] text-[#5B574E] hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{p.variety}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable & Shareable Graphic Card Preview */}
        <div className="flex-1 overflow-y-auto my-2 p-1">
          <div
            id="printable-area"
            className="bg-linear-to-b from-amber-50/50 via-white to-emerald-50/40 rounded-2xl p-5 border-2 border-[#E0A526] shadow-sm space-y-4"
          >
            {/* Card Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-[#DDD9CE]">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#1F7A4D] text-white text-[10px] font-bold mb-1">
                🌾 {lang === 'bn' ? 'দৈনিক পাইকারি ও খুচরা বাজারদর' : 'Daily Rice Rate Card'} 🌾
              </div>
              <h2 className="text-xl font-black text-[#1A1A17] tracking-tight">
                {lang === 'bn' ? tenant.shopNameBn : tenant.shopNameEn}
              </h2>
              <p className="text-xs text-[#5B574E]">{tenant.address} • ফোন: {tenant.phone}</p>
              <div className="inline-block mt-1 px-2.5 py-0.5 bg-[#FFF4DC] border border-[#E0A526]/50 rounded-md text-[11px] font-bold text-[#8A5A00]">
                তারিখ: {formatDateBangla(new Date().toISOString())}
              </div>
            </div>

            {/* Price Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1F7A4D] text-white font-bold">
                  <th className="py-2 px-3 rounded-l-lg">চালের নাম ও ভ্যারাইটি</th>
                  <th className="py-2 px-3 text-center">খুচরা (কেজি)</th>
                  <th className="py-2 px-3 text-center">পাইকারি (কেজি)</th>
                  <th className="py-2 px-3 text-right rounded-r-lg">৫০ কেজি বস্তা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1A1A17]">{p.nameBn}</div>
                      <div className="text-[10px] text-[#5B574E]">{p.grade} • {p.category}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#1F7A4D] tabular-nums">
                      {formatCurrency(p.retailPricePaisa, numFormat)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[#8A5A00] tabular-nums">
                      {formatCurrency(p.wholesalePricePaisa, numFormat)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#1A1A17] tabular-nums">
                      {formatCurrency(p.sack50RetailPricePaisa, numFormat)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card Footer */}
            <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-[#5B574E] flex items-center justify-between">
              <span>* বাজারদর যেকোনো সময় পরিবর্তন হতে পারে</span>
              <span className="font-bold text-[#1F7A4D]">স্বত্বাধিকারী: {tenant.proprietor}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-[#5B574E]">
            {selectedProducts.length} টি চাল নির্বাচিত
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${generateWhatsAppText()}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1B7F3B] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl shadow-md transition touch-target"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Share WhatsApp'}</span>
            </a>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1F7A4D] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl shadow-md transition touch-target"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রিন্ট করুন' : 'Print Card'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
