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
  AuditLogEntry,
  Warehouse
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
import { DueCollectionView } from './components/Parties/DueCollectionView';
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
  const [tenant, setTenant] = useState<TenantInfo>(() => {
    try {
      const savedTenant = localStorage.getItem('chal_tenant_info');
      return savedTenant ? JSON.parse(savedTenant) : initialTenant;
    } catch {
      return initialTenant;
    }
  });

  const cleanWarehouse: Warehouse[] = [
    {
      id: 'wh-default-main',
      nameBn: 'মেইন গোডাউন',
      nameEn: 'Main Warehouse',
      location: 'দোকান গোডাউন',
      isDefault: true,
      totalStockKg: 0,
    },
  ];

  const cleanDayClose: DayCloseRecord = {
    id: `close-${new Date().toISOString().split('T')[0]}`,
    date: new Date().toISOString(),
    openingCashPaisa: 0,
    totalSalesCashPaisa: 0,
    dueCollectedCashPaisa: 0,
    expensesPaidCashPaisa: 0,
    vendorPaidCashPaisa: 0,
    expectedSystemCashPaisa: 0,
    actualCountedCashPaisa: 0,
    discrepancyPaisa: 0,
    closedBy: '',
    notes: '',
    isClosed: false,
  };

  const isInitialDemo = !currentUser || tenant.id === 'tenant-demo-001';

  const [products, setProducts] = useState<RiceProduct[]>(isInitialDemo ? initialProducts : []);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(isInitialDemo ? initialWarehouses : cleanWarehouse);
  const [parties, setParties] = useState<Party[]>(isInitialDemo ? initialParties : []);
  const [sales, setSales] = useState<SaleInvoice[]>(isInitialDemo ? initialSales : []);
  const [purchases, setPurchases] = useState<PurchaseBill[]>(isInitialDemo ? initialPurchases : []);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(isInitialDemo ? initialExpenses : []);
  const [dayClose, setDayClose] = useState<DayCloseRecord>(isInitialDemo ? initialDayClose : cleanDayClose);
  const [returns, setReturns] = useState<ReturnRecord[]>(isInitialDemo ? initialReturns : []);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(isInitialDemo ? initialAuditLogs : []);

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
      const roleStr = user.role.toLowerCase().replace(/[\s-_]/g, '');
      if (['owner', 'manager', 'cashier', 'superadmin'].includes(roleStr)) {
        setUserRole(roleStr as UserRole);
        if (roleStr === 'superadmin') {
          setActiveTab('super-admin');
        }
      }
    }

    const activeTenant = newTenant || tenant;
    if (newTenant) {
      setTenant(newTenant);
      localStorage.setItem('chal_tenant_info', JSON.stringify(newTenant));
      api.setTenantId(newTenant.id);
    }

    const roleClean = (user?.role || '').toLowerCase().replace(/[\s-_]/g, '');
    if (roleClean === 'superadmin' || activeTenant?.id === 'tenant-superadmin-001') {
      setActiveTab('super-admin');
      setShowAuthModal(false);
      return;
    }

    const isDemo = !activeTenant.id || activeTenant.id === 'tenant-demo-001';
    if (!isDemo) {
      // Clean slate for newly registered store
      setProducts([]);
      setParties([]);
      setSales([]);
      setPurchases([]);
      setExpenses([]);
      setAuditLogs([]);
      setDayClose(cleanDayClose);
      setWarehouses(cleanWarehouse);

      // Auto-trigger Onboarding for new store (BUG-04)
      if (newTenant || !localStorage.getItem(`chal_onboarding_done_${activeTenant.id}`)) {
        setShowOnboarding(true);
      }
    } else {
      setProducts(initialProducts);
      setParties(initialParties);
      setSales(initialSales);
      setPurchases(initialPurchases);
      setExpenses(initialExpenses);
      setAuditLogs(initialAuditLogs);
      setDayClose(initialDayClose);
    }

    setShowAuthModal(false);
    setTimeout(() => {
      checkAndSyncData();
    }, 100);
  };

  const handleLogout = () => {
    api.setToken(null);
    api.setTenantId('tenant-demo-001');
    localStorage.removeItem('chal_auth_user');
    localStorage.removeItem('chal_tenant_info');
    setCurrentUser(null);
    setUserRole('owner');
    setTenant(initialTenant);
    setProducts(initialProducts);
    setParties(initialParties);
    setSales(initialSales);
    setPurchases(initialPurchases);
    setExpenses(initialExpenses);
    setDayClose(initialDayClose);
    setAuditLogs(initialAuditLogs);
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
  const checkAndSyncData = async () => {
    try {
      const live = await api.checkHealth();
      setIsServerLive(live);
      // Only query protected data if user is authenticated with a token
      if (live && (api.hasToken() || currentUser)) {
        const activeTenantId = api.getTenantId();
        const isDemo = !activeTenantId || activeTenantId === 'tenant-demo-001';

        const [prodRes, partyRes, whRes, salesRes, purRes, expRes, tenantRes] = await Promise.all([
          api.products.getAll().catch(() => null),
          api.parties.getAll().catch(() => null),
          api.warehouses.getAll().catch(() => null),
          api.sales.getAll().catch(() => null),
          api.purchases.getAll().catch(() => null),
          api.accounts.getExpenses().catch(() => null),
          api.tenant.getProfile().catch(() => null),
        ]);

        const productsList = prodRes?.data || (prodRes as any)?.products;
        if (Array.isArray(productsList)) {
          if (productsList.length > 0 || !isDemo) {
            setProducts(productsList);
          }
          // Auto-trigger onboarding if store has no products yet (BUG-04)
          if (!isDemo && productsList.length === 0 && !localStorage.getItem(`chal_onboarding_done_${activeTenantId}`)) {
            setShowOnboarding(true);
          }
        }
        const partiesList = partyRes?.data || (partyRes as any)?.parties;
        if (Array.isArray(partiesList)) {
          if (partiesList.length > 0 || !isDemo) {
            setParties(partiesList);
          }
        }
        const whList = whRes?.data || (whRes as any)?.warehouses;
        if (Array.isArray(whList)) {
          if (whList.length > 0) {
            const formattedWh: Warehouse[] = whList.map((w: any) => ({
              id: w.id,
              nameBn: w.nameBn || w.name || 'গোডাউন',
              nameEn: w.nameEn || w.name || 'Warehouse',
              location: w.address || w.location || 'দোকান গোডাউন',
              isDefault: !!w.isDefault,
              totalStockKg: Number(w.totalStockKg || 0),
            }));
            setWarehouses(formattedWh);
          } else if (!isDemo) {
            setWarehouses(cleanWarehouse);
          }
        }
        const salesList = salesRes?.data || (salesRes as any)?.sales;
        if (Array.isArray(salesList)) {
          if (salesList.length > 0 || !isDemo) {
            setSales(salesList);
          }
        }
        const purList = purRes?.data || (purRes as any)?.purchases;
        if (Array.isArray(purList)) {
          if (purList.length > 0 || !isDemo) {
            setPurchases(purList);
          }
        }
        const expList = expRes?.data || (expRes as any)?.expenses;
        if (Array.isArray(expList)) {
          if (expList.length > 0 || !isDemo) {
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
        }
        const tData = (tenantRes as any)?.tenant || tenantRes?.data;
        if (tData) {
          setTenant((prev) => {
            const updated: TenantInfo = {
              ...prev,
              id: tData.id || prev.id,
              name: tData.name || prev.name,
              shopNameBn: tData.settings?.shopNameBn || tData.name || prev.shopNameBn,
              shopNameEn: tData.settings?.shopNameEn || prev.shopNameEn,
              ownerName: tData.ownerName || prev.ownerName,
              proprietor: tData.settings?.proprietor || tData.ownerName || prev.proprietor,
              phone: tData.phone || prev.phone,
              address: tData.settings?.address || prev.address,
              status: tData.status || prev.status,
            };
            localStorage.setItem('chal_tenant_info', JSON.stringify(updated));
            return updated;
          });
        }

        const auditRes: any = await api.audit.getAll().catch(() => null);
        const auditList = auditRes?.data || auditRes?.logs || auditRes;
        if (Array.isArray(auditList)) {
          if (auditList.length > 0 || !isDemo) {
            setAuditLogs(auditList);
          }
        }
      }
    } catch {
      setIsServerLive(false);
    }
  };

  useEffect(() => {
    checkAndSyncData();
  }, [currentUser?.id, tenant.id]);

  // Session expiry listener (BUG-17)
  useEffect(() => {
    const handleAuthExpired = (e: any) => {
      // Don't alert visitors who are not logged in yet or in demo mode
      if (!currentUser || !api.hasToken()) return;
      const msg = e.detail?.message;
      handleLogout();
      if (msg && !msg.includes('টোকেন পাওয়া যায়নি')) {
        alert(msg);
      }
    };
    window.addEventListener('chal_auth_expired', handleAuthExpired);

    // Auto-sync offline sales when internet restores (BUG-POS-05)
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineSales();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('chal_auth_expired', handleAuthExpired);
      window.removeEventListener('online', handleOnline);
    };
  }, [pendingOfflineSales]);

  // Modals & Drawers
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuditLog, setShowAuditLog] = useState<boolean>(false);
  const [showImportWizard, setShowImportWizard] = useState<boolean>(false);

  // Modal receipt viewer
  const [activeReceipt, setActiveReceipt] = useState<{ invoice: SaleInvoice; isReprint?: boolean } | null>(null);

  const handleOpenReceipt = (invoice: SaleInvoice, isReprint: boolean = false) => {
    setActiveReceipt({ invoice, isReprint });
  };

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

  // Centralized Immutable Audit Logger
  const logAuditAction = (
    action: string,
    entityType: 'sale' | 'purchase' | 'return' | 'party' | 'stock' | 'rate' | 'day_close' | 'user' | 'expense' | 'settings' | 'tenant',
    entityId: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: userRole === 'owner' ? 'মালিক / ম্যানেজার' : 'ক্যাশিয়ার',
      userRole: userRole,
      action,
      entityType,
      entityId,
      details,
      oldValue,
      newValue
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    if (isServerLive && !isOffline) {
      api.audit.create(auditEntry).catch((e) => console.warn('Could not persist audit:', e));
    }
  };

  // 1. Complete Sale Handler
  const handleCompleteSale = async (invoice: SaleInvoice) => {
    // Day Close Guard (Audit Integrity)
    if (dayClose.isClosed) {
      alert('সতর্কতা: আজকের ডে-ক্লোজ সম্পন্ন হয়েছে! ডে-ক্লোজের পর নতুন বিক্রয় চালান তৈরি করা যাবে না।');
      return;
    }

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

    // Prepare Sale Payload with unique idempotency key to prevent duplicate sales
    const salePayload = {
      idempotencyKey: invoice.id || `sale-${Date.now()}-${Math.random()}`,
      warehouseId: invoice.warehouseId || 'wh-01',
      clientId: invoice.clientId,
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

    logAuditAction(
      'নতুন বিক্রয় চালান',
      'sale',
      invoice.id,
      `চালান #${invoice.docNo}: ${invoice.clientName || 'খুচরা গ্রাহক'} • মোট বিল ৳${(invoice.grandTotalPaisa / 100).toLocaleString('bn-BD')} (নগদ জমা: ৳${(invoice.paidTotalPaisa / 100).toLocaleString('bn-BD')}, বাকি: ৳${(invoice.dueAmountPaisa / 100).toLocaleString('bn-BD')})`
    );
  };

  // 2. Void Invoice Handler (Revert stock and balances, PRD 10.2)
  const handleVoidInvoice = (invoiceId: string, reason: string) => {
    const targetInvoice = sales.find((s) => s.id === invoiceId);
    if (!targetInvoice || targetInvoice.status === 'voided') return;

    // Audit Lock: Block modifying transactions after Day Close (BUG-ACC-04)
    if (dayClose.isClosed) {
      alert('সতর্কতা: আজকের ডে-ক্লোজ সম্পন্ন হয়ে গেছে! অডিট সুরক্ষার কারণে ডে-ক্লোজের পর কোনো বিক্রয় চালান বাতিল বা পরিবর্তন করা সম্ভব নয়।');
      return;
    }

    // Mark as voided
    setSales((prev) =>
      prev.map((s) => (s.id === invoiceId ? { ...s, status: 'voided', voidReason: reason } : s))
    );

    // Revert product stocks (BUG-09)
    setProducts((prev) =>
      prev.map((prod) => {
        const item = targetInvoice.items.find(
          (it) => (it.product && it.product.id === prod.id) || (it as any).productId === prod.id
        );
        if (item) {
          const addKg = Number(item.totalKg || (item as any).qtyKg || 0);
          return { ...prod, stockKg: prod.stockKg + addKg };
        }
        return prod;
      })
    );

    // Revert warehouse stocks (BUG-09)
    setWarehouses((prev) =>
      prev.map((w) => {
        if (w.id === targetInvoice.warehouseId) {
          return { ...w, totalStockKg: w.totalStockKg + (targetInvoice.totalKg || 0) };
        }
        return w;
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
      api.sales
        .voidInvoice(invoiceId, reason)
        .then(() => {
          api.products.getAll().then((res) => {
            const list = res?.data || (res as any)?.products;
            if (Array.isArray(list) && list.length > 0) {
              setProducts(list);
            }
          });
        })
        .catch((err) => console.warn('Backend void failed:', err));
    }

    logAuditAction(
      'বিক্রয় চালান বাতিল (Void)',
      'sale',
      invoiceId,
      `চালান #${targetInvoice.docNo} বাতিল (Void) করা হয়েছে। কারণ: ${reason}`,
      'স্ট্যাটাস: কনফার্মড',
      'স্ট্যাটাস: বাতিল'
    );

    alert('ইনভয়েস বাতিল (Voided) করা হয়েছে এবং চালের স্টক ফিরিয়ে নেওয়া হয়েছে।');
  };

  // 3. Daily Rates update handler
  const handleUpdateRates = async (updatedProducts: RiceProduct[]) => {
    setProducts(updatedProducts);

    logAuditAction(
      'বাজার দর পরিবর্তন',
      'rate',
      'daily-rates',
      `আজকের চালের বাজার দর আপডেট করা হয়েছে (${updatedProducts.length}টি জাতের নতুন দর নির্ধারিত)`,
      undefined,
      'নতুন দর কার্যকর'
    );

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
    // Day Close Guard (Audit Integrity)
    if (dayClose.isClosed) {
      alert('সতর্কতা: আজকের ডে-ক্লোজ সম্পন্ন হয়েছে! ডে-ক্লোজের পর নতুন ক্রয় চালান এন্ট্রি করা যাবে না।');
      return;
    }

    setPurchases((prev) => [bill, ...prev]);

    // Increase stock & update WAC
    bill.items.forEach((item) => {
      setProducts((prev) => {
        const exists = prev.some((prod) => prod.id === item.product.id || prod.nameBn === item.product.nameBn);
        if (!exists) {
          const newProd: RiceProduct = {
            ...item.product,
            stockKg: item.totalKg,
            wacPerKgPaisa: item.landedCostPerKgPaisa,
          };
          return [newProd, ...prev];
        }
        return prev.map((prod) => {
          if (prod.id === item.product.id || prod.nameBn === item.product.nameBn) {
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
        });
      });
    });

    // Update vendor due and purchase record
    setParties((prev) => {
      const exists = prev.some((p) => p.name === bill.vendorName);
      if (!exists) {
        const newParty: Party = {
          id: `party-vendor-${Date.now()}`,
          name: bill.vendorName,
          phone: bill.vendorPhone || '01700000000',
          address: 'মোকাম',
          type: 'vendor',
          balancePaisa: bill.dueAmountPaisa,
          totalPurchasedPaisa: bill.grandTotalPaisa,
          creditLimitPaisa: 50000000,
        };
        return [newParty, ...prev];
      }
      return prev.map((party) => {
        if (party.name === bill.vendorName) {
          return {
            ...party,
            balancePaisa: party.balancePaisa + bill.dueAmountPaisa,
            totalPurchasedPaisa: (party.totalPurchasedPaisa || 0) + bill.grandTotalPaisa
          };
        }
        return party;
      });
    });

    // Deduct paid purchase cash from drawer if any
    if (bill.paidAmountPaisa > 0) {
      setDayClose((prev) => ({
        ...prev,
        vendorPaidCashPaisa: prev.vendorPaidCashPaisa + bill.paidAmountPaisa,
        expectedSystemCashPaisa: prev.expectedSystemCashPaisa - bill.paidAmountPaisa,
      }));
    }

    // Backend purchase sync
    if (isServerLive && !isOffline) {
      (async () => {
        try {
          let vendorId = bill.vendorId;
          const matchedVendor = parties.find((p) => p.name === bill.vendorName || p.id === bill.vendorId);
          if (matchedVendor && !matchedVendor.id.startsWith('party-vendor-') && !matchedVendor.id.startsWith('vendor-fallback')) {
            vendorId = matchedVendor.id;
          } else {
            // Vendor is new or fallback - auto create party on backend first
            try {
              const createdRes = await api.parties.create({
                name: bill.vendorName,
                partyType: 'supplier',
                phone: bill.vendorPhone || '01700000000',
                address: 'মোকাম',
                openingBalancePaisa: 0,
                balanceType: 'payable',
              });
              const newId = (createdRes as any)?.data?.id || (createdRes as any)?.party?.id;
              if (newId) {
                vendorId = newId;
              }
            } catch (partyErr) {
              console.warn('Vendor party auto-create failed:', partyErr);
            }
          }

          const defaultWarehouseId = warehouses[0]?.id || 'wh-01';
          const whId = bill.warehouseId && bill.warehouseId !== 'wh-01' ? bill.warehouseId : defaultWarehouseId;

          await api.purchases.create({
            vendorId: vendorId || 'vendor-01',
            warehouseId: whId,
            vendorBillNo: bill.vendorBillNo,
            paidTotalPaisa: bill.paidAmountPaisa,
            items: bill.items.map((it) => ({
              productId: it.product.id,
              unitId: it.unit?.id || it.product.availableUnits?.[0]?.id || 'u-sack-50',
              qtyUnit: it.unitQuantity,
              unitPricePaisa: it.rawPricePerKgPaisa,
            })),
            expenses: [
              ...(bill.truckFarePaisa > 0 ? [{ expenseType: 'transport', amountPaisa: bill.truckFarePaisa, allocationMethod: 'weight' }] : []),
              ...(bill.labourFarePaisa > 0 ? [{ expenseType: 'labour', amountPaisa: bill.labourFarePaisa, allocationMethod: 'weight' }] : []),
            ],
          });
          checkAndSyncData();
        } catch (err) {
          console.warn('Purchase sync failed:', err);
        }
      })();
    }

    logAuditAction(
      'নতুন ক্রয় চালান',
      'purchase',
      bill.id,
      `ক্রয় চালান #${bill.docNo}: সাপ্লায়ার ${bill.vendorName} • মোট ৳${(bill.grandTotalPaisa / 100).toLocaleString('bn-BD')} (নগদ পরিশোধ: ৳${(bill.paidAmountPaisa / 100).toLocaleString('bn-BD')}, দেনা: ৳${(bill.dueAmountPaisa / 100).toLocaleString('bn-BD')})`
    );
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

  // 6. Update Party Balance (Collections from Customer / Payment to Mill, BUG-ACC-02)
  const handleUpdatePartyBalance = (partyId: string, paymentPaisa: number) => {
    // Day Close Guard (Audit Integrity)
    if (dayClose.isClosed) {
      alert('সতর্কতা: আজকের ডে-ক্লোজ সম্পন্ন হয়েছে! ডে-ক্লোজের পর নগদ টাকা আদায় বা পরিশোধ এন্ট্রি করা যাবে না।');
      return;
    }

    const targetParty = parties.find((p) => p.id === partyId);
    if (!targetParty) return;

    const isVendor = targetParty.type === 'vendor';
    const oldBal = targetParty.balancePaisa;
    const newBal = Math.max(0, targetParty.balancePaisa - paymentPaisa);

    setParties((prev) =>
      prev.map((party) => {
        if (party.id === partyId) {
          const newBal = Math.max(0, party.balancePaisa - paymentPaisa);
          return { ...party, balancePaisa: newBal };
        }
        return party;
      })
    );

    // Update cash register based on whether it is customer collection or vendor payment
    setDayClose((prev) => {
      if (isVendor) {
        // Paying vendor reduces drawer cash
        return {
          ...prev,
          vendorPaidCashPaisa: prev.vendorPaidCashPaisa + paymentPaisa,
          expectedSystemCashPaisa: prev.expectedSystemCashPaisa - paymentPaisa,
        };
      } else {
        // Collecting from customer increases drawer cash
        return {
          ...prev,
          dueCollectedCashPaisa: prev.dueCollectedCashPaisa + paymentPaisa,
          expectedSystemCashPaisa: prev.expectedSystemCashPaisa + paymentPaisa,
        };
      }
    });

    if (isServerLive && !isOffline) {
      api.parties.recordPayment(partyId, {
        direction: isVendor ? 'out' : 'in',
        accountId: 'acc-cash',
        amountPaisa: paymentPaisa,
        method: 'cash',
        note: isVendor ? 'মিলকে টাকা পরিশোধ (Vendor Payment)' : 'বাকি আদায় (Customer Collection)',
      }).catch((err) => console.warn('Payment record sync failed:', err));
    }

    logAuditAction(
      isVendor ? 'সাপ্লায়ার দেনা পরিশোধ' : 'কাস্টমার বাকি আদায়',
      'party',
      partyId,
      `${targetParty.name}-এর ${isVendor ? 'দেনা পরিশোধ' : 'বাকি আদায়'} বাবদ ৳${(paymentPaisa / 100).toLocaleString('bn-BD')} জমা/পরিশোধ করা হয়েছে।`,
      `আগের ব্যালেন্স: ৳${(oldBal / 100).toLocaleString('bn-BD')}`,
      `নতুন ব্যালেন্স: ৳${(newBal / 100).toLocaleString('bn-BD')}`
    );

    alert(isVendor ? 'মিলারকে টাকা সফলভাবে পরিশোধ ও লেজারে সমন্বয় করা হয়েছে!' : 'টাকা সফলভাবে আদায় ও লেজারে ক্রেডিট করা হয়েছে!');
  };

  // 6B. Create New Party (BUG-ACC-01)
  const handleCreateParty = (newParty: Party) => {
    setParties((prev) => [newParty, ...prev]);
    if (isServerLive && !isOffline) {
      api.parties.create({
        name: newParty.name,
        partyType: newParty.type === 'vendor' ? 'supplier' : 'customer',
        phone: newParty.phone,
        address: newParty.address,
        creditLimitPaisa: newParty.creditLimitPaisa || 0,
        openingBalancePaisa: newParty.balancePaisa || 0,
        balanceType: newParty.balanceType || (newParty.type === 'vendor' ? 'payable' : 'receivable'),
      }).catch((err) => console.warn('Party create sync failed:', err));
    }

    logAuditAction(
      'নতুন পার্টি তৈরি',
      'party',
      newParty.id,
      `নতুন ${newParty.type === 'vendor' ? 'সাপ্লায়ার/মিল' : 'কাস্টমার'}: ${newParty.name} (${newParty.phone}) তৈরি করা হয়েছে। প্রাথমিক ব্যালেন্স: ৳${(newParty.balancePaisa / 100).toLocaleString('bn-BD')}`
    );

    alert(`${newParty.type === 'vendor' ? 'মিলার / মহাজন' : 'কাস্টমার'} সফলভাবে যুক্ত হয়েছে!`);
  };

  // 6C. Account Transfer (BUG-ACC-03)
  const handleAccountTransfer = (fromAccount: string, toAccount: string, amountPaisa: number, note?: string) => {
    if (fromAccount.includes('ক্যাশ') && !toAccount.includes('ক্যাশ')) {
      setDayClose((prev) => ({
        ...prev,
        expectedSystemCashPaisa: prev.expectedSystemCashPaisa - amountPaisa,
      }));
    } else if (!fromAccount.includes('ক্যাশ') && toAccount.includes('ক্যাশ')) {
      setDayClose((prev) => ({
        ...prev,
        expectedSystemCashPaisa: prev.expectedSystemCashPaisa + amountPaisa,
      }));
    }

    if (isServerLive && !isOffline) {
      api.accounts.transfer({
        fromAccountId: fromAccount.includes('ক্যাশ') ? 'acc-cash' : 'acc-bank',
        toAccountId: toAccount.includes('ক্যাশ') ? 'acc-cash' : 'acc-bank',
        amountPaisa,
        note: note || `স্থানান্তর: ${fromAccount} হতে ${toAccount}`,
      }).catch((err) => console.warn('Account transfer sync failed:', err));
    }

    alert(`টাকা স্থানান্তর সম্পন্ন: ${fromAccount} হতে ${toAccount}-এ ৳${amountPaisa / 100} জমা করা হয়েছে।`);
  };

  // 7. Add Expense
  const handleAddExpense = (newExp: ExpenseRecord) => {
    // Day Close Guard (Audit Integrity)
    if (dayClose.isClosed) {
      alert('সতর্কতা: আজকের ডে-ক্লোজ সম্পন্ন হয়েছে! ডে-ক্লোজের পর নতুন খরচ এন্ট্রি করা যাবে না।');
      return;
    }

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

    logAuditAction(
      'খরচ এন্ট্রি',
      'expense',
      newExp.id,
      `খরচের খাত: ${newExp.category} • টাকা: ৳${(newExp.amountPaisa / 100).toLocaleString('bn-BD')} (${newExp.note || 'নোট নেই'})`
    );
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

    logAuditAction(
      'ডে-ক্লোজ ও হিসাব লক',
      'day_close',
      'dayclose-today',
      `আজকের হিসাব ক্লোজ ও লক সম্পন্ন। ড্রয়ার ক্যাশ গণনা: ৳${(countedCashPaisa / 100).toLocaleString('bn-BD')}, অমিল: ৳${((countedCashPaisa - dayClose.expectedSystemCashPaisa) / 100).toLocaleString('bn-BD')} • নোট: ${note || 'নোট নেই'}`
    );

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

    logAuditAction(
      'দোকান প্রোফাইল আপডেট',
      'settings',
      updated.id,
      `দোকানের নাম (${updated.shopNameBn}), ঠিকানা (${updated.address}) বা প্রোপ্রাইটর তথ্য আপডেট করা হয়েছে।`
    );
  };

  // 10. Add Return Handler (Stock Restoration & Party Ledger Adjustment, BUG-POS-03)
  const handleAddReturn = async (ret: ReturnRecord) => {
    setReturns((prev) => [ret, ...prev]);

    const isSaleReturn = ret.type === 'sale_return';
    const returnedKg = ret.items.reduce((sum, it) => sum + (it.totalKg || it.quantity || 0), 0);

    // 1. Stock adjustment
    setProducts((prev) =>
      prev.map((prod) => {
        const item = ret.items.find((it) => it.productId === prod.id);
        if (item) {
          const deltaKg = item.totalKg || item.quantity || 0;
          const newStock = isSaleReturn ? prod.stockKg + deltaKg : Math.max(0, prod.stockKg - deltaKg);
          return { ...prod, stockKg: newStock };
        }
        return prod;
      })
    );

    // 2. Party ledger balance adjustment
    const matchedParty = parties.find((p) => p.name === ret.partyName);
    if (ret.totalAmountPaisa > 0 && matchedParty) {
      setParties((prev) =>
        prev.map((party) => {
          if (party.id === matchedParty.id) {
            const newBal = isSaleReturn
              ? Math.max(0, party.balancePaisa - ret.totalAmountPaisa)
              : party.balancePaisa - ret.totalAmountPaisa;
            return { ...party, balancePaisa: newBal };
          }
          return party;
        })
      );
    }

    // 3. Cloud Backend Sync
    if (isServerLive && !isOffline) {
      try {
        if (isSaleReturn) {
          await api.returns.createSaleReturn({
            warehouseId: warehouses[0]?.id || 'wh-01',
            clientId: matchedParty?.id,
            productId: ret.items[0]?.productId,
            unitId: 'unit-kg',
            qtyUnit: ret.items[0]?.quantity || 0,
            refundAmountPaisa: ret.totalAmountPaisa,
            reason: ret.reason,
          });
        } else {
          await api.returns.createPurchaseReturn({
            warehouseId: warehouses[0]?.id || 'wh-01',
            vendorId: matchedParty?.id,
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

    logAuditAction(
      isSaleReturn ? 'বিক্রয় ফেরত (ক্রেডিট নোট)' : 'ক্রয় ফেরত (ডেবিট নোট)',
      'return',
      ret.id,
      `নথি #${ret.docNo}: ${ret.partyName} হতে ${returnedKg} কেজি চাল ফেরত (${isSaleReturn ? 'স্টক বৃদ্ধি ও বাকি হ্রাস' : 'স্টক হ্রাস ও দেনা হ্রাস'})। ফেরত মূল্য: ৳${(ret.totalAmountPaisa / 100).toLocaleString('bn-BD')}`
    );
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

      {/* Subscription Expiry Alert Banner */}
      {tenant.trialDaysLeft <= 7 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-amber-600 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              {lang === 'bn'
                ? `আপনার চালের দোকান SaaS লাইসেন্সের মেয়াদ শেষ হতে আর মাত্র ${tenant.trialDaysLeft} দিন বাকি! নিরবচ্ছিন্ন ক্লাউড সেবা বজায় রাখতে এখনই প্ল্যান রিনিউ বা আপগ্রেড করুন।`
                : `Your subscription expires in ${tenant.trialDaysLeft} days! Please renew or upgrade your plan to maintain uninterrupted cloud service.`}
            </span>
          </div>
          <button
            onClick={() => handleSelectTab('settings')}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition text-[11px] font-bold shrink-0 ml-2 cursor-pointer"
          >
            {lang === 'bn' ? 'প্ল্যান রিনিউ করুন →' : 'Renew Plan →'}
          </button>
        </div>
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6">
        
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          lang={lang}
          userRole={userRole}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              products={products}
              sales={sales}
              parties={parties}
              dayClose={dayClose}
              tenant={tenant}
              lang={lang}
              numFormat={numFormat}
              userRole={userRole}
              onSelectTab={handleSelectTab}
              onOpenReceipt={(inv) => handleOpenReceipt(inv, true)}
            />
          )}

          {activeTab === 'pos' && (
            <QuickPOS
              products={products}
              parties={parties}
              warehouses={warehouses}
              lang={lang}
              numFormat={numFormat}
              userRole={userRole}
              isDayClosed={dayClose.isClosed}
              onCompleteSale={handleCompleteSale}
              onOpenReceipt={(inv) => handleOpenReceipt(inv, false)}
              onAddParty={handleCreateParty}
              onNavigateTab={handleSelectTab}
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
              isDayClosed={dayClose.isClosed}
              onOpenReceipt={(inv) => handleOpenReceipt(inv, true)}
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
              onUpdateProduct={(up) => setProducts((prev) => prev.map((p) => (p.id === up.id ? up : p)))}
              onDeleteProduct={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
            />
          )}

          {activeTab === 'parties' && (
            <PartyLedgerView
              parties={parties}
              lang={lang}
              numFormat={numFormat}
              onCreateParty={handleCreateParty}
              onUpdatePartyBalance={handleUpdatePartyBalance}
            />
          )}

          {activeTab === 'due-collection' && (
            <DueCollectionView
              parties={parties}
              lang={lang}
              numFormat={numFormat}
              onCollectDue={handleUpdatePartyBalance}
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
              onAccountTransfer={handleAccountTransfer}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsHub
              products={products}
              warehouses={warehouses}
              sales={sales}
              expenses={expenses}
              parties={parties}
              returns={returns}
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
      </div>

      {/* Global Developer & Support Footer */}
      <footer className="border-t border-slate-200/90 bg-white/95 py-2.5 px-4 text-center text-[11px] text-slate-500 shadow-xs mb-16 sm:mb-0 w-full z-10">
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

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lang={lang}
      />

      {/* Printable Thermal Receipt & A4 Invoice Modal */}
      {activeReceipt && (
        <ThermalReceipt
          invoice={activeReceipt.invoice}
          tenant={tenant}
          lang={lang}
          numFormat={numFormat}
          isReprint={activeReceipt.isReprint}
          partyBalancePaisa={
            parties.find(
              (p) =>
                (activeReceipt.invoice.clientId && p.id === activeReceipt.invoice.clientId) ||
                p.name === activeReceipt.invoice.clientName
            )?.balancePaisa
          }
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
        onAddProducts={async (newProds) => {
          setProducts((prev) => [...prev, ...newProds]);
          // Persist each onboarding rice product to database (BUG-05)
          for (const p of newProds) {
            try {
              await api.products.create({
                nameBn: p.nameBn,
                nameEn: p.nameEn,
                category: p.category,
                variety: p.variety,
                grade: p.grade,
                sku: p.sku,
                stockKg: p.stockKg,
                minStockAlertKg: p.minStockKg,
                costPricePaisa: p.wacPerKgPaisa,
                retailPricePaisa: p.retailPricePaisa,
                wholesalePricePaisa: p.wholesalePricePaisa,
                specialPricePaisa: p.wholesalePricePaisa,
              });
            } catch (err) {
              console.warn('Could not persist onboarding product:', err);
            }
          }
        }}
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
