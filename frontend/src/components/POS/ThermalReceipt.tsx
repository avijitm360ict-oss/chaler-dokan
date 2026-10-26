import React, { useState } from 'react';
import { SaleInvoice, TenantInfo, Language, NumberFormat } from '../../types';
import { formatCurrency, formatWeight, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { Printer, Download, Share2, X, Check } from 'lucide-react';

interface ThermalReceiptProps {
  invoice: SaleInvoice;
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  invoice,
  tenant,
  lang: initialLang,
  numFormat,
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal58' | 'thermal80' | 'a4'>('thermal80');
  const [receiptLang, setReceiptLang] = useState<Language>(initialLang);

  const handlePrint = () => {
    window.print();
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

    const text = `🌾 *${tenant.shopNameBn}*\n` +
      `চালান নং: ${invoice.docNo}\n` +
      `তারিখ: ${invoice.date}\n` +
      `ক্রেতা: ${invoice.clientName || 'খুচরা গ্রাহক'}\n` +
      `--------------------------\n` +
      invoice.items
        .map(
          (it) =>
            `• ${it.product.nameBn} (${it.unitQuantity} ${it.selectedUnit.nameBn}) = ৳${(it.lineTotalPaisa / 100).toLocaleString('bn-BD')}`
        )
        .join('\n') +
      `\n--------------------------\n` +
      `মোট বিল: ৳${(invoice.grandTotalPaisa / 100).toLocaleString('bn-BD')}\n` +
      `পরিশোধ: ৳${(invoice.paidTotalPaisa / 100).toLocaleString('bn-BD')}\n` +
      (invoice.dueAmountPaisa > 0
        ? `*বকেয়া বাকি: ৳${(invoice.dueAmountPaisa / 100).toLocaleString('bn-BD')}*\n`
        : '') +
      `--------------------------\n` +
      `ঠিকানা: ${tenant.address}\nমোবাইল: ${tenant.phone}\nধন্যবাদ, আবার আসবেন!`;

    const waUrl = formattedPhone.length >= 10
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  const isBn = receiptLang === 'bn';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="print:hidden p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm">ইনভয়েস প্রিন্ট প্রিভিউ:</span>
            
            {/* Format Selector: 58mm, 80mm, A4 */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'thermal58' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ৫৮ মিমি
              </button>
              <button
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'thermal80' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ৮০ মিমি
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition ${
                  printFormat === 'a4' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
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
              {isBn ? 'In English' : 'বাংলায় দেখুন'}
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg shadow-sm transition"
              title="হোয়াটসঅ্যাপে চালান শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 flex justify-center">
          
          <div
            id="printable-area"
            className={`bg-white shadow-md border border-slate-200 transition-all text-slate-900 font-mono ${
              printFormat === 'thermal58'
                ? 'w-[280px] p-3 text-[11px]'
                : printFormat === 'thermal80'
                ? 'w-[380px] p-4 text-xs'
                : 'w-full max-w-[560px] p-6 text-sm font-sans'
            }`}
          >
            
            {/* Header: Shop Info */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <div className="font-extrabold text-base leading-tight">
                {isBn ? tenant.shopNameBn : tenant.shopNameEn}
              </div>
              <div className="text-[11px] text-slate-600 font-sans mt-0.5">
                {tenant.address}
              </div>
              <div className="text-[11px] font-sans">
                {isBn ? 'মোবাইল:' : 'Phone:'} {tenant.phone}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-1">
                প্রোপ্রাইটর: {tenant.proprietor}
              </div>
            </div>

            {/* Invoice & Client Info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>{isBn ? 'ইনভয়েস নং:' : 'Invoice No:'}</span>
                <span className="font-bold">{invoice.docNo}</span>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'তারিখ ও সময়:' : 'Date:'}</span>
                <span>{formatDateBangla(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'ক্রেতা / মেসার্স:' : 'Customer:'}</span>
                <span className="font-bold">{invoice.clientName}</span>
              </div>
              {invoice.clientPhone && (
                <div className="flex justify-between text-slate-500">
                  <span>{isBn ? 'ফোন:' : 'Phone:'}</span>
                  <span>{invoice.clientPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 font-bold pb-1 text-[11px] border-b border-slate-200">
                <span className="col-span-6">{isBn ? 'চালের বিবরণ' : 'Item'}</span>
                <span className="col-span-3 text-right">{isBn ? 'পরিমাণ' : 'Qty'}</span>
                <span className="col-span-3 text-right">{isBn ? 'মোট' : 'Total'}</span>
              </div>

              <div className="space-y-1.5 pt-1.5">
                {invoice.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 text-[11px] leading-tight">
                    <div className="col-span-6">
                      <div className="font-semibold">{isBn ? item.product.nameBn : item.product.nameEn}</div>
                      <div className="text-[10px] text-slate-500">
                        @{formatCurrency(item.unitPricePaisa, numFormat)} / {item.selectedUnit.nameBn}
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      {numFormat === 'bn' ? toBengaliDigits(item.unitQuantity) : item.unitQuantity} {item.selectedUnit.nameBn}
                      <div className="text-[10px] text-slate-500">({item.totalKg} কেজি)</div>
                    </div>
                    <div className="col-span-3 text-right font-bold">
                      {formatCurrency(item.lineTotalPaisa, numFormat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>{isBn ? 'মোট ওজন:' : 'Total Weight:'}</span>
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
                  <span>{isBn ? 'গাড়িভাড়া / ডেলিভারি:' : 'Delivery:'}</span>
                  <span>+ {formatCurrency(invoice.deliveryChargePaisa, numFormat)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-1 text-slate-950">
                <span>{isBn ? 'সর্বমোট প্রদেয় বিল:' : 'Grand Total:'}</span>
                <span>{formatCurrency(invoice.grandTotalPaisa, numFormat)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>{isBn ? 'জমা / পরিশোধ:' : 'Paid Amount:'}</span>
                <span>{formatCurrency(invoice.paidTotalPaisa, numFormat)}</span>
              </div>
              {invoice.dueAmountPaisa > 0 && (
                <div className="flex justify-between font-bold text-amber-700 bg-amber-50 p-1 rounded">
                  <span>{isBn ? 'অবশিষ্ট বকেয়া বাকি:' : 'Due Amount:'}</span>
                  <span>{formatCurrency(invoice.dueAmountPaisa, numFormat)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Details */}
            <div className="py-1 text-[10px] text-slate-500">
              {invoice.payments.map((p, idx) => (
                <span key={idx} className="mr-2">
                  • {p.method === 'cash' ? 'নগদ' : p.method.toUpperCase()}: {formatCurrency(p.amountPaisa, numFormat)}
                </span>
              ))}
            </div>

            {/* Footer Blessing & Sign */}
            <div className="text-center pt-3 text-[11px] font-sans space-y-1">
              <div className="font-medium text-slate-700">
                {isBn ? 'আমাদের পণ্য ব্যবহারের জন্য আন্তরিক ধন্যবাদ।' : 'Thank you for your business!'}
              </div>
              <div className="text-[10px] text-slate-400">
                সফটওয়্যার: চালের দোকান • সাপোর্ট: 01629404625 • Dev by Avijit Saha
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
