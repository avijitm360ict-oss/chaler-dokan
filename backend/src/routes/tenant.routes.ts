import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';
import { seedDatabase } from '../services/seed.service';

const router = Router();

const backupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too Many Requests',
    message: 'ব্যাকআপ নেওয়ার অনুমোদিত সীমা অতিক্রান্ত হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});

const upgradeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'সাবস্ক্রিপশন পরিবর্তনের অনুমোদিত সীমা অতিক্রান্ত হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});

// POST /api/v1/tenant/seed - Dev-only database seed
router.post('/seed', async (_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'প্রোডাকশনে ডাটাবেজ সিড করা অনুমোদিত নয়',
    });
  }
  try {
    await seedDatabase();
    res.json({ success: true, message: 'চালের দোকান ডাটাবেজ সফলভাবে ইনিশিয়ালাইজ হয়েছে!' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenant/profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            products: true,
            warehouses: true,
            sales: true,
            parties: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found', message: 'দোকানের তথ্য পাওয়া যায়নি' });
    }

    res.json({ tenant });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tenant/profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { name, ownerName, settings } = req.body;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name && { name }),
        ...(ownerName && { ownerName }),
        ...(settings && { settings }),
      },
    });

    res.json({ message: 'দোকানের তথ্য সফলভাবে আপডেট হয়েছে', tenant: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenant/users - List all employees & cashiers
router.get('/users', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: (u.role?.name.toLowerCase() || 'cashier') as 'owner' | 'manager' | 'cashier',
      roleName: u.role?.name || 'Cashier',
      active: u.status === 'active',
      lastLoginAt: u.lastLoginAt,
    }));

    res.json({
      success: true,
      data: formatted,
      users: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenant/users - Add new employee (manager or cashier)
router.post('/users', requireRole(['Owner', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { name, phone, role = 'cashier', password = '123456' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Defense: Prevent vertical privilege escalation (SEC-06)
    const normalizedRole = (role || 'cashier').toLowerCase();
    if (!['cashier', 'manager'].includes(normalizedRole)) {
      return res.status(400).json({
        error: 'Invalid Role',
        message: 'দোকানের কর্মচারীর পদ শুধুমাত্র ক্যাশিয়ার (cashier) বা ম্যানেজার (manager) হতে পারে',
      });
    }

    const existing = await prisma.user.findFirst({
      where: { tenantId, phone },
    });
    if (existing) {
      return res.status(400).json({ error: 'User already exists', message: 'এই ফোন নম্বরে আগেই ইউজার খোলা রয়েছে' });
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash(password, 10);

    // Find or create role
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    let roleRecord = await prisma.role.findFirst({
      where: { tenantId, name: { equals: roleCapitalized, mode: 'insensitive' } },
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          tenantId,
          name: roleCapitalized,
          permissions: {
            pos: { view: true, create: true, edit: role === 'manager', void: role === 'manager' },
            inventory: { view: true, create: role === 'manager', edit: false, void: false },
            rates: { view: true, create: false, edit: role === 'manager', void: false },
            purchases: { view: role === 'manager', create: role === 'manager', edit: false, void: false },
          },
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        name,
        phone,
        passwordHash,
        roleId: roleRecord.id,
        status: 'active',
      },
      include: { role: true },
    });

    res.status(201).json({
      success: true,
      message: 'নতুন কর্মচারী সফলভাবে যুক্ত করা হয়েছে',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role.name.toLowerCase(),
        roleName: user.role.name,
        active: user.status === 'active',
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tenant/users/:id - Toggle user active status or update role
router.put('/users/:id', requireRole(['Owner', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.params.id as string;
    const { active, role } = req.body;

    // Verify user belongs to current tenant (Prevent BOLA/IDOR)
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found', message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    let roleIdToSet: string | undefined;
    if (role) {
      // Defense: Prevent elevation to Super Admin or Owner (SEC-06)
      const normalizedRole = role.toLowerCase();
      if (!['cashier', 'manager'].includes(normalizedRole)) {
        return res.status(400).json({
          error: 'Invalid Role',
          message: 'কর্মচারীর পদ শুধুমাত্র ক্যাশিয়ার (cashier) বা ম্যানেজার (manager) হতে পারে',
        });
      }

      const roleCapitalized = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
      let roleRecord = await prisma.role.findFirst({
        where: { tenantId, name: { equals: roleCapitalized, mode: 'insensitive' } },
      });
      if (!roleRecord) {
        roleRecord = await prisma.role.create({
          data: {
            tenantId,
            name: roleCapitalized,
            permissions: {
              pos: { view: true, create: true, edit: role === 'manager', void: role === 'manager' },
              inventory: { view: true, create: role === 'manager', edit: false, void: false },
              rates: { view: true, create: false, edit: role === 'manager', void: false },
              purchases: { view: role === 'manager', create: role === 'manager', edit: false, void: false },
            },
          },
        });
      }
      roleIdToSet = roleRecord.id;
    }

    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        ...(typeof active === 'boolean' && { status: active ? 'active' : 'inactive' }),
        ...(roleIdToSet && { roleId: roleIdToSet }),
      },
      include: { role: true },
    });

    res.json({
      success: true,
      message: 'কর্মচারীর তথ্য সফলভাবে আপডেট হয়েছে',
      data: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        role: updated.role.name.toLowerCase(),
        roleName: updated.role.name,
        active: updated.status === 'active',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenant/backup - Full shop data backup export (Owner Only)
router.get('/backup', requireRole(['Owner', 'Super Admin']), backupLimiter, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;

    const [tenant, products, warehouses, sales, purchases, parties, expenses, auditLogs] =
      await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.product.findMany({ where: { tenantId }, include: { units: true, prices: true, balances: true } }),
        prisma.warehouse.findMany({ where: { tenantId }, include: { balances: true } }),
        prisma.sale.findMany({ where: { tenantId }, include: { items: true } }),
        prisma.purchase.findMany({ where: { tenantId }, include: { items: true, expenses: true } }),
        prisma.party.findMany({ where: { tenantId } }),
        prisma.expense.findMany({ where: { tenantId } }),
        prisma.auditLog.findMany({ where: { tenantId }, take: 100 }),
      ]);

    const backupPayload = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      shopName: tenant?.name || 'চালের দোকান',
      tenant,
      counts: {
        products: products.length,
        warehouses: warehouses.length,
        sales: sales.length,
        purchases: purchases.length,
        parties: parties.length,
        expenses: expenses.length,
        auditLogs: auditLogs.length,
      },
      data: {
        products,
        warehouses,
        sales,
        purchases,
        parties,
        expenses,
        auditLogs,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="chal_a_dokan_backup_${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json({
      success: true,
      ...backupPayload,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenant/subscription/upgrade - Self-service subscription upgrade (BUG-13)
router.post('/subscription/upgrade', requireRole(['Owner', 'Super Admin']), upgradeLimiter, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { planName = 'প্রো প্ল্যান (Pro Plan)', paymentMethod = 'bkash', trxId = '' } = req.body;

    if (!trxId || typeof trxId !== 'string' || trxId.trim().length < 6) {
      return res.status(400).json({
        error: 'Invalid Transaction ID',
        message: 'পেমেন্ট ভেরিফিকেশনের জন্য সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন (কমপক্ষে ৬ অক্ষর)',
      });
    }

    const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!currentTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentSettings = (currentTenant.settings as any) || {};
    const newTrialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'active',
        trialEndsAt: newTrialEnds,
        settings: {
          ...currentSettings,
          planName,
          lastPaymentMethod: paymentMethod,
          lastTrxId: trxId,
          lastUpgradedAt: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: `${planName} সফলভাবে সক্রিয় করা হয়েছে!`,
      tenant: updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenant/all - SuperAdmin list all tenants with live stats (BUG-14)
router.get('/all', requireRole(['Super Admin']), async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const formatted = tenants.map((t) => {
      const trialMs = new Date(t.trialEndsAt).getTime() - now;
      const trialDays = Math.max(0, Math.ceil(trialMs / (1000 * 60 * 60 * 24)));
      const settings = (t.settings as any) || {};

      return {
        id: t.id,
        name: t.name,
        owner: t.ownerName,
        phone: t.phone,
        location: settings.address || 'বাংলাদেশ',
        plan: settings.planName || t.plan?.name || (t.status === 'trial' ? 'Basic Trial' : 'Pro Plan (প্রো)'),
        status: t.status,
        trialDays,
        usersCount: t._count.users || 1,
        monthlySalesCount: t._count.sales || 0,
      };
    });

    res.json({
      success: true,
      data: formatted,
      tenants: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tenant/:id/status - SuperAdmin toggle tenant status (BUG-14)
router.put('/:id/status', requireRole(['Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const targetTenantId = req.params.id as string;
    const { status } = req.body;

    if (!['active', 'suspended', 'trial'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.tenant.update({
      where: { id: targetTenantId },
      data: { status },
    });

    res.json({
      success: true,
      message: `দোকানের স্ট্যাটাস পরিবর্তন করে "${status}" করা হয়েছে`,
      tenant: updated,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tenant/:id/extend-trial - SuperAdmin extend trial by days (BUG-14)
router.put('/:id/extend-trial', requireRole(['Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const targetTenantId = req.params.id as string;
    const { days = 14 } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: targetTenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentExpiry = new Date(tenant.trialEndsAt).getTime();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.tenant.update({
      where: { id: targetTenantId },
      data: { trialEndsAt: newExpiry, status: 'active' },
    });

    res.json({
      success: true,
      message: `ট্রায়াল মেয়াদ আরও ${days} দিন বৃদ্ধি করা হয়েছে`,
      tenant: updated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenant/create-shop - SuperAdmin explicitly provision new tenant & owner (SuperAdmin-Only Gate)
router.post('/create-shop', requireRole(['Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      shopName,
      ownerName,
      phone,
      password = '123456',
      address = 'বাংলাদেশ',
      trialDays = 30,
      planName = 'প্রো প্ল্যান (Pro Plan)',
    } = req.body;

    if (!shopName || !ownerName || !phone) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'দোকানের নাম, মালিকের নাম এবং মোবাইল নম্বর আবশ্যক',
      });
    }

    const cleanPhone = String(phone).trim().replace(/[\s-]/g, '');

    const existingUser = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'Phone in use',
        message: 'এই মোবাইল নম্বর দিয়ে আগেই একাউন্ট খোলা হয়েছে',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const trialEndsAt = new Date(Date.now() + Number(trialDays) * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: shopName,
          ownerName: ownerName,
          phone: cleanPhone,
          status: 'active',
          trialEndsAt,
          settings: {
            address: address || 'বাংলাদেশ',
            proprietor: ownerName,
            planName,
          },
        },
      });

      // 2. Create Owner Role
      const role = await tx.role.create({
        data: {
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

      // 3. Create Default Warehouse
      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: 'প্রধান গোডাউন',
          address: address || 'দোকান সংলগ্ন',
          isDefault: true,
        },
      });

      // 4. Create Default Cash Drawer Account
      await tx.account.create({
        data: {
          tenantId: tenant.id,
          name: 'প্রধান ক্যাশ ড্রয়ার',
          type: 'cash',
          openingBalance: BigInt(0),
          currentBalance: BigInt(0),
        },
      });

      // 5. Create Owner User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: role.id,
          name: ownerName,
          phone: cleanPhone,
          passwordHash,
          status: 'active',
        },
      });

      return { tenant, user };
    });

    res.status(201).json({
      success: true,
      message: `নতুন চালের দোকান "${shopName}" সফলভাবে তৈরি হয়েছে!`,
      tenant: result.tenant,
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
      },
      credentials: {
        phone: cleanPhone,
        password: String(password),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
