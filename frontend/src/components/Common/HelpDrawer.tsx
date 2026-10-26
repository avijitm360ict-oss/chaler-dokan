import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Phone, BookOpen, ExternalLink, X, Sparkles, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const HelpDrawer: React.FC<HelpDrawerProps> = ({ isOpen, onClose, lang }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const faqs = [
    {
      qBn: 'কাউন্টারে দ্রুত ২০ সেকেন্ডে বিক্রি কীভাবে করব?',
      qEn: 'How to make a quick 20-second POS sale?',
      aBn: 'POS স্ক্রিনে গিয়ে চালের কার্ডে ট্যাপ করুন, ৫০ কেজি বস্তা বা কেজি নির্বাচন করে দ্রুত "পেমেন্ট" বাটনে ট্যাপ করুন এবং "সম্পূর্ণ" চাপুন। রসিদ স্বয়ংক্রিয় প্রিন্ট ও স্টক আপডেট হবে।',
      aEn: 'Tap any rice card in POS, pick sack or kg, tap "Payment" and confirm. Instant receipt prints and stock deducts in real-time.'
    },
    {
      qBn: 'ট্রাক এলে গাড়ীভাড়া ও লেবার খরচসহ আসল কেনা-দাম কীভাবে হিসাব করব?',
      qEn: 'How does Landed Cost per KG work when trucks arrive?',
      aBn: 'ক্রয় (Purchase) ফর্মে চালের মূল রেটের সাথে "আরও অপশন" খুলে ট্রাকভাড়া ও লেবার খরচ লিখুন। সিস্টেম স্বয়ংক্রিয়ভাবে প্রতি কেজিতে আসল Landed Cost ও WAC গড় খরচ বের করে দেবে।',
      aEn: 'In Purchase form, expand "More Options" and enter truck and unloading labour. System calculates true landed cost and updates inventory WAC automatically.'
    },
    {
      qBn: 'রোদে শুকিয়ে চালের ওজন কমে গেলে (Moisture Loss) কী করব?',
      qEn: 'How to handle weight loss from drying / moisture loss?',
      aBn: 'স্টক স্ক্রিনে গিয়ে "এডজাস্টমেন্ট" চাপুন। চাল নির্বাচন করে মাইনাস কেজি ও কারণ হিসেবে "রোদে শুকিয়ে ওজন হ্রাস" সিলেক্ট করুন।',
      aEn: 'In Stock Management, tap "Adjust Stock", select the rice variety, enter negative kg diff and pick "Moisture loss".'
    },
    {
      qBn: 'দিনের শেষে ক্যাশ মিলানো ও ডে-ক্লোজ কীভাবে করব?',
      qEn: 'How to perform end-of-day cash reconciliation?',
      aBn: 'ক্যাশ বুক স্ক্রিনে গিয়ে ড্রয়ারে গোনা টাকা লিখুন। সিস্টেম ক্যাশ ও আপনার গোনা ক্যাশের পার্থক্য সবুজ "মিলেছে" দেখালে "ডে ক্লোজ" করে লক করুন।',
      aEn: 'Under Cash Book, type physical drawer cash. Once difference is zero, lock the register.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-sheet flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#F6F5F1]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1F7A4D] text-white flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'সাহায্য ও সাপোর্ট কেন্দ্র' : 'Help & Live Support'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'চালের দোকান SaaS হেল্পলাইন ২৪/৭' : '24/7 Dedicated Rice Merchant Hotline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          
          {/* Direct WhatsApp Callout Card */}
          <div className="bg-linear-to-br from-[#E8F4EC] to-[#DCFCE7] border border-[#1F7A4D]/30 rounded-2xl p-4.5 text-[#1A1A17] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#1F7A4D] text-white rounded-lg">
                <MessageCircle className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-sm text-[#16603B]">
                {lang === 'bn' ? 'সরাসরি হোয়াটসঅ্যাপে কথা বলুন' : 'Instant WhatsApp Help'}
              </h4>
            </div>
            <p className="text-xs text-[#5B574E] leading-relaxed">
              {lang === 'bn' 
                ? 'সফটওয়্যারের যেকোনো সমস্যা, নতুন গোডাউন তৈরি বা প্রিন্টার সংযোগে সহায়তার জন্য আমাদের চালের আড়ত বিশেষজ্ঞকে মেসেজ দিন।'
                : 'Message our technical team directly on WhatsApp for live setup assistance, printer config or data queries.'}
            </p>
            <a
              href="https://wa.me/8801629404625?text=%E0%A6%9A%E0%A6%BE%E0%A6%B2%E0%A7%87%E0%A6%B0%20%E0%A6%A6%E0%A7%8B%E0%A6%95%E0%A6%BE%E0%A6%A8%20%E0%A6%B8%E0%A6%BE%E0%A6%AA%E0%A7%8B%E0%A6%B0%E0%A7%8D%E0%A6%9F%20%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%9F%E0%A7%8B%E0%A6%9C%E0%A6%A8"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1F7A4D] hover:bg-[#16603B] text-white rounded-xl font-bold text-xs shadow-md transition touch-target"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে মেসেজ দিন (০১৬২৯৪০৪৬২৫)' : 'Open WhatsApp Support'}</span>
            </a>
          </div>

          {/* Emergency Phone Hotline */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#E0A526]" />
              <div>
                <div className="text-xs font-bold text-[#1A1A17]">01629404625</div>
                <div className="text-[10px] text-[#5B574E]">{lang === 'bn' ? 'সকাল ১০:০০ - সন্ধ্যা ০৬:০০' : '10:00 AM – 06:00 PM'}</div>
              </div>
            </div>
            <a
              href="tel:01629404625"
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-[#1F7A4D] hover:bg-slate-100"
            >
              {lang === 'bn' ? 'কল করুন' : 'Call'}
            </a>
          </div>

          {/* Email Support Card */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span>📧 ইমেইল সাপোর্ট:</span>
              <a href="mailto:avijitsh94@gmail.com" className="text-emerald-700 underline font-semibold">
                avijitsh94@gmail.com
              </a>
            </div>
            <div className="text-[10px] text-emerald-800">
              সফটওয়্যার কাস্টমাইজেশন ও কারিগরি সহায়তার জন্য ইমেইল করতে পারেন।
            </div>
          </div>

          {/* Quick FAQ Guide */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A17] pb-1">
              <BookOpen className="w-4 h-4 text-[#1F7A4D]" />
              <span>{lang === 'bn' ? 'সাধারণ প্রশ্ন ও সমাধান (FAQ)' : 'Quick Answers'}</span>
            </div>

            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-3 text-xs font-bold text-[#1A1A17] hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <span>{lang === 'bn' ? faq.qBn : faq.qEn}</span>
                  <span className="text-[#1F7A4D] ml-2 text-sm">{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <div className="px-3 pb-3 text-xs text-[#5B574E] leading-relaxed border-t border-slate-100 bg-slate-50/50 pt-2">
                    {lang === 'bn' ? faq.aBn : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-[#F6F5F1] text-center text-[10px] text-[#5B574E] space-y-1">
          <div>☎️ হটলাইন: 01629404625 | 📧 avijitsh94@gmail.com</div>
          <div className="font-semibold text-slate-700">Copyright © 2026. All Rights Reserved.</div>
          <div className="text-emerald-800 font-bold">Design & Developed by Avijit Saha</div>
        </div>

      </div>
    </div>
  );
};
