import React, { useState } from 'react';
import { UserRole, Language } from '../../types';
import { Users, Shield, Check, X, UserPlus, Key } from 'lucide-react';

interface UsersAndRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const UsersAndRolesModal: React.FC<UsersAndRolesModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [users, setUsers] = useState([
    { id: 'u1', name: 'হাজী মো: রফিকুল ইসলাম', phone: '01712-345678', role: 'owner' as UserRole, active: true },
    { id: 'u2', name: 'মো: তারেক রহমান (ম্যানেজার)', phone: '01819-556677', role: 'manager' as UserRole, active: true },
    { id: 'u3', name: 'মো: শামীম হোসেন (কাউন্টার ক্যাশিয়ার)', phone: '01911-223344', role: 'cashier' as UserRole, active: true },
  ]);

  // Permission Matrix state (Modules x Actions)
  const [matrix, setMatrix] = useState<{ [role: string]: { [module: string]: { view: boolean; create: boolean; edit: boolean; void: boolean } } }>({
    cashier: {
      pos: { view: true, create: true, edit: false, void: false },
      inventory: { view: true, create: false, edit: false, void: false },
      rates: { view: true, create: false, edit: false, void: false },
      purchases: { view: false, create: false, edit: false, void: false },
      day_close: { view: false, create: false, edit: false, void: false },
    },
    manager: {
      pos: { view: true, create: true, edit: true, void: true },
      inventory: { view: true, create: true, edit: true, void: false },
      rates: { view: true, create: true, edit: true, void: false },
      purchases: { view: true, create: true, edit: true, void: false },
      day_close: { view: true, create: true, edit: false, void: false },
    },
    owner: {
      pos: { view: true, create: true, edit: true, void: true },
      inventory: { view: true, create: true, edit: true, void: true },
      rates: { view: true, create: true, edit: true, void: true },
      purchases: { view: true, create: true, edit: true, void: true },
      day_close: { view: true, create: true, edit: true, void: true },
    }
  });

  if (!isOpen) return null;

  const toggleUserActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const changeUserRole = (id: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-modal border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A1A17]">
                {lang === 'bn' ? 'ইউজার ও রোল পারমিশন ম্যাট্রিক্স (G2)' : 'Users & Role Permissions (G2)'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn' ? 'মালিক, ম্যানেজার ও ক্যাশিয়ারের কাজের সীমাবদ্ধতা নির্ধারণ' : 'Control role-based access for counter cashiers and managers'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 py-4 flex-1 overflow-y-auto pr-1">
          
          {/* User List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#1A1A17]">দোকানের কর্মচারীদের তালিকা:</h4>
              <button className="flex items-center gap-1 text-[11px] font-bold text-[#1F7A4D] hover:underline">
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ নতুন কর্মচারী</span>
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1A1A17]">{u.name}</div>
                    <div className="text-[10px] text-slate-500">ফোন: {u.phone}</div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeUserRole(u.id, e.target.value as any)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="owner">মালিক (Owner)</option>
                      <option value="manager">ম্যানেজার (Manager)</option>
                      <option value="cashier">ক্যাশিয়ার (Cashier)</option>
                    </select>

                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                        u.active
                          ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {u.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Permissions Matrix (Section 4.14: সারি মডিউল, কলাম অ্যাকশন) */}
          <div>
            <h4 className="text-xs font-bold text-[#1A1A17] mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1F7A4D]" />
              <span>ক্যাশিয়ার ও ম্যানেজারের পারমিশন ম্যাট্রিক্স:</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">মডিউল</th>
                    <th className="py-2.5 px-3 text-center">দেখা (View)</th>
                    <th className="py-2.5 px-3 text-center">তৈরি (Create)</th>
                    <th className="py-2.5 px-3 text-center">এডিট (Edit)</th>
                    <th className="py-2.5 px-3 text-center">বাতিল (Void)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { key: 'pos', name: 'কাউন্টার বিক্রি (POS)' },
                    { key: 'inventory', name: 'স্টক ও গোডাউন' },
                    { key: 'rates', name: 'বাজারদর পরিবর্তন' },
                    { key: 'purchases', name: 'ট্রাক ক্রয় ও আসল দাম' },
                    { key: 'day_close', name: 'ডে ক্লোজ ও লক' },
                  ].map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-[#1A1A17]">{row.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <input type="checkbox" defaultChecked className="rounded text-[#1F7A4D]" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={row.key === 'pos'}
                          className="rounded text-[#1F7A4D]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={row.key === 'rates'}
                          className="rounded text-[#1F7A4D]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          className="rounded text-[#1F7A4D]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              * ক্যাশিয়ারের জন্য চালের গড় কেনা-দাম (WAC) ও মোট লাভ সম্পূর্ণ গোপন থাকবে।
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1F7A4D] hover:bg-[#16603B] text-white text-xs font-bold rounded-xl transition touch-target"
          >
            পারমিশন সেভ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
