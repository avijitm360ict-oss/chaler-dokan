import { RiceProduct, Warehouse, Party, SaleInvoice, PurchaseBill, ExpenseRecord, DayCloseRecord, TenantInfo } from '../types';

export const initialTenant: TenantInfo = {
  id: 'tenant-001',
  name: 'মেসার্স বিসমিল্লাহ চাউল আড়ত',
  shopNameBn: 'মেসার্স বিসমিল্লাহ চাউল আড়ত ও স্টোর',
  shopNameEn: 'M/S Bismillah Rice Store & Arot',
  ownerName: 'হাজী মো: রফিকুল ইসলাম',
  proprietor: 'হাজী মো: রফিকুল ইসলাম',
  phone: '01712-345678',
  address: 'দোকান নং ১২, বাবুবাজার চাউল মার্কেট, ঢাকা-১১০০',
  status: 'active',
  trialDaysLeft: 14,
  planName: 'প্রো প্ল্যান (Pro Plan)'
};

export const standardUnits = [
  { id: 'u-kg', nameBn: 'কেজি', nameEn: 'Kg', kgPerUnit: 1, isBase: true },
  { id: 'u-sack-50', nameBn: '৫০ কেজি বস্তা', nameEn: '50 Kg Bag', kgPerUnit: 50, isBase: false },
  { id: 'u-sack-25', nameBn: '২৫ কেজি বস্তা', nameEn: '25 Kg Bag', kgPerUnit: 25, isBase: false },
  { id: 'u-mon-40', nameBn: 'মণ (৪০ কেজি)', nameEn: 'Mon (40 Kg)', kgPerUnit: 40, isBase: false },
];

