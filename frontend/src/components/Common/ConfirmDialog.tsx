import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Language } from '../../types';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionName: string; // e.g. "বাতিল করুন"
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  defaultReason?: string;
  lang: Language;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  actionName,
  danger = true,
  requireReason = true,
  reasonLabel,
  defaultReason = '',
  lang,
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      setError(lang === 'bn' ? 'দয়া করে একটি সুনির্দিষ্ট কারণ উল্লেখ করুন' : 'Please provide a reason');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-3 rounded-xl shrink-0 ${danger ? 'bg-[#FDECEA] text-[#B3261E]' : 'bg-[#FFF4DC] text-[#8A5A00]'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#1A1A17]">{title}</h3>
            <p className="text-xs text-[#5B574E] mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requireReason && (
            <div>
              <label className="block text-xs font-semibold text-[#1A1A17] mb-1">
                {reasonLabel || (lang === 'bn' ? 'কার্যক্রমের কারণ (বাধ্যতামূলক):' : 'Reason for action (Required):')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                rows={2}
                placeholder={lang === 'bn' ? 'যেমন: কাস্টমার ভুল চাল নিয়েছিলেন বা অর্ডার বাতিল করেছেন' : 'Enter specific reason...'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D] bg-white text-[#1A1A17]"
              />
              {error && <p className="text-[11px] text-[#B3261E] mt-1 font-medium">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            {/* Safe cancel button on safe side */}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-[#5B574E] hover:text-[#1A1A17] bg-slate-100 hover:bg-slate-200 rounded-xl transition touch-target"
            >
              {lang === 'bn' ? 'না, বাদ দিন' : 'Cancel'}
            </button>

            {/* Named Action Button (e.g. "বাতিল করুন") */}
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition touch-target ${
                danger
                  ? 'bg-[#B3261E] hover:bg-[#8e1f18]'
                  : 'bg-[#1F7A4D] hover:bg-[#16603B]'
              }`}
            >
              {actionName}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
