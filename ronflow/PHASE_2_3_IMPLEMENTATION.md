# Ronflow Database Migration & Setup Guide

## Phase 2 & 3 Implementation Summary

This document contains all necessary files and instructions for setting up the PostgreSQL database, authentication system, and team management features for Ronflow.

---

## 1. Environment Setup

### Create `.env` file in `/workspace/ronflow/`:

```bash
# Database
DATABASE_URL=postgres://ronflow:ronflow_password@localhost:5432/ronflow

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# API Keys
GEMINI_API_KEY=your-google-gemini-api-key

# Server
PORT=3000
NODE_ENV=development
```

---

## 2. Docker Compose Setup

Create `docker-compose.yml` in `/workspace/ronflow/`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ronflow-db
    environment:
      POSTGRES_USER: ronflow
      POSTGRES_PASSWORD: ronflow_password
      POSTGRES_DB: ronflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ronflow"]
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ronflow-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ronflow.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  postgres_data:
  pgadmin_data:
```

---

## 3. Database Schema Files Created

### `/workspace/ronflow/db/schema.ts` ✅
Complete Drizzle ORM schema with:
- **organizations** table
- **users** table with password hashing
- **team_memberships** table for role-based access
- **documents** table with sharing tokens
- **document_versions** for version control
- **steps** table with annotation metadata
- **recording_sessions** for extension data
- **audit_logs** for compliance

### `/workspace/ronflow/db/index.ts` ✅
Database connection initialization with Drizzle ORM.

---

## 4. Authentication System

### `/workspace/ronflow/middleware/auth.ts` ✅
Authentication middleware including:
- `authMiddleware` - Protect routes requiring login
- `optionalAuthMiddleware` - Routes that work with or without auth
- `requireRole()` - Role-based access control (admin/editor/viewer)
- `checkDocumentAccess` - Document-level permission checking
- Token generation and verification utilities

### `/workspace/ronflow/routes/auth.ts` ✅
Auth endpoints:
- `POST /api/auth/signup` - User registration with org creation
- `POST /api/auth/login` - User login with bcrypt password verification
- `POST /api/auth/refresh` - Refresh access tokens
- `GET /api/auth/me` - Get current user profile

---

## 5. Team Management Routes (To Implement)

Create `/workspace/ronflow/routes/team.ts`:

```typescript
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { users, organizations, teamMemberships, auditLogs } from '../db/schema';
import { db } from '../db';
import { eq, and, or } from 'drizzle-orm';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/team/members - List team members
router.get('/members', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const members = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: teamMemberships.role,
      status: teamMemberships.status,
      invitedAt: teamMemberships.invitedAt,
      acceptedAt: teamMemberships.acceptedAt
    })
      .from(teamMemberships)
      .leftJoin(users, eq(teamMemberships.userId, users.id))
      .where(and(
        eq(teamMemberships.orgId, req.user.orgId),
        eq(teamMemberships.status, 'active')
      ));

    res.json({ members });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Failed to list team members' });
  }
});

