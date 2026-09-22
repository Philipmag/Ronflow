import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { users, organizations, teamMemberships, auditLogs } from '../db/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, orgName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUsers.length > 0) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create organization if not provided
    let orgId: string;
    if (orgName) {
      const newOrg = await db.insert(organizations).values({
        id: uuidv4(),
        name: orgName,
        plan: 'free'
      }).returning();
      orgId = newOrg[0].id;
    } else {
      // Create default org
      const defaultOrgName = `${name}'s Organization`;
      const newOrg = await db.insert(organizations).values({
        id: uuidv4(),
        name: defaultOrgName,
        plan: 'free'
      }).returning();
      orgId = newOrg[0].id;
    }

    // Create user
    const userId = uuidv4();
    const newUser = await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      orgId,
      role: 'admin',
      emailVerified: false,
      verificationToken: uuidv4()
    }).returning();

    // Create team membership
    await db.insert(teamMemberships).values({
      id: uuidv4(),
      userId,
      orgId,
      role: 'admin',
      status: 'active',
      invitedAt: new Date()
    });

    // Log audit event
    await db.insert(auditLogs).values({
      id: uuidv4(),
      orgId,
      userId,
      action: 'user.signup',
      entityType: 'user',
      entityId: userId
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
      orgId: newUser[0].orgId,
      role: newUser[0].role
    });

    const refreshToken = generateRefreshToken({ id: newUser[0].id });

    res.status(201).json({
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        orgId: newUser[0].orgId,
        role: newUser[0].role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const userRecords = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userRecords.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = userRecords[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Log audit event
    await db.insert(auditLogs).values({
      id: uuidv4(),
      orgId: user.orgId,
      userId: user.id,
      action: 'user.login',
      entityType: 'user',
      entityId: user.id
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token (import verifyToken from auth middleware)
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'ronflow-dev-secret-change-in-production';
    
    let decoded: any;
    try {
      decoded = jwt.default.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Get user
    const userRecords = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (userRecords.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = userRecords[0];

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role
    });

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'ronflow-dev-secret-change-in-production';
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.default.verify(token, JWT_SECRET);
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const userRecords = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      orgId: users.orgId,
      role: users.role,
      orgName: organizations.name
    }).from(users)
      .leftJoin(organizations, eq(users.orgId, organizations.id))
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (userRecords.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userRecords[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        role: user.role
      },
      organization: {
        id: user.orgId,
        name: user.orgName
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
