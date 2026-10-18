import React, { useState } from 'react';
import { AuditLogEntry, Language, NumberFormat } from '../../types';
import { formatDateBangla } from '../../utils/formatters';
import { ShieldAlert, Search, X, History, User, Calendar } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  lang: Language;
  numFormat: NumberFormat;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  lang,
  numFormat
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-modal border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFF4DC] text-[#8A5A00] rounded-xl">
              <History className="w-5 h-5 text-[#E0A526]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'অডিট লগ ও পরিবর্তন হিস্ট্রি (G3)' : 'Audit Trail & Change Logs'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'দোকানের কে, কখন, কী তথ্য পরিবর্তন করেছেন তার স্থায়ী রেকর্ড' : 'Append-only audit trail of price changes, voided bills and day locks'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কর্মচারীর নাম বা কাজের বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1F7A4D] bg-white"
            />
          </div>
        </div>

        {/* Audit list */}
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F4EC] text-[#1F7A4D]">
                    {log.action}
                  </span>
                  <span className="text-xs font-bold text-[#1A1A17]">{log.userName}</span>
                  <span className="text-[10px] text-slate-400">({log.userRole})</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {formatDateBangla(log.timestamp)}
                </span>
              </div>

              <p className="text-xs text-[#5B574E] leading-relaxed">{log.details}</p>

              {(log.oldValue || log.newValue) && (
                <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-slate-200/60">
                  {log.oldValue && (
                    <span className="text-[#B3261E] line-through">
                      আগে: {log.oldValue}
                    </span>
                  )}
                  {log.newValue && (
                    <span className="text-[#1F7A4D] font-bold">
                      পরে: {log.newValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
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
