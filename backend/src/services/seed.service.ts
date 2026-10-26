import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('🌾 Initializing and seeding database...');

  // 1. Subscription Plan
  const plan = await prisma.plan.upsert({
    where: { id: 'plan-standard-001' },
    update: {},
    create: {
      id: 'plan-standard-001',
      name: 'আড়তদার স্ট্যান্ডার্ড (SaaS)',
      maxUsers: 5,
      maxWarehouses: 3,
      pricePaisa: BigInt(150000),
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
        phone: '01711000000',
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
        all: true,
        pos: { view: true, create: true, edit: true, void: true },
        inventory: { view: true, create: true, edit: true, void: true },
        rates: { view: true, create: true, edit: true, void: true },
        purchases: { view: true, create: true, edit: true, void: true },
        reports: { view: true, export: true },
        dayClose: { view: true, perform: true },
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
        pos: { view: true, create: true, edit: false, void: false },
        inventory: { view: true, create: false, edit: false, void: false },
        rates: { view: true, create: false, edit: false, void: false },
        purchases: { view: false, create: false, edit: false, void: false },
        reports: { view: false, export: false },
        dayClose: { view: true, perform: true },
      },
    },
  });

  // 4. Users
  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '01711000000' } },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: ownerRole.id,
      name: 'মো: রফিকুল ইসলাম (মালিক)',
      phone: '01711000000',
      email: 'owner@chaldokan.bd',
      passwordHash,
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '01811000001' } },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: cashierRole.id,
      name: 'মো: কাশেম আলী (ক্যাশিয়ার)',
      phone: '01811000001',
      email: 'cashier@chaldokan.bd',
      passwordHash,
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
      name: 'প্রধান মোকাম গোডাউন',
      address: 'আড়ত ভবন, বাদামতলী, ঢাকা',
      isDefault: true,
      status: 'active',
    },
  });

  const shopGodown = await prisma.warehouse.upsert({
    where: { id: 'wh-sec-002' },
    update: {},
    create: {
      id: 'wh-sec-002',
      tenantId: tenant.id,
      name: 'দোকান ডিসপ্লে / কাউন্টার শপ ১',
      address: 'দোকান নং ১২, বাদামতলী রোড, ঢাকা',
      isDefault: false,
      status: 'active',
    },
  });

  // 6. Categories
  const categoryNames = [
    { bn: 'মিনিকেট চাল', en: 'Miniket' },
    { bn: 'নাজিরশাইল চাল', en: 'Nazirshail' },
    { bn: 'বিআর-২৮ চাল', en: 'BR-28' },
    { bn: 'সুগন্ধি চাল', en: 'Aromatic Rice' },
    { bn: 'মোটা চাল (স্বর্ণা)', en: 'Swarna Coarse' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categoryNames) {
    let cat = await prisma.category.findFirst({
      where: { tenantId: tenant.id, nameBn: c.bn },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { tenantId: tenant.id, nameBn: c.bn, nameEn: c.en },
      });
    }
    catMap.set(c.en, cat.id);
  }

  // 7. Products
  const productsData = [
    {
      id: 'prod-001',
      nameBn: 'মিনিকেট চাল (সুপার প্রিমিয়াম)',
      nameEn: 'Miniket Super Premium Rice',
      variety: 'মিনিকেট',
      grade: 'প্রিমিয়াম',
      cat: 'Miniket',
      wholesalePricePaisa: BigInt(7000), // 70 Tk/kg wholesale
      retailPricePaisa: BigInt(7400),    // 74 Tk/kg retail
      wacPerKgPaisa: BigInt(6600),       // 66 Tk/kg WAC
      initialStockKg: 5000,
      minStockKg: 500,
    },
    {
      id: 'prod-002',
      nameBn: 'নাজিরশাইল চাল (নরম স্পেশাল)',
      nameEn: 'Nazirshail Soft Special',
      variety: 'নাজিরশাইল',
      grade: 'স্পেশাল',
      cat: 'Nazirshail',
      wholesalePricePaisa: BigInt(7800),
      retailPricePaisa: BigInt(8200),
      wacPerKgPaisa: BigInt(7400),
      initialStockKg: 3500,
      minStockKg: 400,
    },
    {
      id: 'prod-003',
      nameBn: 'বিআর-২৮ চাল (নতুন বাসমতি)',
      nameEn: 'BR-28 New Basmati Grain',
      variety: 'বিআর-২৮',
      grade: 'গ্রেড-এ',
      cat: 'BR-28',
      wholesalePricePaisa: BigInt(5800),
      retailPricePaisa: BigInt(6200),
      wacPerKgPaisa: BigInt(5500),
      initialStockKg: 6000,
      minStockKg: 600,
    },
    {
      id: 'prod-004',
      nameBn: 'গুটি স্বর্ণা চাল (মোটা ফ্রেশ)',
      nameEn: 'Guti Swarna Coarse Rice',
      variety: 'স্বর্ণা',
      grade: 'স্ট্যান্ডার্ড',
      cat: 'Swarna Coarse',
      wholesalePricePaisa: BigInt(4800),
      retailPricePaisa: BigInt(5200),
      wacPerKgPaisa: BigInt(4500),
      initialStockKg: 8000,
      minStockKg: 1000,
    },
    {
      id: 'prod-005',
      nameBn: 'কাটারিভোগ আতপ চাল (দিনাজপুর)',
      nameEn: 'Kataribhog Atash Rice',
      variety: 'কাটারিভোগ',
      grade: 'প্রথম শ্রেণি',
      cat: 'Aromatic Rice',
      wholesalePricePaisa: BigInt(9500),
      retailPricePaisa: BigInt(10500),
      wacPerKgPaisa: BigInt(9000),
      initialStockKg: 2000,
      minStockKg: 250,
    },
  ];

  for (const p of productsData) {
    const categoryId = catMap.get(p.cat) || Array.from(catMap.values())[0];
    const createdProd = await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        tenantId: tenant.id,
        categoryId,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        variety: p.variety,
        grade: p.grade,
        minStockKg: p.minStockKg,
        status: 'active',
      },
    });

    // Units (kg & 50kg bag)
    const unitKg = await prisma.productUnit.upsert({
      where: { id: `unit-kg-${p.id}` },
      update: {},
      create: {
        id: `unit-kg-${p.id}`,
        tenantId: tenant.id,
        productId: createdProd.id,
        nameBn: 'কেজি',
        nameEn: 'KG',
        kgPerUnit: 1.0,
        isBase: true,
      },
    });

    const unitBag = await prisma.productUnit.upsert({
      where: { id: `unit-bag-${p.id}` },
      update: {},
      create: {
        id: `unit-bag-${p.id}`,
        tenantId: tenant.id,
        productId: createdProd.id,
        nameBn: '৫০ কেজি বস্তা',
        nameEn: '50kg Bag',
        kgPerUnit: 50.0,
        isBase: false,
      },
    });

    // Prices
    await prisma.productPrice.upsert({
      where: { id: `price-ret-${p.id}` },
      update: {},
      create: {
        id: `price-ret-${p.id}`,
        tenantId: tenant.id,
        productId: createdProd.id,
        unitId: unitKg.id,
        priceType: 'retail',
        pricePaisa: p.retailPricePaisa,
      },
    });

    await prisma.productPrice.upsert({
      where: { id: `price-ws-${p.id}` },
      update: {},
      create: {
        id: `price-ws-${p.id}`,
        tenantId: tenant.id,
        productId: createdProd.id,
        unitId: unitBag.id,
        priceType: 'wholesale',
        pricePaisa: p.wholesalePricePaisa * BigInt(50),
      },
    });

    // Stock Balances
    await prisma.stockBalance.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId: tenant.id,
          productId: createdProd.id,
          warehouseId: mainGodown.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        warehouseId: mainGodown.id,
        productId: createdProd.id,
        qtyKg: p.initialStockKg,
        avgCostPaisa: p.wacPerKgPaisa,
      },
    });

    await prisma.stockBalance.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId: tenant.id,
          productId: createdProd.id,
          warehouseId: shopGodown.id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        warehouseId: shopGodown.id,
        productId: createdProd.id,
        qtyKg: 1000,
        avgCostPaisa: p.wacPerKgPaisa,
      },
    });
  }

  // 8. Parties
  const partiesData = [
    {
      id: 'party-001',
      name: 'মেসার্স কুষ্টিয়া এগ্রো মিলস',
      shopName: 'কুষ্টিয়া রাইস মিল',
      phone: '01712345678',
      address: 'মোকাম রোড, কুষ্টিয়া',
      isVendor: true,
      isClient: false,
      openingBalance: BigInt(-25000000),
      creditLimit: BigInt(100000000),
    },
    {
      id: 'party-002',
      name: 'দিনাজপুর অটো চাল মিলস',
      shopName: 'দিনাজপুর মোকাম',
      phone: '01719876543',
      address: 'পুলহাট, দিনাজপুর',
      isVendor: true,
      isClient: false,
      openingBalance: BigInt(-12000000),
      creditLimit: BigInt(50000000),
    },
    {
      id: 'party-003',
      name: 'ভাই ভাই স্টোর (মোহাম্মদপুর)',
      shopName: 'ভাই ভাই জেনারেল স্টোর',
      phone: '01819998877',
      address: 'টাউন হল মার্কেট, মোহাম্মদপুর, ঢাকা',
      isVendor: false,
      isClient: true,
      clientType: 'wholesale',
      openingBalance: BigInt(4500000),
      creditLimit: BigInt(10000000),
    },
    {
      id: 'party-004',
      name: 'হাজী কাসেম আলী ট্রেডার্স',
      shopName: 'হাজী স্টোর',
      phone: '01715566778',
      address: 'কারওয়ান বাজার, ঢাকা',
      isVendor: false,
      isClient: true,
      clientType: 'retailer',
      openingBalance: BigInt(1850000),
      creditLimit: BigInt(5000000),
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
        clientType: party.clientType || 'regular',
        openingBalance: party.openingBalance,
        creditLimit: party.creditLimit,
        status: 'active',
      },
    });
  }

  console.log('✅ Seed complete: Tenant, Roles, Users, Warehouses, Products, and Parties initialized.');
  return { success: true };
}
