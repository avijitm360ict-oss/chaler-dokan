export type Language = 'bn' | 'en';
export type NumberFormat = 'bn' | 'en'; // ১,২৩,৪৫৬ vs 1,23,456

export interface TenantInfo {
  id: string;
  name: string;
  shopNameBn: string;
  shopNameEn: string;
  ownerName: string;
  phone: string;
  address: string;
  proprietor: string;
  status: 'trial' | 'active' | 'suspended';
  trialDaysLeft: number;
  planName: string;
}

export type UnitType = 'kg' | 'sack_50' | 'sack_25' | 'mon_40';

export interface ProductUnitConfig {
  id: string;
  nameBn: string;
  nameEn: string;
  kgPerUnit: number; // 1 for kg, 50 for 50kg bag, 25 for 25kg, 40 for Mon
  isBase: boolean;
}

export interface RiceProduct {
  id: string;
  nameBn: string;
  nameEn: string;
  variety: string; // মিনিকেট, নাজিরশাইল, বাসমতি, কাটারিভোগ, বিআর-২৮, পাইজাম
  grade: string;   // স্পেশাল, রেগুলার, মোটা
  category: string; // আতপ, সিদ্ধ, সুগন্ধি, পোলাও
  sku: string;
  stockKg: number;
  minStockKg: number;
  wacPerKgPaisa: number; // Weighted Average Cost in Paisa (e.g. 6800 = 68.00 Taka)
  retailPricePaisa: number; // Retail price per KG in Paisa (e.g. 7400 = 74.00 Taka)
  wholesalePricePaisa: number; // Wholesale price per KG in Paisa (e.g. 7000 = 70.00 Taka)
  sack50RetailPricePaisa: number; // 50kg sack retail
  sack50WholesalePricePaisa: number; // 50kg sack wholesale
  availableUnits: ProductUnitConfig[];
  imageUrl?: string;
}

export interface Warehouse {
  id: string;
  nameBn: string;
  nameEn: string;
  location: string;
  isDefault: boolean;
  totalStockKg: number;
}

export interface CartItem {
  product: RiceProduct;
  selectedUnit: ProductUnitConfig;
  unitQuantity: number; // count of selected unit (e.g. 2 sacks or 15 kg)
  totalKg: number; // calculated kg
  unitPricePaisa: number;
  customPricePaisa?: number; // if manual price allowed
  discountPaisa: number;
  lineTotalPaisa: number;
  costSnapshotPaisa: number; // WAC snapshot
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'due';

export interface PaymentSplit {
  method: PaymentMethod;
  amountPaisa: number;
  accountName?: string;
  trxId?: string;
}

export interface SaleInvoice {
  id: string;
  docNo: string;
  date: string;
  clientName: string;
  clientPhone: string;
  clientType: 'retail' | 'wholesale' | 'dealer' | 'walkin';
  warehouseId: string;
  items: CartItem[];
  subtotalPaisa: number;
  discountPaisa: number;
  deliveryChargePaisa: number;
  grandTotalPaisa: number;
  paidTotalPaisa: number;
  dueAmountPaisa: number;
  payments: PaymentSplit[];
  status: 'confirmed' | 'voided';
  voidReason?: string;
  totalKg: number;
  totalCostSnapshotPaisa: number;
  estimatedProfitPaisa: number;
  createdBy: string;
}

export interface Party {
  id: string;
  name: string;
  shopName?: string;
  phone: string;
  address: string;
  type: 'client' | 'vendor' | 'both';
  clientType?: 'retail' | 'wholesale' | 'dealer';
  vendorType?: 'mill' | 'arot' | 'mohajon';
  balancePaisa: number; // Positive = Customer owes us / We owe vendor
  creditLimitPaisa: number;
  totalPurchasedPaisa?: number;
  totalSoldPaisa?: number;
}

export interface PurchaseBill {
  id: string;
  docNo: string;
  date: string;
  vendorName: string;
  vendorPhone: string;
  warehouseId: string;
  vendorBillNo?: string;
  items: {
    product: RiceProduct;
    unit: ProductUnitConfig;
    unitQuantity: number;
    totalKg: number;
    rawPricePerKgPaisa: number;
    truckFareAllocatedPaisa: number;
    labourFareAllocatedPaisa: number;
    landedCostPerKgPaisa: number; // Raw + Truck + Labour
    lineTotalPaisa: number;
  }[];
  subtotalPaisa: number;
  truckFarePaisa: number;
  labourFarePaisa: number;
  otherExpensesPaisa: number;
  grandTotalPaisa: number;
  paidAmountPaisa: number;
  dueAmountPaisa: number;
  status: 'confirmed' | 'voided';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'rent' | 'electricity' | 'labour' | 'transport' | 'mobile_bill' | 'tea_snacks' | 'other';
  categoryNameBn: string;
  amountPaisa: number;
  account: string;
  note?: string;
}

export interface DayCloseRecord {
  id: string;
  date: string;
  openingCashPaisa: number;
  totalSalesCashPaisa: number;
  dueCollectedCashPaisa: number;
  expensesPaidCashPaisa: number;
  vendorPaidCashPaisa: number;
  expectedSystemCashPaisa: number;
  actualCountedCashPaisa: number;
  discrepancyPaisa: number;
  closedBy: string;
  notes?: string;
  isClosed: boolean;
}