export const initialProducts: RiceProduct[] = [
  {
    id: 'prod-1',
    nameBn: 'কুষ্টিয়ার অটো স্পেশাল মিনিকেট',
    nameEn: 'Kushtia Auto Special Miniket',
    variety: 'মিনিকেট',
    grade: 'স্পেশাল',
    category: 'সিদ্ধ',
    sku: 'MIN-KUS-01',
    stockKg: 3250, // 65 bags of 50kg
    minStockKg: 500,
    wacPerKgPaisa: 6600, // 66.00 Taka
    retailPricePaisa: 7400, // 74.00 Taka / kg
    wholesalePricePaisa: 6950, // 69.50 Taka / kg
    sack50RetailPricePaisa: 365000, // 3,650 Taka / 50kg bag
    sack50WholesalePricePaisa: 345000, // 3,450 Taka / 50kg bag
    availableUnits: standardUnits,
  },
  {
    id: 'prod-2',
    nameBn: 'দিনাজপুরের প্রিমিয়াম নাজিরশাইল',
    nameEn: 'Dinajpur Premium Najirshail',
    variety: 'নাজিরশাইল',
    grade: 'প্রিমিয়াম',
    category: 'সিদ্ধ',
    sku: 'NAJ-DIN-02',
    stockKg: 2450, // 49 bags
    minStockKg: 400,
    wacPerKgPaisa: 7500, // 75.00 Taka
    retailPricePaisa: 8400, // 84.00 Taka / kg
    wholesalePricePaisa: 7900, // 79.00 Taka / kg
    sack50RetailPricePaisa: 415000, // 4,150 Taka / bag
    sack50WholesalePricePaisa: 392000, // 3,920 Taka / bag
    availableUnits: standardUnits,
  },
  {
    id: 'prod-3',
    nameBn: 'কাটারিভোগ সুগন্ধি পোলাও চাল',
    nameEn: 'Katari Bhog Aromatic Polao Rice',
    variety: 'কাটারিভোগ',
    grade: 'স্পেশাল সুগন্ধি',
    category: 'সুগন্ধি',
    sku: 'KAT-POL-03',
    stockKg: 1100, // 22 bags
    minStockKg: 250,
    wacPerKgPaisa: 11800, // 118.00 Taka
    retailPricePaisa: 13500, // 135.00 Taka / kg
    wholesalePricePaisa: 12600, // 126.00 Taka / kg
    sack50RetailPricePaisa: 665000,
    sack50WholesalePricePaisa: 625000,
    availableUnits: standardUnits,
  },
  {
    id: 'prod-4',
    nameBn: 'বিআর-২৮ চাল (মাঝারি মোটা)',
    nameEn: 'BR-28 Medium Grain Rice',
    variety: 'বিআর-২৮',
    grade: 'রেগুলার',
    category: 'সিদ্ধ',
    sku: 'BR28-REG-04',
    stockKg: 4200, // 84 bags
    minStockKg: 600,
    wacPerKgPaisa: 5100, // 51.00 Taka
    retailPricePaisa: 5800, // 58.00 Taka / kg
    wholesalePricePaisa: 5400, // 54.00 Taka / kg
    sack50RetailPricePaisa: 285000,
    sack50WholesalePricePaisa: 268000,
    availableUnits: standardUnits,
  },
  {
    id: 'prod-5',
    nameBn: 'পাইজাম স্ট্যান্ডার্ড চাল',
    nameEn: 'Paijam Standard Rice',
    variety: 'পাইজাম',
    grade: 'স্ট্যান্ডার্ড',
    category: 'সিদ্ধ',
    sku: 'PAI-STD-05',
    stockKg: 1950,
    minStockKg: 300,
    wacPerKgPaisa: 5600,
    retailPricePaisa: 6400,
    wholesalePricePaisa: 5950,
    sack50RetailPricePaisa: 315000,
    sack50WholesalePricePaisa: 295000,
    availableUnits: standardUnits,
  },
  {
    id: 'prod-6',
    nameBn: 'চিনিগুঁড়া প্রিমিয়াম পোলাও চাল',
    nameEn: 'Chinigura Premium Polao Rice',
    variety: 'চিনিগুঁড়া',
    grade: 'রপ্তানি মান',
    category: 'সুগন্ধি',
    sku: 'CHI-EXP-06',
    stockKg: 650, // low stock warning threshold near
    minStockKg: 500,
    wacPerKgPaisa: 12400,
    retailPricePaisa: 14500,
    wholesalePricePaisa: 13400,
    sack50RetailPricePaisa: 710000,
    sack50WholesalePricePaisa: 665000,
    availableUnits: standardUnits,
  },
  {
    id: 'prod-7',
    nameBn: 'বাসমতি চাল (ইন্ডিয়ান প্রিমিয়াম)',
    nameEn: 'Basmati Indian Premium',
    variety: 'বাসমতি',
    grade: 'লং গ্রেইন ক্লাসিক',
    category: 'আতপ',
    sku: 'BAS-IND-07',
    stockKg: 850,
    minStockKg: 200,
    wacPerKgPaisa: 17200,
    retailPricePaisa: 19800,
    wholesalePricePaisa: 18400,
    sack50RetailPricePaisa: 975000,
    sack50WholesalePricePaisa: 915000,
    availableUnits: standardUnits,
  },
  {
    id: 'prod-8',
    nameBn: 'দেশি বালাম আতপ চাল',
    nameEn: 'Deshi Balam Atap Rice',
    variety: 'বালাম',
    grade: 'দেশি ফ্রেশ',
    category: 'আতপ',
    sku: 'BAL-DES-08',
    stockKg: 1500,
    minStockKg: 300,
    wacPerKgPaisa: 6200,
    retailPricePaisa: 7000,
    wholesalePricePaisa: 6500,
    sack50RetailPricePaisa: 345000,
    sack50WholesalePricePaisa: 322000,
    availableUnits: standardUnits,
  }
];

