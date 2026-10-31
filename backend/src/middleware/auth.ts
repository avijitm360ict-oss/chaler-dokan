import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './tenant';

const rawSecret = process.env.JWT_SECRET;
const DEFAULT_INSECURE_SECRET = 'super-secret-chal-a-dokan-saas-jwt-key-2026';

if (process.env.NODE_ENV === 'production' && (!rawSecret || rawSecret === DEFAULT_INSECURE_SECRET)) {
  console.error('FATAL SECURITY ERROR: JWT_SECRET must be set to a strong unique secret in production!');
  process.exit(1);
}

const JWT_SECRET = rawSecret || DEFAULT_INSECURE_SECRET;

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
    if (!req.userRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'অনুমতি যাচাই করা সম্ভব হয়নি',
      });
    }

    const currentRoleLower = req.userRole.toLowerCase();
    const isAllowed = allowedRoles.some(
      (r) => r.toLowerCase() === currentRoleLower || currentRoleLower === 'superadmin' || currentRoleLower === 'super admin'
    );

    if (!isAllowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'এই কাজটি সম্পন্ন করার পর্যাপ্ত অনুমতি আপনার নেই',
      });
    }
    next();
  };
};
