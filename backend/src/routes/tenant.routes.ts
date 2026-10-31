import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';
import { seedDatabase } from '../services/seed.service';

const router = Router();

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
router.get('/backup', requireRole(['Owner', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
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

export default router;