export const initialWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    nameBn: 'প্রধান দোকান ও বিক্রয় কেন্দ্র',
    nameEn: 'Main Shop & Front Godown',
    location: 'বাবুবাজার, দোকান নং ১২',
    isDefault: true,
    totalStockKg: 8450
  },
  {
    id: 'wh-2',
    nameBn: 'নদী বন্দর আড়ত গোডাউন নং ১',
    nameEn: 'Sadarghat River Godown #1',
    location: 'সদরঘাট লঞ্চ টার্মিনাল রোড',
    isDefault: false,
    totalStockKg: 6200
  },
  {
    id: 'wh-3',
    nameBn: 'কেরানীগঞ্জ পাইকারি রিজার্ভ গোডাউন',
    nameEn: 'Keraniganj Wholesale Reserve Godown',
    location: 'কেরানীগঞ্জ হাইওয়ে সংলগ্ন',
    isDefault: false,
    totalStockKg: 1200
  }
];

export const initialParties: Party[] = [
  {
    id: 'party-1',
    name: 'হাজী রিয়াজ উদ্দিন',
    shopName: 'রিয়াজ ব্রাদার্স গ্রোসারি',
    phone: '01819-112233',
    address: 'চকবাজার, ঢাকা',
    type: 'client',
    clientType: 'wholesale',
    balancePaisa: 4850000, // 48,500 Taka Due
    creditLimitPaisa: 10000000, // 1,00,000 Taka limit
    totalSoldPaisa: 35000000
  },
  {
    id: 'party-2',
    name: 'আবুল কাশেম বেপারি',
    shopName: 'কাশেম এন্টারপ্রাইজ',
    phone: '01911-445566',
    address: 'কাওরান বাজার, ঢাকা',
    type: 'client',
    clientType: 'wholesale',
    balancePaisa: 8400000, // 84,000 Taka Due
    creditLimitPaisa: 15000000,
    totalSoldPaisa: 78000000
  },
  {
    id: 'party-3',
    name: 'ভাই ভাই বিরিয়ানি অ্যান্ড রেস্তোরাঁ',
    shopName: 'ভাই ভাই হোটেল',
    phone: '01715-998877',
    address: 'নাজিরা বাজার, পুরান ঢাকা',
    type: 'client',
    clientType: 'dealer',
    balancePaisa: 1850000, // 18,500 Taka Due
    creditLimitPaisa: 5000000,
    totalSoldPaisa: 22000000
  },
  {
    id: 'party-4',
    name: 'মেসার্স সুবর্ণা অটো রাইস মিল',
    shopName: 'সুবর্ণা অটো রাইস মিলস্ লিঃ',
    phone: '01711-223344',
    address: 'মজুপুর, কুষ্টিয়া',
    type: 'vendor',
    vendorType: 'mill',
    balancePaisa: 14500000, // We owe them 1,45,000 Taka
    creditLimitPaisa: 50000000,
    totalPurchasedPaisa: 125000000
  },
  {
    id: 'party-5',
    name: 'দিনাজপুর সততা চালের আড়ত',
    shopName: 'সততা ট্রেডার্স',
    phone: '01812-778899',
    address: 'বাহাদুরবাজার, দিনাজপুর',
    type: 'vendor',
    vendorType: 'arot',
    balancePaisa: 6200000, // We owe them 62,000 Taka
    creditLimitPaisa: 30000000,
    totalPurchasedPaisa: 58000000
  }
];

