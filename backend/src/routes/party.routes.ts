import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';
import { getNextDocNo } from '../utils/docSequence';

const router = Router();

const createPartySchema = z.object({
  name: z.string().min(1, 'পার্টির নাম আবশ্যক'),
  shopName: z.string().optional(),
  phone: z.string().min(1, 'মোবাইল নম্বর আবশ্যক'),
  address: z.string().optional(),
  isVendor: z.boolean().default(false),
  isClient: z.boolean().default(true),
  clientType: z.enum(['retail', 'wholesale', 'dealer']).optional(),
  vendorType: z.enum(['mill', 'arot', 'mohajon']).optional(),
  openingBalancePaisa: z.number().default(0), // + receivable (customer owes me), - payable (I owe supplier)
  creditLimitPaisa: z.number().default(0),
});

const updatePartySchema = createPartySchema.partial();

const partyPaymentSchema = z.object({
  direction: z.enum(['in', 'out']), // 'in' = received from customer, 'out' = paid to vendor
  accountId: z.string().min(1, 'একাউন্ট সিলেক্ট করুন'),
  amountPaisa: z.number().positive('টাকার পরিমাণ অবশ্যই ০ এর বেশি হতে হবে'),
  method: z.enum(['cash', 'bkash', 'nagad', 'bank_transfer', 'cheque']).default('cash'),
  referenceNo: z.string().optional(),
  note: z.string().optional(),
});

