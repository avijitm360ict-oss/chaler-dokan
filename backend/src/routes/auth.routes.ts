import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken, requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/tenant';

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড দিন'),
});

const registerSchema = z.object({
  shopName: z.string().min(2, 'দোকানের নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  ownerName: z.string().min(2, 'মালিকের নাম আবশ্যক'),
  phone: z.string().min(11, 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন'),
  password: z.string().min(6, 'কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড দিন'),
  address: z.string().optional(),
});

// POST /api/v1/auth/register - Sign up new rice shop & owner
router.post('/register', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { phone: data.phone },
    });
    if (existingUser) {
      return res.status(400).json({
        error: 'Phone in use',
        message: 'এই মোবাইল নম্বর দিয়ে আগেই একাউন্ট খোলা হয়েছে',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.shopName,
          ownerName: data.ownerName,
          phone: data.phone,
          status: 'trial',
          trialEndsAt,
          settings: {
            address: data.address || '',
            proprietor: data.ownerName,
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

      // 3. Create User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.ownerName,
          phone: data.phone,
          passwordHash,
          roleId: role.id,
          status: 'active',
        },
      });

      // 4. Default Warehouse
      await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: 'মেইন গোডাউন',
          address: data.address || 'দোকান গোডাউন',
          isDefault: true,
        },
      });

      // 5. Default Cash Account
      await tx.account.create({
        data: {
          tenantId: tenant.id,
          name: 'নগদ ক্যাশ ড্রয়ার',
          type: 'cash',
          openingBalance: BigInt(0),
          currentBalance: BigInt(0),
        },
      });

      return { tenant, role, user };
    });

    const token = signToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.role.name,
      phone: result.user.phone,
    });

    res.status(201).json({
      message: 'রেজিস্ট্রেশন সফল হয়েছে! ৩০ দিনের ফ্রি ট্রায়াল শুরু হয়েছে।',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        role: result.role.name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        ownerName: result.tenant.ownerName,
        phone: result.tenant.phone,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { phone, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { phone },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে',
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল হয়েছে',
      });
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role.name,
      phone: user.phone,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      message: 'সফলভাবে লগইন হয়েছে',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        ownerName: user.tenant.ownerName,
        phone: user.tenant.phone,
        settings: user.tenant.settings,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found', message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        ownerName: user.tenant.ownerName,
        phone: user.tenant.phone,
        settings: user.tenant.settings,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
