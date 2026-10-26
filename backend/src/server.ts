import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler } from './middleware/errorHandler';

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

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'chal-a-dokan-backend-saas',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    db: 'connected',
  });
});

// Global Multi-tenant middleware for /api/v1
app.use('/api/v1', tenantMiddleware);

// Part 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/market-rates', marketRateRoutes);

// Part 2 Routes
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Part 3 Routes (Parties, Money/Accounts, Reports, Returns)
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
