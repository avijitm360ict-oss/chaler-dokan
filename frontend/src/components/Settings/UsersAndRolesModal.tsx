import React, { useState, useEffect } from 'react';
import { UserRole, Language } from '../../types';
import { Users, Shield, Check, X, UserPlus, Key, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

interface UsersAndRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

interface ShopUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
}

export const UsersAndRolesModal: React.FC<UsersAndRolesModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [users, setUsers] = useState<ShopUser[]>([
    { id: 'u1', name: 'হাজী মো: রফিকুল ইসলাম', phone: '01712-345678', role: 'owner', active: true },
    { id: 'u2', name: 'মো: তারেক রহমান (ম্যানেজার)', phone: '01819-556677', role: 'manager', active: true },
    { id: 'u3', name: 'মো: শামীম হোসেন (কাউন্টার ক্যাশিয়ার)', phone: '01911-223344', role: 'cashier', active: true },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'cashier'>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Permission Matrix state (Modules x Actions)
  const [matrix, setMatrix] = useState<{
    [role: string]: { [module: string]: { view: boolean; create: boolean; edit: boolean; void: boolean } };
  }>({
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
    },
  });

  // Load real users from backend
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);

    api.tenant
      .getUsers()
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || res?.users || res;
        if (Array.isArray(list) && list.length > 0) {
          setUsers(
            list.map((u: any) => ({
              id: u.id,
              name: u.name,
              phone: u.phone,
              role: u.role || 'cashier',
              active: typeof u.active === 'boolean' ? u.active : true,
            }))
          );
        }
      })
      .catch((err) => console.warn('Could not fetch tenant users:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleUserActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: nextStatus } : u)));
    try {
      await api.tenant.updateUser(id, { active: nextStatus });
    } catch (err) {
      console.warn('Update user status failed:', err);
    }
  };

  const changeUserRole = async (id: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    try {
      await api.tenant.updateUser(id, { role: newRole });
    } catch (err) {
      console.warn('Change user role failed:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newName.trim() || !newPhone.trim()) {
      setErrorMsg('নাম ও মোবাইল নম্বর দিন');
      return;
    }

    try {
      setIsSubmitting(true);
      const res: any = await api.tenant.createUser({
        name: newName.trim(),
        phone: newPhone.trim(),
        role: newRole,
      });

      const created = res?.data || {
        id: `usr-${Date.now()}`,
        name: newName,
        phone: newPhone,
        role: newRole,
        active: true,
      };

      setUsers((prev) => [...prev, created]);
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
      alert(`${created.name} (${newRole === 'manager' ? 'ম্যানেজার' : 'ক্যাশিয়ার'}) সফলভাবে যুক্ত হয়েছেন!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'কর্মচারী যুক্ত করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
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
                {lang === 'bn' ? 'ইউজার ও রোল পারমিশন ম্যানেজমেন্ট' : 'Users & Role Permissions'}
              </h3>
              <p className="text-[11px] text-[#5B574E]">
                {lang === 'bn'
                  ? 'মালিক, ম্যানেজার ও ক্যাশিয়ারের অ্যাক্সেস এবং ক্ষমতার সীমা নির্ধারণ'
                  : 'Control access and boundaries for counter cashiers and managers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 py-4 flex-1 overflow-y-auto pr-1">
          {/* User List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#1A1A17] flex items-center gap-1.5">
                <span>দোকানের কর্মচারীদের তালিকা:</span>
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1F7A4D] hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'ফর্ম বন্ধ করুন' : '+ নতুন কর্মচারী'}</span>
              </button>
            </div>

            {/* Add User Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddUser}
                className="mb-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2.5"
              >
                <div className="font-bold text-emerald-950 text-xs">নতুন কর্মচারী যোগ করুন:</div>
                {errorMsg && (
                  <div className="text-rose-600 text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="কর্মচারীর নাম"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-xl font-medium"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর (১১ ডিজিট)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-xl font-mono"
                    required
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="p-2 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="cashier">ক্যাশিয়ার (Cashier)</option>
                    <option value="manager">ম্যানেজার (Manager)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold text-slate-600 bg-white"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#1F7A4D] hover:bg-[#185E3B] text-white rounded-xl font-extrabold shadow-xs"
                  >
                    {isSubmitting ? 'যোগ হচ্ছে...' : 'যুক্ত করুন'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1A1A17]">{u.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ফোন: {u.phone}</div>
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
                      type="button"
                      onClick={() => toggleUserActive(u.id, u.active)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        u.active ? 'bg-[#E8F4EC] text-[#1F7A4D]' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {u.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div>
            <h4 className="text-xs font-bold text-[#1A1A17] mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1F7A4D]" />
              <span>ক্যাশিয়ার ও ম্যানেজারের পারমিশন ম্যাট্রিক্স:</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-2.5 px-3">মডিউল ও কাজের খাত</th>
                    <th className="py-2.5 px-2 text-center text-emerald-800">মালিক</th>
                    <th className="py-2.5 px-2 text-center text-blue-800">ম্যানেজার</th>
                    <th className="py-2.5 px-2 text-center text-amber-800">ক্যাশিয়ার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">ক্যাশ কাউন্টার বিক্রয় (Quick POS)</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-blue-600">✓</td>
                    <td className="text-center font-bold text-amber-600">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">মেমো বাতিল (Void Invoice)</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-blue-600">✓</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">বাজার দর ও মূল্য পরিবর্তন</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-blue-600">✓</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">চাল ক্রয় ও Landed Cost এন্ট্রি</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-blue-600">✓</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">গোডাউন চাল স্থানান্তর (Transfer)</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-blue-600">✓</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">ব্যবসায়িক লাভ-ক্ষতি ও P&L রিপোর্ট</td>
                    <td className="text-center font-bold text-emerald-600">✓</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                    <td className="text-center font-bold text-slate-300">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1F7A4D] hover:bg-[#185E3B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
