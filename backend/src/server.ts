import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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
    timestamp: new Date().toISOString()
  });
});

// Multi-tenant Middleware demo & documentation
app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-001';
  (req as any).tenantId = tenantId;
  next();
});

// Demo Data endpoints representing PRD services
app.get('/api/v1/shop-summary', (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  res.json({
    tenantId,
    name: 'মেসার্স বিসমিল্লাহ চাউল আড়ত ও স্টোর',
    baseUnit: 'KG',
    currency: 'Paisa (BIGINT)',
    status: 'active',
    trialEndsAt: '2026-10-28T00:00:00.000Z'
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌾 চালের দোকান SaaS Backend API running on http://localhost:${PORT}`);
  });
}

export default app;