export const initialSales: SaleInvoice[] = [
  {
    id: 'inv-001',
    docNo: 'INV-2026-000101',
    date: '2026-10-14T11:30:00',
    clientName: 'হাজী রিয়াজ উদ্দিন',
    clientPhone: '01819-112233',
    clientType: 'wholesale',
    warehouseId: 'wh-1',
    items: [
      {
        product: initialProducts[0], // Miniket
        selectedUnit: standardUnits[1], // 50kg bag
        unitQuantity: 10, // 10 bags = 500 kg
        totalKg: 500,
        unitPricePaisa: 345000,
        discountPaisa: 0,
        lineTotalPaisa: 3450000, // 34,500 Taka
        costSnapshotPaisa: 3300000 // cost 66/kg = 33,000 Taka
      },
      {
        product: initialProducts[1], // Najirshail
        selectedUnit: standardUnits[1], // 50kg bag
        unitQuantity: 5, // 5 bags = 250 kg
        totalKg: 250,
        unitPricePaisa: 392000,
        discountPaisa: 0,
        lineTotalPaisa: 1960000, // 19,600 Taka
        costSnapshotPaisa: 1875000 // cost 75/kg = 18,750 Taka
      }
    ],
    subtotalPaisa: 5410000, // 54,100 Taka
    discountPaisa: 60000,   // 600 Taka discount
    deliveryChargePaisa: 50000, // 500 Taka truck fare
    grandTotalPaisa: 5400000, // 54,000 Taka
    paidTotalPaisa: 3000000,  // 30,000 paid
    dueAmountPaisa: 2400000,  // 24,000 due
    payments: [
      { method: 'cash', amountPaisa: 1500000, accountName: 'প্রধান ক্যাশ ড্রয়ার' },
      { method: 'bkash', amountPaisa: 1500000, accountName: 'বিকাশ মার্চেন্ট', trxId: 'BK9X2451' }
    ],
    status: 'confirmed',
    totalKg: 750,
    totalCostSnapshotPaisa: 5175000, // 51,750 Taka cost
    estimatedProfitPaisa: 225000,    // 2,250 Taka profit
    createdBy: 'ক্যাশিয়ার - মো: শামীম'
  },
  {
    id: 'inv-002',
    docNo: 'INV-2026-000102',
    date: '2026-10-14T13:45:00',
    clientName: 'কাউন্টার কাস্টমার (খুচরা)',
    clientPhone: '01700-000000',
    clientType: 'walkin',
    warehouseId: 'wh-1',
    items: [
      {
        product: initialProducts[0],
        selectedUnit: standardUnits[0], // 1 kg
        unitQuantity: 25, // 25 kg loose
        totalKg: 25,
        unitPricePaisa: 7400,
        discountPaisa: 0,
        lineTotalPaisa: 185000,
        costSnapshotPaisa: 165000
      },
      {
        product: initialProducts[2], // Katari Bhog
        selectedUnit: standardUnits[0],
        unitQuantity: 5,
        totalKg: 5,
        unitPricePaisa: 13500,
        discountPaisa: 0,
        lineTotalPaisa: 67500,
        costSnapshotPaisa: 59000
      }
    ],
    subtotalPaisa: 252500,
    discountPaisa: 2500,
    deliveryChargePaisa: 0,
    grandTotalPaisa: 250000, // 2,500 Taka
    paidTotalPaisa: 250000,
    dueAmountPaisa: 0,
    payments: [
      { method: 'cash', amountPaisa: 250000, accountName: 'প্রধান ক্যাশ ড্রয়ার' }
    ],
    status: 'confirmed',
    totalKg: 30,
    totalCostSnapshotPaisa: 224000,
    estimatedProfitPaisa: 26000,
    createdBy: 'মালিক - রফিকুল ইসলাম'
  }
];

