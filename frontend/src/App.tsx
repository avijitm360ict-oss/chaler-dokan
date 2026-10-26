import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import {
  Language,
  NumberFormat,
  RiceProduct,
  Party,
  SaleInvoice,
  PurchaseBill,
  ExpenseRecord,
  DayCloseRecord,
  TenantInfo,
  UserRole,
  ReturnRecord,
  AuditLogEntry
} from './types';
import {
  initialTenant,
  initialProducts,
  initialWarehouses,
  initialParties,
  initialSales,
  initialPurchases,
  initialExpenses,
  initialDayClose,
  initialReturns,
  initialAuditLogs
} from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { QuickPOS } from './components/POS/QuickPOS';
import { ThermalReceipt } from './components/POS/ThermalReceipt';
import { DailyRateBoard } from './components/MarketRates/DailyRateBoard';
import { PurchaseManager } from './components/Purchases/PurchaseManager';
import { StockManagement } from './components/Inventory/StockManagement';
import { PartyLedgerView } from './components/Parties/PartyLedgerView';
import { CashBookAndDayClose } from './components/Accounts/CashBookAndDayClose';
import { ReportsHub } from './components/Reports/ReportsHub';
import { ShopSettings } from './components/Settings/ShopSettings';
import { SuperAdminView } from './components/SuperAdmin/SuperAdminView';
import { SalesListView } from './components/Sales/SalesListView';
import { ReturnsManager } from './components/Returns/ReturnsManager';
import { AuditLogModal } from './components/Audit/AuditLogModal';
import { ImportWizardModal } from './components/Import/ImportWizardModal';
import { HelpDrawer } from './components/Common/HelpDrawer';
import { KeyboardShortcutModal } from './components/Common/KeyboardShortcutModal';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { AuthModal } from './components/Auth/AuthModal';

