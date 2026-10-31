import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';

import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import productRoutes from './routes/product.routes';
import warehouseRoutes from './routes/warehouse.routes';
import marketRateRoutes from './routes/marketRate.routes';
import purchaseRoutes from './routes/purchase.routes';
import saleRoutes from './routes/sale.routes';
import inventoryRoutes from './routes/inventory.routes';
import partyRoutes from './routes/party.routes';
import accountRoutes from './routes/account.routes';
import reportRoutes from './routes/report.routes';
import returnRoutes from './routes/return.routes';
import auditRoutes from './routes/audit.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 1. Security Headers
app.use(helmet());

// 2. CORS Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:4173',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server) or matched origins
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Origin not allowed'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));

// 3. Global Rate Limiter
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'অতিরিক্ত রিকোয়েস্টের কারণে সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।',
  },
});
app.use('/api', globalApiLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (Public)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'chal-a-dokan-backend-saas',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    db: 'connected',
  });
});

// Public Authentication routes (/login, /register, /demo)
app.use('/api/v1/auth', authRoutes);

// Protected routes (Requires valid JWT and verifies tenant context)
app.use('/api/v1', requireAuth, tenantMiddleware);

app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/market-rates', marketRateRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/parties', partyRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

import { seedDatabase } from './services/seed.service';
import prisma from './lib/prisma';

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`🌾 চালের দোকান SaaS Backend API running on port ${PORT}`);
    try {
      const count = await prisma.tenant.count();
      if (count === 0) {
        console.log('🌾 Cloud database empty. Auto-seeding initial rice products & demo data...');
        await seedDatabase();
      }
    } catch (e) {
      console.warn('Startup database check:', e);
    }
  });
}

export default app;