export const initialPurchases: PurchaseBill[] = [
  {
    id: 'pur-001',
    docNo: 'PUR-2026-000045',
    date: '2026-10-13T09:00:00',
    vendorName: 'মেসার্স সুবর্ণা অটো রাইস মিল',
    vendorPhone: '01711-223344',
    warehouseId: 'wh-1',
    vendorBillNo: 'MILL-KUS-891',
    items: [
      {
        product: initialProducts[0], // Miniket
        unit: standardUnits[1], // 50kg sack
        unitQuantity: 60, // 3,000 kg
        totalKg: 3000,
        rawPricePerKgPaisa: 6350, // 63.50 Taka raw price
        truckFareAllocatedPaisa: 175, // +1.75 Taka/kg truck fare
        labourFareAllocatedPaisa: 75, // +0.75 Taka/kg labour
        landedCostPerKgPaisa: 6600, // 66.00 Taka Landed Cost!
        lineTotalPaisa: 19800000 // 1,98,000 Taka
      }
    ],
    subtotalPaisa: 19050000,
    truckFarePaisa: 525000,
    labourFarePaisa: 225000,
    otherExpensesPaisa: 0,
    grandTotalPaisa: 19800000,
    paidAmountPaisa: 10000000,
    dueAmountPaisa: 9800000,
    status: 'confirmed'
  }
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    date: '2026-10-14T10:15:00',
    category: 'labour',
    categoryNameBn: 'দৈনিক লেবার ও কুলি খরচ (আনলোডিং)',
    amountPaisa: 180000, // 1,800 Taka
    account: 'প্রধান ক্যাশ ড্রয়ার',
    note: '৬০ বস্তা মিনিকেট আনলোড বাবদ'
  },
  {
    id: 'exp-2',
    date: '2026-10-14T12:00:00',
    category: 'tea_snacks',
    categoryNameBn: 'দোকানের চা-নাস্তা ও মেহমানদারি',
    amountPaisa: 35000, // 350 Taka
    account: 'প্রধান ক্যাশ ড্রয়ার',
    note: 'বেপারিদের আপ্যায়ন'
  },
  {
    id: 'exp-3',
    date: '2026-10-13T16:00:00',
    category: 'electricity',
    categoryNameBn: 'দোকান ও গোডাউন বিদ্যুৎ বিল',
    amountPaisa: 420000, // 4,200 Taka
    account: 'বিকাশ মার্চেন্ট'
  }
];

export const initialDayClose: DayCloseRecord = {
  id: 'close-2026-10-13',
  date: '2026-10-13',
  openingCashPaisa: 2500000, // 25,000
  totalSalesCashPaisa: 6850000,
  dueCollectedCashPaisa: 1500000,
  expensesPaidCashPaisa: 215000,
  vendorPaidCashPaisa: 5000000,
  expectedSystemCashPaisa: 5635000, // 56,350 Taka
  actualCountedCashPaisa: 5635000,
  discrepancyPaisa: 0,
  closedBy: 'হাজী মো: রফিকুল ইসলাম (মালিক)',
  notes: 'আলহামদুলিল্লাহ, গতকালের ক্যাশ সম্পূর্ণ মিলেছে।',
  isClosed: true
};

export const initialStockMovements: any[] = [
  {
    id: 'mov-1',
    date: '2026-10-14T11:30:00',
    type: 'sale',
    productId: 'prod-1',
    productName: 'কুষ্টিয়ার অটো স্পেশাল মিনিকেট',
    warehouseName: 'প্রধান দোকান ও বিক্রয় কেন্দ্র',
    diffKg: -500,
    resultingStockKg: 3250,
    referenceDocNo: 'INV-2026-000101',
    user: 'ক্যাশিয়ার শামীম'
  },
  {
    id: 'mov-2',
    date: '2026-10-13T09:00:00',
    type: 'purchase',
    productId: 'prod-1',
    productName: 'কুষ্টিয়ার অটো স্পেশাল মিনিকেট',
    warehouseName: 'প্রধান দোকান ও বিক্রয় কেন্দ্র',
    diffKg: 3000,
    resultingStockKg: 3750,
    referenceDocNo: 'PUR-2026-000045',
    user: 'ম্যানেজার তারেক'
  },
  {
    id: 'mov-3',
    date: '2026-10-12T17:00:00',
    type: 'adjustment',
    productId: 'prod-1',
    productName: 'কুষ্টিয়ার অটো স্পেশাল মিনিকেট',
    warehouseName: 'প্রধান দোকান ও বিক্রয় কেন্দ্র',
    diffKg: -15,
    resultingStockKg: 750,
    referenceDocNo: 'ADJ-2026-008',
    reason: 'রোদে শুকিয়ে ওজন হ্রাস (Moisture loss)',
    user: 'মালিক রফিকুল ইসলাম'
  }
];

