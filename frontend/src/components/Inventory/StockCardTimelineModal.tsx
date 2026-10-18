import React from 'react';
import { RiceProduct, StockMovement, Language, NumberFormat } from '../../types';
import { formatWeight, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import { Clock, Truck, ShoppingCart, Sliders, ArrowRightLeft, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockCardTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: RiceProduct | null;
  movements: StockMovement[];
  lang: Language;
  numFormat: NumberFormat;
}

export const StockCardTimelineModal: React.FC<StockCardTimelineModalProps> = ({
  isOpen,
  onClose,
  product,
  movements,
  lang,
  numFormat
}) => {
  if (!isOpen || !product) return null;

  const productMovements = movements.filter((m) => m.productId === product.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-modal border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {product.nameBn} — {lang === 'bn' ? 'স্টক কার্ড ও টাইমলাইন (K1)' : 'Stock Card Timeline'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                বর্তমান মজুদ: <strong className="text-[#1F7A4D]">{formatWeight(product.stockKg, numFormat, lang)}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline list */}
        <div className="py-4 space-y-3 flex-1 overflow-y-auto">
          {productMovements.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              এই চালের এখনও কোনো মুভমেন্ট হিস্ট্রি নেই
            </div>
          ) : (
            productMovements.map((m) => {
              const isInbound = m.diffKg > 0;
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isInbound ? 'bg-[#E8F4EC] text-[#1F7A4D]' : 'bg-[#FFF4DC] text-[#8A5A00]'
                    }`}>
                      {m.type === 'purchase' && <Truck className="w-4 h-4" />}
                      {m.type === 'sale' && <ShoppingCart className="w-4 h-4" />}
                      {m.type === 'adjustment' && <Sliders className="w-4 h-4" />}
                      {m.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#1A1A17]">
                        {m.type === 'purchase' && 'ট্রাক থেকে ক্রয় আনলোড'}
                        {m.type === 'sale' && 'কাউন্টার বিক্রি'}
                        {m.type === 'adjustment' && 'স্টক এডজাস্টমেন্ট (কমতি/বাড়তি)'}
                        {m.type === 'transfer' && 'গোডাউন ট্রান্সফার'}
                      </div>
                      <div className="text-[11px] text-[#5B574E] mt-0.5">
                        {m.warehouseName} • {formatDateBangla(m.date)}
                      </div>
                      {m.reason && (
                        <div className="text-[10px] text-[#8A5A00] font-medium mt-1 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                          কারণ: {m.reason}
                        </div>
                      )}
                      {m.referenceDocNo && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          রেফারেন্স: {m.referenceDocNo} • এন্ট্রি: {m.user}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black tabular-nums ${
                      isInbound ? 'text-[#1F7A4D]' : 'text-[#B3261E]'
                    }`}>
                      {isInbound ? `+${toBengaliDigits(m.diffKg)}` : toBengaliDigits(m.diffKg)} কেজি
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      অবশিষ্ট: {toBengaliDigits(m.resultingStockKg)} কেজি
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1F7A4D] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl transition touch-target"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
