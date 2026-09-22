import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { users, organizations, teamMemberships, documents } from '../db/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'ronflow-dev-secret-change-in-production';
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    orgId: string;
    role: string;
  };
}

// Generate access token
export function generateAccessToken(payload: { id: string; email: string; name: string; orgId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Generate refresh token
export function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Verify token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Verify user still exists
    const userRecords = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (userRecords.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = userRecords[0];

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional auth - doesn't fail if no token, but attaches user if valid
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      next();
      return;
    }

    const userRecords = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (userRecords.length === 0) {
      next();
      return;
    }

    const user = userRecords[0];

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role
    };

    next();
  } catch (error) {
    next();
  }
}

// Role-based access control middleware
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// Check document access permission
export async function checkDocumentAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const docId = req.params.id;
    
    if (!docId) {
      next();
      return;
    }

    // Get document
    const docs = await db.select({
      orgId: documents.orgId,
      ownerId: documents.ownerId,
      creatorId: documents.creatorId,
      status: documents.status
    }).from(documents).where(eq(documents.id, docId)).limit(1);

    if (docs.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const doc = docs[0];

    // Admin can access all docs in their org
    if (req.user.role === 'admin' && req.user.orgId === doc.orgId) {
      next();
      return;
    }

    // Owner or creator can access
    if (req.user.id === doc.ownerId || req.user.id === doc.creatorId) {
      next();
      return;
    }

    // Check team membership for editor/viewer access
    const memberships = await db.select().from(teamMemberships)
      .where(and(
        eq(teamMemberships.userId, req.user.id),
        eq(teamMemberships.orgId, doc.orgId),
        eq(teamMemberships.status, 'active')
      )).limit(1);

    if (memberships.length > 0) {
      next();
      return;
    }

    res.status(403).json({ error: 'Access denied to this document' });
  } catch (error) {
    console.error('Document access check error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
}