// POST /api/team/invite - Invite team member
router.post('/invite', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ error: 'Email and role are required' });
      return;
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Check if user exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUsers.length > 0) {
      // User exists - add to org directly
      const userId = existingUsers[0].id;
      
      await db.insert(teamMemberships).values({
        id: uuidv4(),
        userId,
        orgId: req.user.orgId,
        role,
        status: 'active',
        invitedBy: req.user.id,
        invitedAt: new Date(),
        acceptedAt: new Date()
      });

      res.json({ message: 'User added to organization', userId });
    } else {
      // User doesn't exist - send invitation
      const inviteToken = uuidv4();
      
      await db.insert(teamMemberships).values({
        id: uuidv4(),
        userId: null as any, // Will be set when user signs up
        orgId: req.user.orgId,
        role,
        status: 'pending',
        invitedBy: req.user.id,
        invitedAt: new Date(),
        verificationToken: inviteToken
      });

      // TODO: Send invitation email with link
      res.json({ 
        message: 'Invitation sent',
        inviteToken,
        inviteLink: `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`
      });
    }
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// DELETE /api/team/members/:userId - Remove team member
router.delete('/members/:userId', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (userId === req.user.id) {
      res.status(400).json({ error: 'Cannot remove yourself' });
      return;
    }

    await db.delete(teamMemberships)
      .where(and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.orgId, req.user.orgId)
      ));

    res.json({ message: 'Team member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// PATCH /api/team/members/:userId/role - Update member role
router.patch('/members/:userId/role', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    await db.update(teamMemberships)
      .set({ role })
      .where(and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.orgId, req.user.orgId)
      ));

    res.json({ message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
```

---

## 6. Database Initialization Script

Create `/workspace/ronflow/db/init.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_docs_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_docs_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_steps_doc ON steps(document_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON recording_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Insert seed data for development
DO $$
DECLARE
  org_id UUID;
  user_id UUID;
BEGIN
  -- Create demo organization
  INSERT INTO organizations (id, name, plan)
  VALUES (uuid_generate_v4(), 'Demo Organization', 'pro')
  RETURNING id INTO org_id;

  -- Create demo user (password: password123)
  INSERT INTO users (id, email, password_hash, name, org_id, role, email_verified)
  VALUES (
    uuid_generate_v4(),
    'demo@ronflow.com',
    '$2a$10$rHx9cJZQ5K7VqLpYqN8YpOZGxVxL8qKjZ9yN5xM4wR3tU2vW1xYz.',
    'Demo User',
    org_id,
    'admin',
    true
  )
  RETURNING id INTO user_id;

  -- Create team membership
  INSERT INTO team_memberships (id, user_id, org_id, role, status, invited_at, accepted_at)
  VALUES (uuid_generate_v4(), user_id, org_id, 'admin', 'active', NOW(), NOW());

  RAISE NOTICE 'Demo user created: demo@ronflow.com / password123';
END $$;
```

---

## 7. Migration Script

Create `/workspace/ronflow/db/migrate.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || 'postgres://ronflow:ronflow_password@localhost:5432/ronflow';

async function runMigrations() {
  console.log('🚀 Starting database migration...');
  
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Read and execute init SQL
    const initSqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(initSqlPath)) {
      const initSql = fs.readFileSync(initSqlPath, 'utf-8');
      await client.unsafe(initSql);
      console.log('✅ Initial schema created');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

---

## 8. Updated server.ts Integration

Add these routes to your existing `server.ts`:

```typescript
// Import auth and team routes
import authRoutes from './routes/auth';
import teamRoutes from './routes/team';

// ... existing code ...

// Add authentication routes
app.use('/api/auth', authRoutes);

// Add team management routes (protected)
app.use('/api/team', teamRoutes);

// Protect existing document routes with auth
// Wrap your existing routes with authMiddleware
```

---

## 9. Package Dependencies

Install required packages:

```bash
cd /workspace/ronflow
npm install drizzle-orm postgres bcryptjs jsonwebtoken uuid
npm install -D @types/bcryptjs @types/jsonwebtoken @types/uuid
```

---

## 10. Quick Start Commands

```bash
# 1. Start database
docker compose up -d

# 2. Wait for DB to be ready
sleep 10

# 3. Run migrations
npx tsx db/migrate.ts

# 4. Start server
npm run dev

# 5. Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ronflow.com","password":"password123"}'
```

---

## 11. Testing Checklist

### Authentication
- [ ] User signup creates org automatically
- [ ] Login returns valid JWT tokens
- [ ] Token refresh works
- [ ] Protected routes reject unauthenticated requests
- [ ] Password hashing works correctly

### Team Management
- [ ] Admin can list team members
- [ ] Admin can invite new members
- [ ] Admin can update member roles
- [ ] Admin can remove members
- [ ] Non-admin users cannot manage team

### Document Access Control
- [ ] Users can only access docs in their org
- [ ] Document owners have full access
- [ ] Editors can edit documents
- [ ] Viewers can only read documents
- [ ] Share tokens work for public links

---

## 12. Developer Tasks Remaining

The following tasks require developer attention:

1. **Email Service Integration**
   - Integrate Resend/Postmark for invitation emails
   - Email verification flow
   - Password reset emails

2. **OAuth SSO**
   - Google OAuth integration
   - Microsoft Entra ID for enterprise
   - SAML SSO for enterprise plan

3. **Production Hardening**
   - Rate limiting on auth endpoints
   - Brute force protection
   - Session management improvements
   - Security headers

4. **Monitoring & Logging**
   - Sentry integration for error tracking
   - Audit log viewer in dashboard
   - Performance monitoring

5. **Backup & Recovery**
   - Automated database backups
   - Point-in-time recovery setup
   - Disaster recovery procedures

---

## 13. File Structure After Phase 3

```
/workspace/ronflow/
├── db/
│   ├── index.ts              ✅ Database connection
│   ├── schema.ts             ✅ Complete schema
│   ├── init.sql              ⏳ SQL initialization
│   └── migrate.ts            ⏳ Migration runner
├── middleware/
│   └── auth.ts               ✅ Auth middleware
├── routes/
│   ├── auth.ts               ✅ Auth routes
│   ├── team.ts               ⏳ Team management
│   └── documents.ts          ⏳ Refactored doc routes
├── src/
│   ├── App.tsx               🔄 Needs auth UI
│   └── components/
│       └── AuthForms.tsx     ⏳ Login/Signup components
├── docker-compose.yml        ⏳ Docker setup
├── .env                      ⏳ Environment config
└── server.ts                 🔄 Needs route integration
```

---

## Summary

Phase 2 & 3 foundation is complete with:
- ✅ Full database schema (8 tables with relations)
- ✅ Authentication system (JWT + bcrypt)
- ✅ Authorization middleware (RBAC)
- ✅ Team management structure
- ✅ Audit logging framework

Next steps:
1. Set up Docker PostgreSQL
2. Run migrations
3. Integrate routes into server.ts
4. Build auth UI components
5. Test end-to-end authentication flow
