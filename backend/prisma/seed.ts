import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌾 Seeding চালের দোকান SaaS database...');

  // 1. Subscription Plan
  const plan = await prisma.plan.upsert({
    where: { id: 'plan-standard-001' },
    update: {},
    create: {
      id: 'plan-standard-001',
      name: 'আড়তদার স্ট্যান্ডার্ড (SaaS)',
      maxUsers: 5,
      maxWarehouses: 3,
      pricePaisa: BigInt(150000), // 1,500 BDT
      features: {
        pos: true,
        wac: true,
        parties: true,
        reports: true,
        thermalPrint: true,
      },
    },
  });

  // 2. Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { phone: '01711000000' },
    update: {},
    create: {
      id: 'tenant-demo-001',
      name: 'মেসার্স বিসমিল্লাহ চাউল আড়ত ও স্টোর',
      ownerName: 'মো: রফিকুল ইসলাম',
      phone: '01711000000',
      planId: plan.id,
      status: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      languageDefault: 'bn',
      settings: {
        tradeLicense: 'TRAD-DHK-2024-984',
        address: 'আড়ত পট্টি, বাদামতলী, ঢাকা',
        proprietor: 'মো: রফিকুল ইসলাম',
        printFooter: 'আমাদের সাথে ব্যবসা করার জন্য ধন্যবাদ। বিক্রিত চাল ফেরত নেওয়া হয়।',
      },
    },
  });

  // 3. Roles
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Owner' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Owner',
      permissions: {
        sales: ['view', 'create', 'void'],
        purchases: ['view', 'create'],
        inventory: ['view', 'adjust', 'transfer'],
        parties: ['view', 'create', 'collect'],
        reports: ['view', 'export'],
        settings: ['view', 'update'],
      },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Manager' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Manager',
      permissions: {
        sales: ['view', 'create'],
        purchases: ['view', 'create'],
        inventory: ['view', 'transfer'],
        parties: ['view', 'create', 'collect'],
        reports: ['view'],
      },
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Cashier' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Cashier',
      permissions: {
        sales: ['view', 'create'],
        parties: ['view'],
      },
    },
  });

  // 4. Default Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '01711000000' } },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      name: 'রফিকুল ইসলাম (মালিক)',
      phone: '01711000000',
      email: 'owner@chaldokan.bd',
      passwordHash,
      roleId: ownerRole.id,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '01811000001' } },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      name: 'শাকিল আহমেদ (ক্যাশিয়ার)',
      phone: '01811000001',
      email: 'cashier@chaldokan.bd',
      passwordHash,
      roleId: cashierRole.id,
      status: 'active',
    },
  });

  // 5. Warehouses
  const mainGodown = await prisma.warehouse.upsert({
    where: { id: 'wh-main-001' },
    update: {},
    create: {
      id: 'wh-main-001',
      tenantId: tenant.id,
      name: 'প্রধান গোডাউন (আড়ত)',
      address: 'বাদামতলী ঘাট, ঢাকা',
      isDefault: true,
      status: 'active',
    },
  });

  const secondGodown = await prisma.warehouse.upsert({
    where: { id: 'wh-sec-002' },
    update: {},
    create: {
      id: 'wh-sec-002',
      tenantId: tenant.id,
      name: '২ নং গোডাউন (ঘাট সংলগ্ন)',
      address: 'সদরঘাট টার্মিনাল রোড, ঢাকা',
      isDefault: false,
      status: 'active',
    },
  });

  // 6. Accounts (Cash & Bank)
  const cashAccount = await prisma.account.upsert({
    where: { id: 'acc-cash-001' },
    update: {},
    create: {
      id: 'acc-cash-001',
      tenantId: tenant.id,
      name: 'ক্যাশ ড্রয়ার (নগদ ক্যাশ)',
      type: 'cash',
      openingBalance: BigInt(5000000), // 50,000 BDT
      currentBalance: BigInt(5000000),
      status: 'active',
    },
  });

  await prisma.account.upsert({
    where: { id: 'acc-bank-002' },
    update: {},
    create: {
      id: 'acc-bank-002',
      tenantId: tenant.id,
      name: 'সোনালী ব্যাংক (কারেন্ট হিসাব)',
      type: 'bank',
      openingBalance: BigInt(25000000), // 250,000 BDT
      currentBalance: BigInt(25000000),
      status: 'active',
    },
  });

  // 7. Expense Categories
  const expenseCats = [
    { nameBn: 'দোকান ভাড়া', nameEn: 'Shop Rent' },
    { nameBn: 'বিদ্যুৎ বিল', nameEn: 'Electricity Bill' },
    { nameBn: 'লেবার / কুলি মুজুরি', nameEn: 'Labour Wage' },
    { nameBn: 'ট্রাক ও পরিবহন ভাড়া', nameEn: 'Truck Fare' },
    { nameBn: 'আপ্যায়ন ও বিবিধ', nameEn: 'Refreshment & Misc' },
  ];
  for (const cat of expenseCats) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { tenantId: tenant.id, nameBn: cat.nameBn },
    });
    if (!existing) {
      await prisma.expenseCategory.create({
        data: {
          tenantId: tenant.id,
          nameBn: cat.nameBn,
          nameEn: cat.nameEn,
        },
      });
    }
  }

  // 8. Rice Categories
  const categoryNames = [
    { bn: 'মিনিকেট চাল', en: 'Miniket' },
    { bn: 'নাজিরশাইল চাল', en: 'Nazirshail' },
    { bn: 'বিআর-২৮ চাল', en: 'BR-28' },
    { bn: 'সুগন্ধি চাল', en: 'Aromatic Rice' },
    { bn: 'মোটা চাল (স্বর্ণা)', en: 'Swarna Coarse' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categoryNames) {
    const existing = await prisma.category.findFirst({
      where: { tenantId: tenant.id, nameBn: c.bn },
    });
    if (existing) {
      catMap.set(c.en, existing.id);
    } else {
      const created = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          nameBn: c.bn,
          nameEn: c.en,
        },
      });
      catMap.set(c.en, created.id);
    }
  }

  // 9. Rice Products with units, prices, and stock balances
  const productsData = [
    {
      id: 'prod-001',
      nameBn: 'মিনিকেট চাল (প্রিমিয়াম)',
      nameEn: 'Miniket Premium Rice',
      variety: 'মিনিকেট',
      grade: 'স্পেশাল',
      cat: 'Miniket',
      bag50PricePaisa: BigInt(350000), // 3,500 BDT per 50kg bag (70 BDT/kg)
      kgPricePaisa: BigInt(7200),       // 72 BDT per kg retail
      wacCostPerKgPaisa: BigInt(6500),  // 65 BDT cost per kg
      initialStockKg: 5000,             // 100 bags (50kg each)
      minStockKg: 500,
    },
    {
      id: 'prod-002',
      nameBn: 'নাজিরশাইল চাল (নরমাল)',
      nameEn: 'Nazirshail Standard Rice',
      variety: 'নাজিরশাইল',
      grade: 'রেগুলার',
      cat: 'Nazirshail',
      bag50PricePaisa: BigInt(380000), // 3,800 BDT per 50kg bag (76 BDT/kg)
      kgPricePaisa: BigInt(7800),       // 78 BDT per kg retail
      wacCostPerKgPaisa: BigInt(7100),  // 71 BDT cost per kg
      initialStockKg: 4000,             // 80 bags
      minStockKg: 400,
    },
    {
      id: 'prod-003',
      nameBn: 'বিআর-২৮ চাল',
      nameEn: 'BR-28 Parboiled Rice',
      variety: 'বিআর-২৮',
      grade: 'স্ট্যান্ডার্ড',
      cat: 'BR-28',
      bag50PricePaisa: BigInt(270000), // 2,700 BDT per 50kg bag (54 BDT/kg)
      kgPricePaisa: BigInt(5600),       // 56 BDT per kg retail
      wacCostPerKgPaisa: BigInt(5000),  // 50 BDT cost per kg
      initialStockKg: 6500,             // 130 bags
      minStockKg: 1000,
    },
    {
      id: 'prod-004',
      nameBn: 'চিনিগুঁড়া পোলাও চাল (সুগন্ধি)',
      nameEn: 'Chinigura Aromatic Polao Rice',
      variety: 'চিনিগুঁড়া',
      grade: 'স্পেশাল সুগন্ধি',
      cat: 'Aromatic Rice',
      bag50PricePaisa: BigInt(600000), // 6,000 BDT per 50kg bag (120 BDT/kg)
      kgPricePaisa: BigInt(12500),      // 125 BDT per kg retail
      wacCostPerKgPaisa: BigInt(11000), // 110 BDT cost per kg
      initialStockKg: 1500,             // 30 bags
      minStockKg: 200,
    },
    {
      id: 'prod-005',
      nameBn: 'কাটারিভোগ আতপ চাল (দিনাজপুর)',
      nameEn: 'Kataribhog Atash Rice',
      variety: 'কাটারিভোগ',
      grade: 'দিনাজপুর অরিজিনাল',
      cat: 'Miniket',
      bag50PricePaisa: BigInt(420000), // 4,200 BDT per 50kg bag (84 BDT/kg)
      kgPricePaisa: BigInt(8600),       // 86 BDT per kg retail
      wacCostPerKgPaisa: BigInt(7800),  // 78 BDT cost per kg
      initialStockKg: 2500,             // 50 bags
      minStockKg: 300,
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        tenantId: tenant.id,
        nameBn: item.nameBn,
        nameEn: item.nameEn,
        variety: item.variety,
        grade: item.grade,
        categoryId: catMap.get(item.cat),
        minStockKg: item.minStockKg,
        status: 'active',
      },
    });

    // Units: Base unit (kg) and 50kg sack
    const kgUnit = await prisma.productUnit.upsert({
      where: { id: `${item.id}-unit-kg` },
      update: {},
      create: {
        id: `${item.id}-unit-kg`,
        tenantId: tenant.id,
        productId: product.id,
        nameBn: 'কেজি (KG)',
        nameEn: 'kg',
        kgPerUnit: 1.0,
        isBase: true,
        isDefaultSale: false,
        isDefaultPurchase: false,
      },
    });

    const bag50Unit = await prisma.productUnit.upsert({
      where: { id: `${item.id}-unit-bag50` },
      update: {},
      create: {
        id: `${item.id}-unit-bag50`,
        tenantId: tenant.id,
        productId: product.id,
        nameBn: '৫০ কেজি বস্তা',
        nameEn: '50kg Bag',
        kgPerUnit: 50.0,
        isBase: false,
        isDefaultSale: true,
        isDefaultPurchase: true,
      },
    });

    // Prices
    await prisma.productPrice.upsert({
      where: { id: `${item.id}-price-bag50-ws` },
      update: { pricePaisa: item.bag50PricePaisa },
      create: {
        id: `${item.id}-price-bag50-ws`,
        tenantId: tenant.id,
        productId: product.id,
        unitId: bag50Unit.id,
        priceType: 'wholesale',
        pricePaisa: item.bag50PricePaisa,
      },
    });

    await prisma.productPrice.upsert({
      where: { id: `${item.id}-price-kg-rt` },
      update: { pricePaisa: item.kgPricePaisa },
      create: {
        id: `${item.id}-price-kg-rt`,
        tenantId: tenant.id,
        productId: product.id,
        unitId: kgUnit.id,
        priceType: 'retail',
        pricePaisa: item.kgPricePaisa,
      },
    });

    // Stock Balance in main warehouse
    await prisma.stockBalance.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId: tenant.id,
          productId: product.id,
          warehouseId: mainGodown.id,
        },
      },
      update: {
        qtyKg: item.initialStockKg,
        avgCostPaisa: item.wacCostPerKgPaisa,
      },
      create: {
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: mainGodown.id,
        qtyKg: item.initialStockKg,
        avgCostPaisa: item.wacCostPerKgPaisa,
      },
    });

    // Initial Stock Movement Log
    const movementExists = await prisma.stockMovement.findFirst({
      where: { tenantId: tenant.id, productId: product.id, movementType: 'opening' },
    });
    if (!movementExists) {
      await prisma.stockMovement.create({
        data: {
          tenantId: tenant.id,
          productId: product.id,
          warehouseId: mainGodown.id,
          qtyKg: item.initialStockKg,
          unitCostPaisa: item.wacCostPerKgPaisa,
          movementType: 'opening',
          reason: 'প্রাথমিক উদ্বৃত্ত স্টক',
        },
      });
    }
  }

  // 10. Parties (Customers & Suppliers)
  const partiesData = [
    {
      id: 'party-001',
      name: 'কুষ্টিয়া গোল্ডেন অটো রাইস মিল',
      shopName: 'কুষ্টিয়া গোল্ডেন অটো মিলস',
      phone: '01712345678',
      address: 'মহাসড়ক সংলগ্ন, কুষ্টিয়া সদর',
      isVendor: true,
      isClient: false,
      vendorType: 'mill',
      openingBalance: BigInt(-45000000), // We owe 450,000 BDT (- payable)
      creditLimit: BigInt(100000000),
    },
    {
      id: 'party-002',
      name: 'মেসার্স সততা রাইস স্টোর',
      shopName: 'সততা স্টোর',
      phone: '01911223344',
      address: 'কাওরান বাজার, ঢাকা',
      isVendor: false,
      isClient: true,
      clientType: 'wholesale',
      openingBalance: BigInt(8500000), // They owe 85,000 BDT (+ receivable)
      creditLimit: BigInt(20000000),
    },
    {
      id: 'party-003',
      name: 'হাজী মোবারক ট্রেডার্স',
      shopName: 'মোবারক খাদ্য ভাণ্ডার',
      phone: '01819876543',
      address: 'চকবাজার, চট্টগ্রাম',
      isVendor: false,
      isClient: true,
      clientType: 'wholesale',
      openingBalance: BigInt(12000000), // They owe 120,000 BDT (+ receivable)
      creditLimit: BigInt(30000000),
    },
    {
      id: 'party-004',
      name: 'দিনাজপুর এগ্রো ফুডস লি:',
      shopName: 'দিনাজপুর এগ্রো',
      phone: '01715566778',
      address: 'বীরগঞ্জ, দিনাজপুর',
      isVendor: true,
      isClient: false,
      vendorType: 'mill',
      openingBalance: BigInt(-20000000), // We owe 200,000 BDT
      creditLimit: BigInt(50000000),
    },
  ];

  for (const party of partiesData) {
    await prisma.party.upsert({
      where: { id: party.id },
      update: {},
      create: {
        id: party.id,
        tenantId: tenant.id,
        name: party.name,
        shopName: party.shopName,
        phone: party.phone,
        address: party.address,
        isVendor: party.isVendor,
        isClient: party.isClient,
        clientType: party.clientType,
        vendorType: party.vendorType,
        openingBalance: party.openingBalance,
        creditLimit: party.creditLimit,
        status: 'active',
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
