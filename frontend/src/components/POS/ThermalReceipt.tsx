import React, { useState } from 'react';
import { SaleInvoice, TenantInfo, Language, NumberFormat } from '../../types';
import { formatCurrency, formatWeight, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { Printer, Download, Share2, X, Check, Copy } from 'lucide-react';

interface ThermalReceiptProps {
  invoice: SaleInvoice;
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
  partyBalancePaisa?: number;
  isReprint?: boolean;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  invoice,
  tenant,
  lang: initialLang,
  numFormat,
  partyBalancePaisa,
  isReprint = false,
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal58' | 'thermal80' | 'a4'>('thermal80');
  const [receiptLang, setReceiptLang] = useState<Language>(initialLang);
  const [copied, setCopied] = useState(false);

  const isBn = receiptLang === 'bn';

  // Calculate party balances if customer is registered party
  const hasParty = partyBalancePaisa !== undefined && invoice.clientType !== 'walkin';
  const currentTotalDuePaisa = partyBalancePaisa ?? invoice.dueAmountPaisa;
  const previousDuePaisa = Math.max(0, currentTotalDuePaisa - invoice.dueAmountPaisa);

  // Generate plain text memo for WhatsApp and Clipboard
  const generateMemoText = () => {
    const formattedDate = formatDateBangla(invoice.date);
    let text = `🌾 *${tenant.shopNameBn}*\n` +
      `চালান নং: ${invoice.docNo}${isReprint ? ' (ডুপ্লিকেট কপি)' : ''}\n` +
      `তারিখ: ${formattedDate}\n` +
      `ক্রেতা: ${invoice.clientName || 'খুচরা গ্রাহক'}\n` +
      (invoice.clientPhone ? `মোবাইল: ${invoice.clientPhone}\n` : '') +
      `--------------------------\n` +
      invoice.items
        .map(
          (it) =>
            `• ${it.product.nameBn} (${toBengaliDigits(it.unitQuantity)} ${it.selectedUnit.nameBn} / ${toBengaliDigits(it.totalKg)} কেজি) = ${formatCurrency(it.lineTotalPaisa, numFormat)}`
        )
        .join('\n') +
      `\n--------------------------\n` +
      `মোট বিল: ${formatCurrency(invoice.grandTotalPaisa, numFormat)}\n` +
      `পরিশোধ: ${formatCurrency(invoice.paidTotalPaisa, numFormat)}\n` +
      (invoice.dueAmountPaisa > 0
        ? `*এই চালানের বাকি: ${formatCurrency(invoice.dueAmountPaisa, numFormat)}*\n`
        : '');

    if (hasParty && previousDuePaisa > 0) {
      text += `পূর্বের বাকি: ${formatCurrency(previousDuePaisa, numFormat)}\n`;
      text += `*সর্বমোট বকেয়া জের: ${formatCurrency(currentTotalDuePaisa, numFormat)}*\n`;
    }

    text += `--------------------------\n` +
      `ঠিকানা: ${tenant.address}\nমোবাইল: ${tenant.phone}\nধন্যবাদ, আবার আসবেন!`;

    return text;
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print execution failed:', err);
      alert('প্রিন্ট কমান্ড সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে ব্রাউজার সেটিংস বা প্রিন্টার কানেকশন পরীক্ষা করুন।');
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateMemoText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const rawPhone = invoice.clientPhone?.replace(/[^0-9]/g, '') || '';
    const formattedPhone = rawPhone.startsWith('880')
      ? rawPhone
      : rawPhone.startsWith('0')
      ? `88${rawPhone}`
      : rawPhone
      ? `880${rawPhone}`
      : '';

    const text = generateMemoText();
    const waUrl = formattedPhone.length >= 10
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="print:hidden p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs sm:text-sm">রসিদ সাইজ:</span>
            
            {/* Format Selector: 58mm, 80mm, A4 */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'thermal58' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                ৫৮ মিমি
              </button>
              <button
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'thermal80' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                ৮০ মিমি
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'a4' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                A4 ইনভয়েস
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switch */}
            <button
              onClick={() => setReceiptLang(isBn ? 'en' : 'bn')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-emerald-400"
            >
              {isBn ? 'English' : 'বাংলা'}
            </button>

            {/* Copy Memo Text Fallback */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="রসিদের টেক্সট কপি করুন"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg shadow-sm transition"
              title="হোয়াটসঅ্যাপে চালান শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/60 flex justify-center">
          
          <div
            id="printable-area"
            className={`bg-white shadow-md border border-slate-200 transition-all text-slate-900 font-mono format-${printFormat} ${
              printFormat === 'thermal58'
                ? 'w-[270px] p-2.5 text-[10px] leading-tight'
                : printFormat === 'thermal80'
                ? 'w-[375px] p-4 text-xs leading-normal'
                : 'w-full max-w-[560px] p-6 text-sm font-sans'
            }`}
          >
            
            {/* Reprint Watermark / Badge */}
            {isReprint && (
              <div className="text-center pb-2 border-b border-dashed border-slate-400 mb-2">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 border border-slate-800 rounded text-slate-900">
                  {isBn ? '★ ডুপ্লিকেট কপি / পুনরায় মুদ্রিত ★' : '★ DUPLICATE COPY / REPRINT ★'}
                </span>
              </div>
            )}

            {/* Header: Shop Info */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <div className="font-extrabold text-base leading-tight">
                {isBn ? tenant.shopNameBn : tenant.shopNameEn}
              </div>
              <div className="text-[11px] text-slate-700 font-sans mt-0.5">
                {tenant.address}
              </div>
              <div className="text-[11px] font-sans font-medium">
                {isBn ? 'মোবাইল:' : 'Phone:'} {tenant.phone}
              </div>
              <div className="text-[10px] text-slate-600 font-sans mt-0.5">
                {isBn ? 'প্রোপ্রাইটর:' : 'Proprietor:'} {tenant.proprietor}
              </div>
            </div>

            {/* Invoice & Client Info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>{isBn ? 'ইনভয়েস নং:' : 'Invoice No:'}</span>
                <span className="font-bold">{invoice.docNo}</span>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
                <span>{formatDateBangla(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'ক্রেতা / মেসার্স:' : 'Customer:'}</span>
                <span className="font-bold">{invoice.clientName || (isBn ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}</span>
              </div>
              {invoice.clientPhone && (
                <div className="flex justify-between text-slate-700">
                  <span>{isBn ? 'ফোন:' : 'Phone:'}</span>
                  <span>{invoice.clientPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 font-bold pb-1 text-[11px] border-b border-slate-200">
                <span className={printFormat === 'thermal58' ? 'col-span-5' : 'col-span-6'}>
                  {isBn ? 'চালের বিবরণ' : 'Item'}
                </span>
                <span className={`text-right ${printFormat === 'thermal58' ? 'col-span-3' : 'col-span-3'}`}>
                  {isBn ? 'পরিমাণ' : 'Qty'}
                </span>
                <span className={`text-right ${printFormat === 'thermal58' ? 'col-span-4' : 'col-span-3'}`}>
                  {isBn ? 'মোট' : 'Total'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1.5">
                {invoice.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 text-[11px] leading-tight items-start">
                    <div className={printFormat === 'thermal58' ? 'col-span-5' : 'col-span-6'}>
                      <div className="font-semibold">{isBn ? item.product.nameBn : item.product.nameEn}</div>
                      <div className="text-[10px] text-slate-600">
                        @{formatCurrency(item.unitPricePaisa, numFormat)} / {item.selectedUnit.nameBn}
                      </div>
                    </div>
                    <div className={`text-right ${printFormat === 'thermal58' ? 'col-span-3' : 'col-span-3'}`}>
                      <div>{numFormat === 'bn' ? toBengaliDigits(item.unitQuantity) : item.unitQuantity} {item.selectedUnit.nameBn}</div>
                      <div className="text-[9.5px] text-slate-600">({toBengaliDigits(item.totalKg)} কেজি)</div>
                    </div>
                    <div className={`text-right font-bold ${printFormat === 'thermal58' ? 'col-span-4' : 'col-span-3'}`}>
                      {formatCurrency(item.lineTotalPaisa, numFormat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>{isBn ? 'মোট চালের ওজন:' : 'Total Weight:'}</span>
                <span className="font-bold">{formatWeight(invoice.totalKg, numFormat, receiptLang)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'উপমোট বিল:' : 'Subtotal:'}</span>
                <span>{formatCurrency(invoice.subtotalPaisa, numFormat)}</span>
              </div>
              {invoice.discountPaisa > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{isBn ? 'বিশেষ ছাড়:' : 'Discount:'}</span>
                  <span>- {formatCurrency(invoice.discountPaisa, numFormat)}</span>
                </div>
              )}
              {invoice.deliveryChargePaisa > 0 && (
                <div className="flex justify-between">
                  <span>{isBn ? 'গাড়িভাড়া / ডেলিভারি:' : 'Delivery / Labour:'}</span>
                  <span>+ {formatCurrency(invoice.deliveryChargePaisa, numFormat)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-1 text-slate-950">
                <span>{isBn ? 'সর্বমোট প্রদেয় বিল:' : 'Grand Total:'}</span>
                <span>{formatCurrency(invoice.grandTotalPaisa, numFormat)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>{isBn ? 'জমা / পরিশোধ:' : 'Paid Amount:'}</span>
                <span>{formatCurrency(invoice.paidTotalPaisa, numFormat)}</span>
              </div>
              {invoice.dueAmountPaisa > 0 && (
                <div className="flex justify-between font-bold text-amber-800 bg-amber-50 p-1 rounded">
                  <span>{isBn ? 'এই চালানের বাকি:' : 'This Invoice Due:'}</span>
                  <span>{formatCurrency(invoice.dueAmountPaisa, numFormat)}</span>
                </div>
              )}
            </div>

            {/* Party Ledger Summary (Previous Due + Current Total Outstanding) */}
            {hasParty && (
              <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1 bg-slate-50/80 p-1.5 rounded my-1">
                <div className="font-bold text-[10px] text-slate-700 uppercase tracking-wide">
                  {isBn ? 'পার্টির সামগ্রিক খতিয়ান হিসাব:' : 'Party Outstanding Ledger:'}
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{isBn ? 'পূর্বের বকেয়া বাকি:' : 'Previous Due Balance:'}</span>
                  <span className="font-semibold">{formatCurrency(previousDuePaisa, numFormat)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{isBn ? 'বর্তমান চালানের বাকি:' : 'Current Invoice Due:'}</span>
                  <span className="font-semibold">{formatCurrency(invoice.dueAmountPaisa, numFormat)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-950 border-t border-slate-200 pt-0.5">
                  <span>{isBn ? 'সর্বমোট অবশিষ্ট জের:' : 'Total Outstanding Balance:'}</span>
                  <span className="text-amber-900">{formatCurrency(currentTotalDuePaisa, numFormat)}</span>
                </div>
              </div>
            )}

            {/* Payment Method Details */}
            <div className="py-1 text-[10px] text-slate-600">
              {invoice.payments.map((p, idx) => (
                <span key={idx} className="mr-2">
                  • {p.method === 'cash' ? (isBn ? 'নগদ' : 'Cash') : p.method.toUpperCase()}: {formatCurrency(p.amountPaisa, numFormat)}
                </span>
              ))}
            </div>

            {/* Footer Blessing & Sign */}
            <div className="text-center pt-3 text-[11px] font-sans space-y-1">
              <div className="font-medium text-slate-800">
                {isBn ? 'আমাদের পণ্য ক্রয়ের জন্য আন্তরিক ধন্যবাদ।' : 'Thank you for your business!'}
              </div>
              <div className="text-[10px] text-slate-500">
                সফটওয়্যার: চালের দোকান • হেল্পলাইন: 01629404625
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
