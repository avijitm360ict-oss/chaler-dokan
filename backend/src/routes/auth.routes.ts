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
