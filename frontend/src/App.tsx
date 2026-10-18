import React, { useState } from 'react';
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

export function App() {
  // App Config & Localization
  const [lang, setLang] = useState<Language>('bn');
  const [numFormat, setNumFormat] = useState<NumberFormat>('bn');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
  const handleCompleteSale = (invoice: SaleInvoice) => {
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

    alert('ইনভয়েস বাতিল (Voided) করা হয়েছে এবং চালের স্টক ফিরিয়ে নেওয়া হয়েছে।');
  };

  // 3. Daily Rates update handler
  const handleUpdateRates = (updatedProducts: RiceProduct[]) => {
    setProducts(updatedProducts);
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
    alert(`স্টক সফলভাবে এডজাস্ট করা হয়েছে (${diffKg >= 0 ? '+' : ''}${diffKg} কেজি)। কারণ: ${reason}`);
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
    alert('আলহামদুলিল্লাহ, আজকের ডে-ক্লোজ সম্পন্ন হয়েছে এবং হিসাব লক করা হয়েছে।');
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
              onAddReturn={(ret) => setReturns((prev) => [ret, ...prev])}
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
              onUpdateTenant={(updated) => setTenant(updated)}
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
        onImportSuccess={(count) => {
          setShowImportWizard(false);
          alert(`${count}টি চালের রেকর্ড সফলভাবে ইম্পোর্ট সম্পন্ন হয়েছে!`);
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

    </div>
  );
}

export default App;