export function App() {
  // App Config & Localization
  const [lang, setLang] = useState<Language>('bn');
  const [numFormat, setNumFormat] = useState<NumberFormat>('bn');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('chal_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(!currentUser);

  // Application Data States
  const [tenant, setTenant] = useState<TenantInfo>(initialTenant);
  const [products, setProducts] = useState<RiceProduct[]>(initialProducts);
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [sales, setSales] = useState<SaleInvoice[]>(initialSales);
  const [purchases, setPurchases] = useState<PurchaseBill[]>(initialPurchases);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [dayClose, setDayClose] = useState<DayCloseRecord>(initialDayClose);
  const [returns, setReturns] = useState<ReturnRecord[]>(initialReturns);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  // User & System Status
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isServerLive, setIsServerLive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Auth Handlers
  const handleLoginSuccess = (user: any, newTenant?: TenantInfo) => {
    setCurrentUser(user);
    localStorage.setItem('chal_auth_user', JSON.stringify(user));
    if (user.role) {
      const roleStr = user.role.toLowerCase();
      if (['owner', 'manager', 'cashier', 'superadmin'].includes(roleStr)) {
        setUserRole(roleStr as UserRole);
      }
    }
    if (newTenant) {
      setTenant(newTenant);
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    api.setToken(null);
    localStorage.removeItem('chal_auth_user');
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  // Offline Sales Queue (Persistent across page reloads)
  const [pendingOfflineSales, setPendingOfflineSales] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pending_offline_sales') || '[]');
    } catch {
      return [];
    }
  });

  const savePendingSales = (salesList: any[]) => {
    setPendingOfflineSales(salesList);
    localStorage.setItem('pending_offline_sales', JSON.stringify(salesList));
  };

  // Sync Offline Queue with Backend
  const syncOfflineSales = async () => {
    if (pendingOfflineSales.length === 0) return;
    setIsSyncing(true);

    try {
      const isLive = await api.checkHealth();
      if (!isLive) {
        alert('সার্ভার অফলাইন রয়েছে। দয়া করে ইন্টারনেট বা ব্যাকএন্ড কানেকশন চেক করুন।');
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;
      const remaining: any[] = [];

      for (const payload of pendingOfflineSales) {
        try {
          await api.sales.create(payload);
          syncedCount++;
        } catch (err) {
          console.warn('Failed syncing single sale:', err);
          remaining.push(payload);
        }
      }

      savePendingSales(remaining);
      alert(`আলহামদুলিল্লাহ! ${syncedCount}টি অফলাইন বিক্রয় সফলভাবে ক্লাউড সার্ভারে সিঙ্ক হয়েছে।`);
    } catch (err) {
      alert('সিঙ্ক করার সময় সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Background Data Sync with Backend
  useEffect(() => {
    let isMounted = true;
    async function checkAndSync() {
      try {
        const live = await api.checkHealth();
        if (!isMounted) return;
        setIsServerLive(live);
        if (live) {
          const [prodRes, partyRes, whRes, salesRes, purRes, expRes, tenantRes] = await Promise.all([
            api.products.getAll().catch(() => null),
            api.parties.getAll().catch(() => null),
            api.warehouses.getAll().catch(() => null),
            api.sales.getAll().catch(() => null),
            api.purchases.getAll().catch(() => null),
            api.accounts.getExpenses().catch(() => null),
            api.tenant.getProfile().catch(() => null),
          ]);
          if (isMounted) {
            const productsList = prodRes?.data || (prodRes as any)?.products;
            if (Array.isArray(productsList) && productsList.length > 0) {
              setProducts(productsList);
            }
            const partiesList = partyRes?.data || (partyRes as any)?.parties;
            if (Array.isArray(partiesList) && partiesList.length > 0) {
              setParties(partiesList);
            }
            const whList = whRes?.data || (whRes as any)?.warehouses;
            if (Array.isArray(whList) && whList.length > 0) {
              setWarehouses(whList);
            }
            const salesList = salesRes?.data;
            if (Array.isArray(salesList) && salesList.length > 0) {
              setSales(salesList);
            }
            const purList = purRes?.data;
            if (Array.isArray(purList) && purList.length > 0) {
              setPurchases(purList);
            }
            const expList = expRes?.data;
            if (Array.isArray(expList) && expList.length > 0) {
              const formattedExp: ExpenseRecord[] = expList.map((e: any) => ({
                id: e.id,
                date: e.spentAt || new Date().toISOString(),
                category: (e.categoryName || 'other') as any,
                categoryNameBn: e.categoryName || 'খরচ',
                amountPaisa: e.amountPaisa,
                account: e.accountName || 'প্রধান ক্যাশ ড্রয়ার',
                note: e.note || '',
              }));
              setExpenses(formattedExp);
            }
            const tData = (tenantRes as any)?.tenant || tenantRes?.data;
            if (tData) {
              setTenant((prev) => ({
                ...prev,
                name: tData.name || prev.name,
                shopNameBn: tData.settings?.shopNameBn || tData.name || prev.shopNameBn,
                shopNameEn: tData.settings?.shopNameEn || prev.shopNameEn,
                ownerName: tData.ownerName || prev.ownerName,
                proprietor: tData.settings?.proprietor || tData.ownerName || prev.proprietor,
                phone: tData.phone || prev.phone,
                address: tData.settings?.address || prev.address,
              }));
            }

            const auditRes: any = await api.audit.getAll().catch(() => null);
            const auditList = auditRes?.data || auditRes?.logs || auditRes;
            if (Array.isArray(auditList) && auditList.length > 0) {
              setAuditLogs(auditList);
            }
          }
        }
      } catch {
        if (isMounted) setIsServerLive(false);
      }
    }
    checkAndSync();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modals & Drawers
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuditLog, setShowAuditLog] = useState<boolean>(false);
  const [showImportWizard, setShowImportWizard] = useState<boolean>(false);

  // Modal receipt viewer
  const [activeReceipt, setActiveReceipt] = useState<SaleInvoice | null>(null);

  const handleSelectTab = (tab: string) => {
    if (tab === 'audit-log') {
      setShowAuditLog(true);
      return;
    }
    if (tab === 'import') {
      setShowImportWizard(true);
      return;
    }
    setActiveTab(tab);
  };

  // Toggle Language
  const toggleLanguage = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  // Toggle Numbers (বাংলা vs English)
  const toggleNumFormat = () => {
    setNumFormat((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  // 1. Complete Sale Handler
  const handleCompleteSale = async (invoice: SaleInvoice) => {
    // Append to sales ledger
    setSales((prev) => [invoice, ...prev]);

    // Deduct stock in KG from products (PRD base unit is KG)
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = invoice.items.find((item) => item.product.id === prod.id);
        if (soldItem) {
          const newStock = Math.max(0, prod.stockKg - soldItem.totalKg);
          return { ...prod, stockKg: newStock };
        }
        return prod;
      })
    );

    // If client had due, increase their party ledger balance
    if (invoice.dueAmountPaisa > 0 && invoice.clientName) {
      setParties((prev) =>
        prev.map((party) => {
          if (party.name === invoice.clientName) {
            return {
              ...party,
              balancePaisa: party.balancePaisa + invoice.dueAmountPaisa,
              totalSoldPaisa: (party.totalSoldPaisa || 0) + invoice.grandTotalPaisa
            };
          }
          return party;
        })
      );
    }

    // Cash register update
    const cashReceivedPaisa = invoice.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amountPaisa, 0);

    setDayClose((prev) => ({
      ...prev,
      totalSalesCashPaisa: prev.totalSalesCashPaisa + cashReceivedPaisa,
      expectedSystemCashPaisa: prev.expectedSystemCashPaisa + cashReceivedPaisa
    }));

    // Prepare Sale Payload
    const salePayload = {
      warehouseId: invoice.warehouseId || 'wh-01',
      clientName: invoice.clientName,
      discountPaisa: invoice.discountPaisa || 0,
      deliveryChargePaisa: invoice.deliveryChargePaisa || 0,
      items: invoice.items.map((it) => ({
        productId: it.product.id,
        unitId: it.selectedUnit.id,
        qtyUnit: it.unitQuantity,
        unitPricePaisa: it.unitPricePaisa,
        discountPaisa: it.discountPaisa || 0,
      })),
      payments: invoice.payments
        .filter((p) => p.method !== 'due')
        .map((p) => ({
          method: p.method === 'bank' ? 'bank_transfer' : p.method,
          amountPaisa: p.amountPaisa,
        })),
    };

    // Live Server Sync or Queue to Offline Storage
    if (isServerLive && !isOffline) {
      try {
        await api.sales.create(salePayload);
      } catch (err) {
        console.warn('Backend sync failed, queuing to offline sales:', err);
        savePendingSales([...pendingOfflineSales, salePayload]);
      }
    } else {
      // Offline mode: queue for later sync
      savePendingSales([...pendingOfflineSales, salePayload]);
    }
  };

  // 2. Void Invoice Handler (Revert stock and balances, PRD 10.2)
  const handleVoidInvoice = (invoiceId: string, reason: string) => {
    const targetInvoice = sales.find((s) => s.id === invoiceId);
    if (!targetInvoice || targetInvoice.status === 'voided') return;

    // Mark as voided
    setSales((prev) =>
      prev.map((s) => (s.id === invoiceId ? { ...s, status: 'voided', voidReason: reason } : s))
    );

    // Revert product stocks
    setProducts((prev) =>
      prev.map((prod) => {
        const item = targetInvoice.items.find((it) => it.product.id === prod.id);
        if (item) {
          return { ...prod, stockKg: prod.stockKg + item.totalKg };
        }
        return prod;
      })
    );

    // Revert customer due balance if any
    if (targetInvoice.dueAmountPaisa > 0) {
      setParties((prev) =>
        prev.map((party) => {
          if (party.name === targetInvoice.clientName) {
            return {
              ...party,
              balancePaisa: Math.max(0, party.balancePaisa - targetInvoice.dueAmountPaisa)
            };
          }
          return party;
        })
      );
    }

    // Live server void sync
    if (isServerLive && !isOffline) {
      api.sales.voidInvoice(invoiceId, reason).catch((err) =>
        console.warn('Backend void failed:', err)
      );
    }

    alert('ইনভয়েস বাতিল (Voided) করা হয়েছে এবং চালের স্টক ফিরিয়ে নেওয়া হয়েছে।');
  };

  // 3. Daily Rates update handler
  const handleUpdateRates = async (updatedProducts: RiceProduct[]) => {
    setProducts(updatedProducts);

    if (isServerLive && !isOffline) {
      try {
        const ratesPayload: any[] = [];
        updatedProducts.forEach((p) => {
          p.availableUnits?.forEach((u) => {
            ratesPayload.push({
              productId: p.id,
              unitId: u.id,
              priceType: 'retail',
              newPricePaisa: p.retailPricePaisa,
            });
            ratesPayload.push({
              productId: p.id,
              unitId: u.id,
              priceType: 'wholesale',
              newPricePaisa: p.wholesalePricePaisa,
            });
          });
        });
        if (ratesPayload.length > 0) {
          await api.marketRates.updateBulk(ratesPayload);
        }
      } catch (err) {
        console.warn('Daily rates sync failed:', err);
      }
    }
  };

  // 4. Add Purchase Handler
  const handleAddPurchase = (bill: PurchaseBill) => {
    setPurchases((prev) => [bill, ...prev]);

    // Increase stock & update WAC
    bill.items.forEach((item) => {
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id === item.product.id) {
            const oldStock = prod.stockKg;
            const newAddedStock = item.totalKg;
            const totalStock = oldStock + newAddedStock;

            // Weighted Average Cost formula (Section 10.1 of PRD)
            const oldTotalCost = oldStock * prod.wacPerKgPaisa;
            const newTotalCost = newAddedStock * item.landedCostPerKgPaisa;
            const newWac = totalStock > 0 ? Math.round((oldTotalCost + newTotalCost) / totalStock) : item.landedCostPerKgPaisa;

            return {
              ...prod,
              stockKg: totalStock,
              wacPerKgPaisa: newWac
            };
          }
          return prod;
        })
      );
    });

    // Update vendor due
    if (bill.dueAmountPaisa > 0) {
      setParties((prev) =>
        prev.map((party) => {
          if (party.name === bill.vendorName) {
            return {
              ...party,
              balancePaisa: party.balancePaisa + bill.dueAmountPaisa,
              totalPurchasedPaisa: (party.totalPurchasedPaisa || 0) + bill.grandTotalPaisa
            };
          }
          return party;
        })
      );
    }

    // Backend purchase sync
    if (isServerLive && !isOffline) {
      const vendor = parties.find((p) => p.name === bill.vendorName);
      if (vendor) {
        api.purchases.create({
          vendorId: vendor.id,
          warehouseId: bill.warehouseId || warehouses[0]?.id || 'wh-01',
          vendorBillNo: bill.vendorBillNo,
          paidTotalPaisa: bill.paidAmountPaisa,
          items: bill.items.map((it) => ({
            productId: it.product.id,
            unitId: it.unit.id,
            qtyUnit: it.unitQuantity,
            unitPricePaisa: it.rawPricePerKgPaisa,
          })),
          expenses: [
            ...(bill.truckFarePaisa > 0 ? [{ expenseType: 'transport', amountPaisa: bill.truckFarePaisa, allocationMethod: 'weight' }] : []),
            ...(bill.labourFarePaisa > 0 ? [{ expenseType: 'labour', amountPaisa: bill.labourFarePaisa, allocationMethod: 'weight' }] : []),
          ],
        }).catch((err) => console.warn('Purchase sync failed:', err));
      }
    }
  };

  // 5. Stock Adjustment (Moisture loss etc.)
  const handleAdjustStock = (productId: string, diffKg: number, reason: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockKg: Math.max(0, p.stockKg + diffKg)
          };
        }
        return p;
      })
    );

    if (isServerLive && !isOffline) {
      api.inventory.adjust({
        productId,
        warehouseId: warehouses[0]?.id || 'wh-01',
        diffKg,
        reason,
      }).catch((err) => console.warn('Stock adjustment sync failed:', err));
    }

    alert(`স্টক সফলভাবে এডজাস্ট করা হয়েছে (${diffKg >= 0 ? '+' : ''}${diffKg} কেজি)। কারণ: ${reason}`);
  };

  // 5b. Inter-Warehouse Transfer Handler
  const handleTransferStock = async (
    fromWarehouseId: string,
    toWarehouseId: string,
    productId: string,
    qtyKg: number,
    note?: string
  ) => {
    if (isServerLive && !isOffline) {
      await api.inventory.transfer({
        fromWarehouseId,
        toWarehouseId,
        productId,
        qtyKg,
        note,
      });

      // Refresh live products and warehouses
      const [prodRes, whRes]: [any, any] = await Promise.all([
        api.products.getAll().catch(() => null),
        api.warehouses.getAll().catch(() => null),
      ]);
      const pList = prodRes?.data || prodRes?.products || prodRes;
      if (Array.isArray(pList) && pList.length > 0) setProducts(pList);
      const wList = whRes?.data || whRes;
      if (Array.isArray(wList) && wList.length > 0) setWarehouses(wList);
    } else {
      // Local fallback
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return p;
          }
          return p;
        })
      );
    }

    const fromWh = warehouses.find((w) => w.id === fromWarehouseId)?.nameBn || 'উৎস গোডাউন';
    const toWh = warehouses.find((w) => w.id === toWarehouseId)?.nameBn || 'গন্তব্য গোডাউন';
    const prodName = products.find((p) => p.id === productId)?.nameBn || 'চাল';
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: 'ম্যানেজার',
      userRole: 'owner',
      action: 'গোডাউন স্থানান্তর',
      entityType: 'stock',
      entityId: productId,
      details: `${fromWh} হতে ${toWh}-এ ${prodName} ${qtyKg / 50} বস্তা (${qtyKg} কেজি) স্থানান্তর সম্পন্ন। নোট: ${note || 'প্রযোজ্য নয়'}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    if (isServerLive && !isOffline) {
      api.audit.create(auditEntry).catch((e) => console.warn('Could not persist audit:', e));
    }
  };

  // 6. Update Party Balance (Collections from Customer / Payment to Mill)
  const handleUpdatePartyBalance = (partyId: string, paymentPaisa: number) => {
    setParties((prev) =>
      prev.map((party) => {
        if (party.id === partyId) {
          const newBal = Math.max(0, party.balancePaisa - paymentPaisa);
          return { ...party, balancePaisa: newBal };
        }
        return party;
      })
    );

    // Add to cash register
    setDayClose((prev) => ({
      ...prev,
      dueCollectedCashPaisa: prev.dueCollectedCashPaisa + paymentPaisa,
      expectedSystemCashPaisa: prev.expectedSystemCashPaisa + paymentPaisa
    }));

    if (isServerLive && !isOffline) {
      api.parties.recordPayment(partyId, {
        direction: 'in',
        accountId: 'acc-cash',
        amountPaisa: paymentPaisa,
        method: 'cash',
        note: 'বাকি আদায় (Customer Collection)',
      }).catch((err) => console.warn('Payment record sync failed:', err));
    }

    alert('টাকা সফলভাবে আদায় ও লেজারে ক্রেডিট করা হয়েছে!');
  };

  // 7. Add Expense
  const handleAddExpense = (newExp: ExpenseRecord) => {
    setExpenses((prev) => [newExp, ...prev]);

    // Deduct from cash register
    setDayClose((prev) => ({
      ...prev,
      expensesPaidCashPaisa: prev.expensesPaidCashPaisa + newExp.amountPaisa,
      expectedSystemCashPaisa: prev.expectedSystemCashPaisa - newExp.amountPaisa
    }));

    if (isServerLive && !isOffline) {
      api.accounts.createExpense({
        categoryId: newExp.category,
        accountId: 'acc-cash',
        amountPaisa: newExp.amountPaisa,
        note: newExp.note,
      }).catch((err) => console.warn('Expense sync failed:', err));
    }
  };

  // 8. Perform Day Close
  const handlePerformDayClose = (countedCashPaisa: number, note: string) => {
    setDayClose((prev) => ({
      ...prev,
      actualCountedCashPaisa: countedCashPaisa,
      discrepancyPaisa: countedCashPaisa - prev.expectedSystemCashPaisa,
      notes: note,
      isClosed: true
    }));

    if (isServerLive && !isOffline) {
      api.accounts.submitDayClose({
        countedCashPaisa,
        note,
      }).catch((err) => console.warn('Day close sync failed:', err));
    }

    alert('আলহামদুলিল্লাহ, আজকের ডে-ক্লোজ সম্পন্ন হয়েছে এবং হিসাব লক করা হয়েছে।');
  };

  // 9. Update Tenant Profile
  const handleUpdateTenant = async (updated: TenantInfo) => {
    setTenant(updated);
    if (isServerLive && !isOffline) {
      try {
        await api.tenant.updateProfile({
          name: updated.shopNameBn,
          ownerName: updated.proprietor,
          settings: {
            shopNameBn: updated.shopNameBn,
            shopNameEn: updated.shopNameEn,
            phone: updated.phone,
            address: updated.address,
            proprietor: updated.proprietor,
          },
        });
      } catch (err) {
        console.warn('Tenant update sync failed:', err);
      }
    }
  };

  // 10. Add Return Handler
  const handleAddReturn = async (ret: ReturnRecord) => {
    setReturns((prev) => [ret, ...prev]);

    if (isServerLive && !isOffline) {
      try {
        if (ret.type === 'sale_return') {
          await api.returns.createSaleReturn({
            warehouseId: warehouses[0]?.id || 'wh-01',
            productId: ret.items[0]?.productId,
            unitId: 'unit-kg',
            qtyUnit: ret.items[0]?.quantity || 0,
            refundAmountPaisa: ret.totalAmountPaisa,
            reason: ret.reason,
          });
        } else {
          await api.returns.createPurchaseReturn({
            warehouseId: warehouses[0]?.id || 'wh-01',
            productId: ret.items[0]?.productId,
            unitId: 'unit-kg',
            qtyUnit: ret.items[0]?.quantity || 0,
            returnAmountPaisa: ret.totalAmountPaisa,
            reason: ret.reason,
          });
        }
      } catch (err) {
        console.warn('Return sync failed:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* App Header */}
      <Header
        tenant={tenant}
        lang={lang}
        onToggleLang={toggleLanguage}
        numFormat={numFormat}
        onToggleNumFormat={toggleNumFormat}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        userRole={userRole}
        onSelectRole={setUserRole}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline((prev) => !prev)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenHelp={() => setShowHelp(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        pendingSyncCount={pendingOfflineSales.length}
        onTriggerSync={syncOfflineSales}
        isSyncing={isSyncing}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          lang={lang}
          userRole={userRole}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              products={products}
              sales={sales}
              dayClose={dayClose}
              tenant={tenant}
              lang={lang}
              numFormat={numFormat}
              onSelectTab={handleSelectTab}
              onOpenReceipt={(inv) => setActiveReceipt(inv)}
            />
          )}

          {activeTab === 'pos' && (
            <QuickPOS
              products={products}
              parties={parties}
              warehouses={warehouses}
              lang={lang}
              numFormat={numFormat}
              onCompleteSale={handleCompleteSale}
              onOpenReceipt={(inv) => setActiveReceipt(inv)}
            />
          )}

          {activeTab === 'daily-rates' && (
            <DailyRateBoard
              products={products}
              lang={lang}
              numFormat={numFormat}
              onUpdateRates={handleUpdateRates}
            />
          )}

          {activeTab === 'sales-list' && (
            <SalesListView
              sales={sales}
              lang={lang}
              numFormat={numFormat}
              onOpenReceipt={(inv) => setActiveReceipt(inv)}
              onVoidInvoice={handleVoidInvoice}
            />
          )}

          {activeTab === 'returns' && (
            <ReturnsManager
              sales={sales}
              purchases={purchases}
              returns={returns}
              onAddReturn={handleAddReturn}
              lang={lang}
              numFormat={numFormat}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchaseManager
              purchases={purchases}
              products={products}
              parties={parties}
              warehouses={warehouses}
              lang={lang}
              numFormat={numFormat}
              onAddPurchase={handleAddPurchase}
            />
          )}

          {activeTab === 'inventory' && (
            <StockManagement
              products={products}
              warehouses={warehouses}
              lang={lang}
              numFormat={numFormat}
              onAdjustStock={handleAdjustStock}
              onTransferStock={handleTransferStock}
            />
          )}

          {(activeTab === 'parties' || activeTab === 'due-collection') && (
            <PartyLedgerView
              parties={parties}
              lang={lang}
              numFormat={numFormat}
              onUpdatePartyBalance={handleUpdatePartyBalance}
            />
          )}

          {activeTab === 'cash-book' && (
            <CashBookAndDayClose
              expenses={expenses}
              dayClose={dayClose}
              lang={lang}
              numFormat={numFormat}
              onAddExpense={handleAddExpense}
              onPerformDayClose={handlePerformDayClose}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsHub
              products={products}
              warehouses={warehouses}
              sales={sales}
              expenses={expenses}
              parties={parties}
              lang={lang}
              numFormat={numFormat}
            />
          )}

          {activeTab === 'settings' && (
            <ShopSettings
              tenant={tenant}
              lang={lang}
              numFormat={numFormat}
              onUpdateTenant={handleUpdateTenant}
            />
          )}

          {activeTab === 'super-admin' && (
            <SuperAdminView
              lang={lang}
              numFormat={numFormat}
            />
          )}
        </main>

        {/* Global Developer & Support Footer */}
        <footer className="border-t border-slate-200/90 bg-white/95 py-2.5 px-4 text-center text-[11px] text-slate-500 shadow-xs mb-16 sm:mb-0">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>☎️ <strong className="text-slate-800">Hotline:</strong> 01629404625</span>
            <span className="text-slate-300">|</span>
            <span><strong className="text-slate-800">Software Support:</strong> 01629404625 (Available: 10:00 AM – 06:00 PM)</span>
            <span className="text-slate-300">|</span>
            <span>📧 <a href="mailto:avijitsh94@gmail.com" className="text-emerald-700 font-semibold hover:underline">avijitsh94@gmail.com</a></span>
            <span className="text-slate-300">|</span>
            <span>Copyright © 2026. All Rights Reserved.</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-emerald-800">Design & Developed by Avijit Saha</span>
          </div>
        </footer>

      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lang={lang}
      />

      {/* Printable Thermal Receipt & A4 Invoice Modal */}
      {activeReceipt && (
        <ThermalReceipt
          invoice={activeReceipt}
          tenant={tenant}
          lang={lang}
          numFormat={numFormat}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
        auditLogs={auditLogs}
        lang={lang}
        numFormat={numFormat}
      />

      {/* Import Wizard Modal */}
      <ImportWizardModal
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        lang={lang}
        numFormat={numFormat}
        onImportProducts={async (imported) => {
          setProducts((prev) => [...imported, ...prev]);
          if (isServerLive && !isOffline) {
            for (const item of imported) {
              try {
                await api.products.create({
                  nameBn: item.nameBn,
                  variety: item.variety,
                  grade: item.grade || 'স্পেশাল',
                  category: item.category || 'চাল',
                  minStockKg: item.minStockKg || 200,
                  initialStockKg: item.stockKg || 0,
                  wacPerKgPaisa: item.wacPerKgPaisa,
                  retailPricePaisa: item.retailPricePaisa,
                  wholesalePricePaisa: item.wholesalePricePaisa,
                });
              } catch (e) {
                console.warn('Import product sync warning:', e);
              }
            }
            const prodRes: any = await api.products.getAll().catch(() => null);
            const pList = prodRes?.data || prodRes?.products || prodRes;
            if (Array.isArray(pList) && pList.length > 0) setProducts(pList);
          }
        }}
        onImportSuccess={(count) => {
          setShowImportWizard(false);
          alert(`আলহামদুলিল্লাহ, ${count}টি চালের রেকর্ড সফলভাবে সিস্টেমে ইম্পোর্ট সম্পন্ন হয়েছে!`);
        }}
      />

      {/* Help & Support Drawer */}
      <HelpDrawer
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        lang={lang}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        lang={lang}
      />

      {/* 2-Minute First-Time Onboarding Wizard */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        tenant={tenant}
        onUpdateTenant={setTenant}
        onAddProducts={(newProds) => setProducts((prev) => [...prev, ...newProds])}
        onGoToPos={() => {
          setShowOnboarding(false);
          setActiveTab('pos');
        }}
        lang={lang}
        numFormat={numFormat}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal || !currentUser}
        onClose={() => setShowAuthModal(false)}
        lang={lang}
        onLoginSuccess={handleLoginSuccess}
        isDismissable={!!currentUser}
      />

    </div>
  );
}

export default App;