export const initialReturns: any[] = [
  {
    id: 'ret-001',
    docNo: 'RET-2026-000012',
    date: '2026-10-14T14:10:00',
    type: 'sale_return',
    originalDocNo: 'INV-2026-000098',
    partyName: 'হাজী রিয়াজ উদ্দিন',
    items: [
      {
        productId: 'prod-1',
        productName: 'কুষ্টিয়ার অটো স্পেশাল মিনিকেট',
        unitName: '৫০ কেজি বস্তা',
        quantity: 1,
        totalKg: 50,
        ratePaisa: 345000,
        totalAmountPaisa: 345000,
        condition: 'good'
      }
    ],
    reason: 'কাস্টমার ভুল গ্রেড অর্ডার দিয়েছিলেন',
    settlementMethod: 'deduct_due',
    totalAmountPaisa: 345000,
    approvedBy: 'মালিক রফিকুল ইসলাম'
  }
];

export const initialAuditLogs: any[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-15T09:15:00',
    userName: 'হাজী মো: রফিকুল ইসলাম',
    userRole: 'owner',
    action: 'বাজারদর আপডেট',
    entityType: 'rate',
    entityId: 'prod-1',
    details: 'মিনিকেট চালের খুচরা দর পরিবর্তন করা হয়েছে',
    oldValue: '৭২ টাকা/কেজি',
    newValue: '৭৪ টাকা/কেজি'
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-14T15:20:00',
    userName: 'মো: শামীম (ক্যাশিয়ার)',
    userRole: 'cashier',
    action: 'ইনভয়েস বাতিল',
    entityType: 'sale',
    entityId: 'INV-2026-000095',
    details: 'কাস্টমার নগদ টাকা না থাকায় অর্ডার বাতিল',
    oldValue: 'confirmed',
    newValue: 'voided'
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-13T20:30:00',
    userName: 'হাজী মো: রফিকুল ইসলাম',
    userRole: 'owner',
    action: 'ডে ক্লোজ লক',
    entityType: 'day_close',
    entityId: 'close-2026-10-13',
    details: 'দিনের হিসাব সফলভাবে মিলেছে ও লক করা হয়েছে',
    oldValue: 'open',
    newValue: 'closed'
  }
];

export const sampleImportRows: any[] = [
  { rowNumber: 1, name: 'কুষ্টিয়ার মিনিকেট', variety: 'মিনিকেট', category: 'সিদ্ধ', unit: '৫০ কেজি বস্তা', price: '৭৪', stock: '৩২৫০', isValid: true },
  { rowNumber: 2, name: 'দিনাজপুর নাজিরশাইল', variety: 'নাজিরশাইল', category: 'সিদ্ধ', unit: '৫০ কেজি বস্তা', price: '৮৪', stock: '২৪৫০', isValid: true },
  { rowNumber: 3, name: '', variety: 'বাসমতি', category: 'আতপ', unit: '৫০ কেজি বস্তা', price: '১৯৮', stock: '৮৫০', isValid: false, errorMessage: 'চালের নাম বাধ্যতামূলক' },
  { rowNumber: 4, name: 'কালিজিরা সুগন্ধি', variety: 'কালিজিরা', category: 'পোলাও', unit: '২৫ কেজি বস্তা', price: 'বিনামূল্যে', stock: '৫০০', isValid: false, errorMessage: 'দর সংখ্যা (Number) হতে হবে' },
  { rowNumber: 5, name: 'বিআর-২৮ চাল', variety: 'বিআর-২৮', category: 'সিদ্ধ', unit: '৫০ কেজি বস্তা', price: '৫৮', stock: '৪২০০', isValid: true },
];

