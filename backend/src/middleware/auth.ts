import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './tenant';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chal-a-dokan-saas-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  phone: string;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'অথরাইজেশন টোকেন পাওয়া যায়নি' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'টোকেন মেয়াদোত্তীর্ণ বা অবৈধ' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'এই কাজটি সম্পন্ন করার পর্যাপ্ত অনুমতি আপনার নেই',
      });
    }
    next();
  };
};