// GET /api/v1/parties - List all parties (clients & vendors)
router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const { type, search } = req.query;

    const where: Prisma.PartyWhereInput = {
      tenantId,
      status: 'active',
    };

    if (type === 'client') {
      where.isClient = true;
    } else if (type === 'vendor') {
      where.isVendor = true;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shopName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const parties = await prisma.party.findMany({
      where,
      include: {
        ledgerEntries: {
          orderBy: { entryDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = parties.map((p: any) => {
      // Latest balance from latest ledger entry, or fallback to opening balance
      const currentBalancePaisa =
        p.ledgerEntries.length > 0
          ? Number(p.ledgerEntries[0].runningBalance)
          : Number(p.openingBalance);

      const type = p.isClient && p.isVendor ? 'both' : p.isClient ? 'client' : 'vendor';

      return {
        id: p.id,
        name: p.name,
        shopName: p.shopName || '',
        phone: p.phone,
        address: p.address || '',
        type,
        isClient: p.isClient,
        isVendor: p.isVendor,
        clientType: p.clientType,
        vendorType: p.vendorType,
        balancePaisa: currentBalancePaisa,
        creditLimitPaisa: Number(p.creditLimit),
        status: p.status,
        createdAt: p.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/parties/:id - Single party detail
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const partyId = String(req.params.id);
    const party = await prisma.party.findFirst({
      where: { id: partyId, tenantId },
      include: {
        ledgerEntries: {
          orderBy: { entryDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!party) {
      return res.status(404).json({ success: false, message: 'পার্টি পাওয়া যায়নি' });
    }

    const partyWithLedger = party as any;
    const currentBalancePaisa =
      partyWithLedger.ledgerEntries?.length > 0
        ? Number(partyWithLedger.ledgerEntries[0].runningBalance)
        : Number(party.openingBalance);

    res.json({
      success: true,
      data: {
        ...party,
        currentBalancePaisa,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/parties - Create party
router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const data = createPartySchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const party = await tx.party.create({
        data: {
          tenantId,
          name: data.name,
          shopName: data.shopName,
          phone: data.phone,
          address: data.address,
          isClient: data.isClient,
          isVendor: data.isVendor,
          clientType: data.clientType,
          vendorType: data.vendorType,
          openingBalance: BigInt(data.openingBalancePaisa),
          creditLimit: BigInt(data.creditLimitPaisa),
        },
      });

      // If initial opening balance is specified, create initial ledger entry
      if (data.openingBalancePaisa !== 0) {
        await tx.partyLedger.create({
          data: {
            tenantId,
            partyId: party.id,
            entryType: 'opening',
            debitPaisa: data.openingBalancePaisa > 0 ? BigInt(data.openingBalancePaisa) : BigInt(0),
            creditPaisa: data.openingBalancePaisa < 0 ? BigInt(Math.abs(data.openingBalancePaisa)) : BigInt(0),
            runningBalance: BigInt(data.openingBalancePaisa),
          },
        });
      }

      return party;
    });

    res.status(201).json({
      success: true,
      message: 'পার্টি সফলভাবে যোগ করা হয়েছে',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/parties/:id - Update party info
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const partyId = String(req.params.id);
    const data = updatePartySchema.parse(req.body);

    const party = await prisma.party.findFirst({
      where: { id: partyId, tenantId },
    });
    if (!party) {
      return res.status(404).json({ success: false, message: 'পার্টি পাওয়া যায়নি' });
    }

    const updated = await prisma.party.update({
      where: { id: party.id },
      data: {
        name: data.name,
        shopName: data.shopName,
        phone: data.phone,
        address: data.address,
        isClient: data.isClient,
        isVendor: data.isVendor,
        clientType: data.clientType,
        vendorType: data.vendorType,
        creditLimit: data.creditLimitPaisa !== undefined ? BigInt(data.creditLimitPaisa) : undefined,
      },
    });

    res.json({
      success: true,
      message: 'পার্টির তথ্য আপডেট করা হয়েছে',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/parties/:id/ledger - View detailed ledger
router.get('/:id/ledger', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const partyId = String(req.params.id);
    const party = await prisma.party.findFirst({
      where: { id: partyId, tenantId },
    });
    if (!party) {
      return res.status(404).json({ success: false, message: 'পার্টি পাওয়া যায়নি' });
    }

    const ledger = await prisma.partyLedger.findMany({
      where: { tenantId, partyId: party.id },
      orderBy: { entryDate: 'asc' },
    });

    res.json({
      success: true,
      party: {
        id: party.id,
        name: party.name,
        phone: party.phone,
        openingBalance: Number(party.openingBalance),
      },
      data: ledger,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/parties/:id/payments - Record Payment In/Out
router.post('/:id/payments', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const partyId = String(req.params.id);
    const data = partyPaymentSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const party = await tx.party.findFirst({
        where: { id: partyId, tenantId },
      });
      if (!party) throw new Error('পার্টি পাওয়া যায়নি');

      const account = await tx.account.findFirst({
        where: { id: data.accountId, tenantId },
      });
      if (!account) throw new Error('সিলেক্টেড একাউন্ট পাওয়া যায়নি');

      const docNo = await getNextDocNo(tx, tenantId, 'payment', 'PAY');

      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          docNo,
          direction: data.direction,
          partyId: party.id,
          accountId: account.id,
          amountPaisa: BigInt(data.amountPaisa),
          method: data.method,
          referenceNo: data.referenceNo,
          note: data.note,
          status: 'confirmed',
        },
      });

      // 2. Calculate new Party Ledger balance
      const lastLedger = await tx.partyLedger.findFirst({
        where: { tenantId, partyId: party.id },
        orderBy: { entryDate: 'desc' },
      });
      const previousBal = lastLedger ? Number(lastLedger.runningBalance) : Number(party.openingBalance);

      // direction 'in' = Received from customer -> credit party ledger, runningBalance decreases
      // direction 'out' = Paid to vendor -> debit party ledger, runningBalance increases towards positive (less debt)
      const debitPaisa = data.direction === 'out' ? data.amountPaisa : 0;
      const creditPaisa = data.direction === 'in' ? data.amountPaisa : 0;
      const newBalance = previousBal + debitPaisa - creditPaisa;

      await tx.partyLedger.create({
        data: {
          tenantId,
          partyId: party.id,
          entryType: data.direction === 'in' ? 'payment_in' : 'payment_out',
          refType: 'payment',
          refId: payment.id,
          debitPaisa: BigInt(debitPaisa),
          creditPaisa: BigInt(creditPaisa),
          runningBalance: BigInt(newBalance),
        },
      });

      // 3. Update Account balance
      const accountBalChange = data.direction === 'in' ? data.amountPaisa : -data.amountPaisa;
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          currentBalance: {
            increment: BigInt(accountBalChange),
          },
        },
      });

      return {
        payment,
        newPartyBalancePaisa: newBalance,
        newAccountBalancePaisa: Number(updatedAccount.currentBalance),
      };
    });

    res.status(201).json({
      success: true,
      message: data.direction === 'in' ? 'বাকি আদায় সফলভাবে রেকর্ড করা হয়েছে' : 'পেমেন্ট প্রদান সফলভাবে রেকর্ড করা হয়েছে',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/parties/:id/send-sms - Send Due Collection SMS to party (Privileged only)
router.post('/:id/send-sms', requireRole(['Owner', 'Manager', 'Super Admin']), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.tenantId!;
    const partyId = req.params.id as string;
    const { customMessage } = req.body;

    const [party, tenant] = await Promise.all([
      prisma.party.findFirst({
        where: { id: partyId, tenantId },
        include: {
          ledgerEntries: {
            orderBy: { entryDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    if (!party) {
      return res.status(404).json({ error: 'Party not found', message: 'পার্টি পাওয়া যায়নি' });
    }

    const currentBal =
      party.ledgerEntries.length > 0
        ? Number(party.ledgerEntries[0].runningBalance)
        : Number(party.openingBalance);

    const { SmsService } = await import('../services/sms.service');
    const shopName = tenant?.name || 'চালের দোকান';
    let message = SmsService.buildDueReminderSms(shopName, party.name, Math.round(currentBal / 100));
    if (typeof customMessage === 'string' && customMessage.trim()) {
      // Clamped to 160 characters and stripped of harmful sequences
      message = customMessage.trim().slice(0, 160).replace(/[<>{}\\]/g, '');
    }

    const smsResult = await SmsService.sendSms({
      toPhone: party.phone,
      message,
      tenantId,
    });

    res.json({
      success: true,
      message: `${party.name} (${party.phone})-কে তাগাদা SMS সফলভাবে পাঠানো হয়েছে`,
      data: smsResult,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
