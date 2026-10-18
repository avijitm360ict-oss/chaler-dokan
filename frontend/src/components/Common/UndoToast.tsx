import React, { useEffect } from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';
import { Language } from '../../types';

export interface ToastMessage {
  id: string;
  message: string;
  undoAction?: () => void;
  undoText?: string;
  type?: 'success' | 'info' | 'warning' | 'danger';
}

interface UndoToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  lang: Language;
}

export const UndoToast: React.FC<UndoToastProps> = ({ toast, onClose, lang }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500); // 4.5 seconds
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-[#1A1A17] text-white rounded-2xl shadow-sheet border border-slate-700 max-w-md animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2 className="w-5 h-5 text-[#27965F] shrink-0" />
        <span className="text-sm font-medium text-white truncate">{toast.message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {toast.undoAction && (
          <button
            onClick={() => {
              toast.undoAction?.();
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#E0A526] hover:text-[#FFF4DC] bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{toast.undoText || (lang === 'bn' ? 'ফিরিয়ে আনুন' : 'Undo')}</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
