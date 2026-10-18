import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Language } from '../../types';

interface KeyboardShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const KeyboardShortcutModal: React.FC<KeyboardShortcutModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '/', descBn: 'চালের নাম / ভ্যারাইটি সার্চ ঘরে ফোকাস', descEn: 'Focus search input' },
    { key: 'Enter', descBn: 'প্রথম ফিল্টার্ড চাল কার্টে যোগ করুন', descEn: 'Add selected rice to cart' },
    { key: 'F2', descBn: 'পেমেন্ট ও চেকআউট শিট খুলুন', descEn: 'Open payment / checkout' },
    { key: 'F4', descBn: 'বর্তমান কার্ট হোল্ডে রাখুন (পরের কাস্টমারের জন্য)', descEn: 'Hold current cart order' },
    { key: 'Esc', descBn: 'খোলা মোডাল বা ড্রয়ার বন্ধ করুন', descEn: 'Close active modal or drawer' },
    { key: '?', descBn: 'এই কীবোর্ড শর্টকাট তালিকা দেখুন', descEn: 'Show keyboard shortcuts' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal border border-slate-200 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'কীবোর্ড শর্টকাট তালিকা' : 'Keyboard Shortcuts'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'মাউস ছাড়া দ্রুত চাল বিক্রির হট-কী' : 'Lightning-fast counter shortcuts'}
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

        <div className="space-y-2.5">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F5F1] border border-slate-200/80"
            >
              <span className="text-xs font-medium text-[#1A1A17]">
                {lang === 'bn' ? sc.descBn : sc.descEn}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-[#1F7A4D] border border-slate-300 rounded-lg shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1F7A4D] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl shadow-md transition touch-target"
          >
            {lang === 'bn' ? 'বুঝেছি, বন্ধ করুন' : 'Got it'}
          </button>
        </div>

      </div>
    </div>
  );
};
