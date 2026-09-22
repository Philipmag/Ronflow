# Ronflow Revamp Blueprint
## From MVP to Full-Scale Production Platform

**Based on Original Prompt-Master Specification**  
**Current Version:** MVP (Simulation-Only)  
**Target Version:** Enterprise-Ready SOP Platform with Real Browser Capture

---

## Executive Summary

The current Ronflow MVP successfully demonstrates the core AI-powered SOP generation concept using **simulated scenarios**. However, to deliver the full value proposition outlined in the original specification, we must transition from simulation to **real browser workflow capture** and add enterprise features.

This blueprint provides a phased, engineer-ready roadmap to transform the MVP into a production-grade platform matching the original Prompt-Master specification.

---

## Phase 1: Foundation & Real Capture Engine (Weeks 1-6)

### 1.1 Browser Extension Development ⭐ CRITICAL

**Goal:** Replace simulation with actual Chrome/Edge extension that captures real user workflows.

#### Sprint 1.1: Extension Infrastructure (Week 1-2)
```
Priority: 🔴 BLOCKER
Complexity: High
Dependencies: None
```

**Tasks:**
- [ ] Create `extension/` directory with Manifest V3 structure
- [ ] Implement `manifest.json` with permissions:
  ```json
  {
    "manifest_version": 3,
    "name": "Ronflow Capture",
    "permissions": [
      "tabs",
      "activeTab",
      "storage",
      "scripting",
      "screenshots"
    ],
    "host_permissions": ["<all_urls>"],
    "background": { "service_worker": "background.js" },
    "content_scripts": [{
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }],
    "action": { "default_popup": "popup.html" }
  }
  ```
- [ ] Build content script (`content.js`) to intercept:
  - Click events (`document.addEventListener('click')`)
  - Input/change events for form fields
  - Navigation events (URL changes)
  - Scroll events (for context)
- [ ] Implement event metadata capture:
  ```javascript
  {
    timestamp: Date.now(),
    actionType: 'click|type|select|navigate|submit',
    targetElement: {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      ariaLabel: element.getAttribute('aria-label'),
      text: element.innerText?.slice(0, 100),
      placeholder: element.placeholder,
      name: element.name
    },
    url: window.location.href,
    pageTitle: document.title,
    boundingBox: element.getBoundingClientRect()
  }
  ```
- [ ] Build background service worker for:
  - Screenshot capture via `chrome.tabs.captureVisibleTab()`
  - Session storage in `chrome.storage.local`
  - API communication with backend
- [ ] Create popup UI (React-based) with states: Idle → Recording → Paused
- [ ] Add keyboard shortcut: `Ctrl+Shift+R` toggle

**Files to Create:**
```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.jsx
├── styles/
│   └── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

#### Sprint 1.2: Sensitive Data Redaction (Week 3)
```
Priority: 🔴 HIGH (Security Requirement)
Complexity: Medium
Dependencies: 1.1 complete
```

**Tasks:**
- [ ] Implement field detection logic:
  ```javascript
  const SENSITIVE_PATTERNS = ['password', 'ssn', 'card', 'cvv', 'secret', 'token', 'pin'];
  function isSensitiveField(element) {
    if (element.type === 'password') return true;
    const fieldName = (element.name + element.id + element.placeholder).toLowerCase();
    return SENSITIVE_PATTERNS.some(pattern => fieldName.includes(pattern));
  }
  ```
- [ ] Apply canvas redaction before screenshot storage:
  - Draw gray rectangle over sensitive regions
  - Process server-side as backup verification
- [ ] Add visual indicator during recording when sensitive field detected
- [ ] Write unit tests for redaction coverage

**Acceptance Criteria:**
- No password fields visible in any stored screenshot
- Fields containing SSN, credit card numbers auto-blurred
- Redaction cannot be reversed

#### Sprint 1.3: Backend Integration for Real Capture (Week 4-5)
```
Priority: 🔴 HIGH
Complexity: High
Dependencies: 1.1, 1.2 complete
```

**Tasks:**
- [ ] Create new API endpoints for extension data:
  ```typescript
  POST /api/sessions              // Start recording session
  PATCH /api/sessions/:id/events  // Append captured events
  POST /api/sessions/:id/process  // Trigger AI processing
  GET  /api/sessions/:id/status   // Poll processing status
  ```
- [ ] Modify existing `/api/generate-flow` to accept extension event format
- [ ] Implement session management:
  - Generate unique session ID on start
  - Store raw events temporarily (Redis for MVP)
  - Associate session with authenticated user
- [ ] Add screenshot upload endpoint:
  ```typescript
  POST /api/screenshots/upload
  // Returns: { screenshotId, signedUrl }
  ```
- [ ] Update frontend to show extension install status
- [ ] Create extension deep-link flow:
  - Detect if extension installed via custom protocol
  - Show install prompt if missing
  - Confirm installation with handshake ping

**Database Changes:**
```sql
CREATE TABLE recording_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  org_id UUID REFERENCES organizations(id),
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress|processing|complete|failed
  started_at TIMESTAMP DEFAULT NOW(),
  stopped_at TIMESTAMP,
  raw_events JSONB,
  step_count INTEGER,
  target_document_id UUID REFERENCES documents(id)
);
```

#### Sprint 1.4: Annotation Engine Upgrade (Week 6)
```
Priority: 🟡 MEDIUM
Complexity: Medium
Dependencies: 1.3 complete
```

**Tasks:**
- [ ] Replace simulated annotations with real screenshot overlays
- [ ] Implement canvas-based annotation renderer:
  - Red circle with step number (diameter: max(40, element_diagonal * 0.3))
  - Semi-transparent highlight box (rgba(229, 90, 48, 0.25))
  - Arrow pointer if circle obscures content
  - Step label chip in top-left ("Step N")
- [ ] Add smart cropping logic:
  ```javascript
  if (element.y < viewport.height / 2) {
    cropToTop60Percent();
  } else {
    cropToBottom60Percent();
  }
  ```
- [ ] Integrate Konva.js or Fabric.js for interactive repositioning
- [ ] Allow manual annotation adjustment in editor

**Deliverable:** Working Chrome extension that captures real workflows with annotated screenshots.

---

## Phase 2: Authentication & Data Persistence (Weeks 7-10)

### 2.1 Database Migration (Week 7-8)
```
Priority: 🔴 BLOCKER
Complexity: High
Dependencies: None
```

**Tasks:**
- [ ] Set up PostgreSQL database (Railway/Supabase/Neon)
- [ ] Install Drizzle ORM:
  ```bash
  npm install drizzle-orm postgres
  npm install -D drizzle-kit
  ```
- [ ] Define schema (`db/schema.ts`):
  ```typescript
  // Users table
  export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: varchar('role', { length: 20 }).default('editor'), // admin|editor|viewer
    orgId: uuid('org_id').references(() => organizations.id),
    createdAt: timestamp('created_at').defaultNow(),
  });

  // Organizations table
  export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    plan: varchar('plan', { length: 20 }).default('free'), // free|pro|team|enterprise
    settings: jsonb('settings'),
  });

  // Documents table (enhanced)
  export const documents = pgTable('documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').references(() => organizations.id),
    creatorId: uuid('creator_id').references(() => users.id),
    ownerId: uuid('owner_id').references(() => users.id),
    title: varchar('title', { length: 500 }).notNull(),
    summary: text('summary'),
    prerequisites: jsonb('prerequisites').$type<string[]>(),
    status: varchar('status', { length: 20 }).default('draft'),
    shareToken: varchar('share_token', { length: 32 }).unique(),
    sharePasswordHash: varchar('share_password_hash', { length: 255 }),
    reviewIntervalDays: integer('review_interval_days').default(90),
    lastReviewedAt: timestamp('last_reviewed_at'),
    tags: jsonb('tags').$type<string[]>(),
    currentVersionId: uuid('current_version_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    publishedAt: timestamp('published_at'),
  });

  // Document versions table
  export const documentVersions = pgTable('document_versions', {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').references(() => documents.id),
    versionNumber: integer('version_number').notNull(),
    versionLabel: varchar('version_label', { length: 100 }),
    changeDescription: text('change_description'),
    createdAt: timestamp('created_at').defaultNow(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
  });

  // Steps table (enhanced)
  export const steps = pgTable('steps', {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').references(() => documents.id),
    versionId: uuid('version_id').references(() => documentVersions.id),
    order: integer('order').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    actionType: varchar('action_type', { length: 20 }),
    rawEventMetadata: jsonb('raw_event_metadata'),
    screenshotUrl: varchar('screenshot_url', { length: 500 }),
    annotationMetadata: jsonb('annotation_metadata'),
    aiGenerated: boolean('ai_generated').default(true),
    aiGeneratedAt: timestamp('ai_generated_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });

  // Audit logs table
  export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').references(() => organizations.id),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  });
  ```
- [ ] Write migration scripts with Drizzle Kit
- [ ] Create seed script for demo data
- [ ] Replace in-memory array with database queries in all API routes

**Migration Strategy:**
1. Export existing in-memory data to JSON backup
2. Run migrations on fresh PostgreSQL instance
3. Import seed data + migrate any valuable test documents
4. Switch API layer to use Drizzle queries

#### Sprint 2.2: Authentication System (Week 9-10)
```
Priority: 🔴 BLOCKER
Complexity: High
Dependencies: 2.1 complete
```

**Tasks:**
- [ ] Install auth dependencies:
  ```bash
  npm install bcryptjs jsonwebtoken cookie-parser
  npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser
  ```
- [ ] Implement signup/login endpoints:
  ```typescript
  POST /api/auth/signup
  // Body: { email, password, name, orgName? }
  // Creates user + organization (if first user)
  // Sends verification email

  POST /api/auth/login
  // Body: { email, password }
  // Returns: { accessToken, refreshToken }
  // Sets httpOnly cookies

  POST /api/auth/refresh
  // Rotates refresh token
  // Returns new access token

  POST /api/auth/logout
  // Clears cookies
  // Invalidates refresh token in database
  ```
- [ ] Add Google OAuth (optional but recommended):
  ```bash
  npm install passport-google-oauth20
  ```
- [ ] Implement JWT middleware:
  ```typescript
  // middleware/auth.ts
  export function authenticateToken(req, res, next) {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  }
  ```
- [ ] Add role-based access control (RBAC):
  ```typescript
  export function requireRole(...roles: string[]) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
  ```
- [ ] Protect all existing API routes with auth middleware
- [ ] Update frontend to handle auth state (login/logout flows)
- [ ] Add password reset via email

**Environment Variables Required:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-for-refresh-tokens
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
EMAIL_PROVIDER_API_KEY=resend_or_postmark_key
```

**Deliverable:** Secure authentication with JWT, user accounts, and org isolation.

---

## Phase 3: Team Management & Collaboration (Weeks 11-14)

### 3.1 Team Management Module (Week 11-12)
```
Priority: 🟡 HIGH
Complexity: Medium
Dependencies: 2.2 complete
```

**Tasks:**
- [ ] Create team management UI at `/team` route
- [ ] Implement member invitation system:
  ```typescript
  POST /api/team/invite
  // Body: { email, role: 'admin'|'editor'|'viewer' }
  // Sends invite email with magic link
  ```
- [ ] Build member list with role assignment:
  ```typescript
  GET /api/team/members
  PATCH /api/team/members/:userId/role
  DELETE /api/team/members/:userId
  ```
- [ ] Add document access control:
  - Org-wide visibility (default)
  - Team-specific restrictions
  - Individual sharing
- [ ] Create activity feed showing recent actions
- [ ] Implement audit logging for all sensitive operations

**UI Components Needed:**
- Team members table with role badges
- Invite modal with email input + role selector
- Activity timeline component
- Permission matrix visualization

#### Sprint 3.2: Document Sharing & Permissions (Week 13-14)
```
Priority: 🟡 MEDIUM
Complexity: Medium
Dependencies: 3.1 complete
```

**Tasks:**
- [ ] Add shareable link generation:
  ```typescript
  POST /api/docs/:id/share
  // Generates unique 32-char token
  // Returns: https://ronflow.io/view/{shareToken}
  
  GET /api/view/:shareToken
  // Public endpoint (no auth required)
  // Renders read-only document view
  
  POST /api/view/:shareToken/track
  // Logs view event for analytics
  ```
- [ ] Implement password protection option for shared links
- [ ] Add embed code generator for intranet/Confluence:
  ```html
  <iframe src="https://ronflow.io/embed/{shareToken}" width="100%" height="600px"></iframe>
  ```
- [ ] Create view tracking dashboard (who viewed, when, duration)
- [ ] Add expiration dates for temporary shares
- [ ] Build permission UI in document editor sidebar

**Database Changes:**
```sql
ALTER TABLE documents ADD COLUMN shared_by_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN share_expires_at TIMESTAMP;

CREATE TABLE document_views (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  viewer_ip INET,
  viewer_user_agent TEXT,
  time_spent_seconds INTEGER
);
```

**Deliverable:** Complete team collaboration with granular permissions and shareable links.

---

## Phase 4: Export Engine & Advanced Features (Weeks 15-20)

### 4.1 PDF Export Implementation (Week 15-17)
```
Priority: 🟢 MEDIUM-HIGH
Complexity: High
Dependencies: 2.1 complete
```

**Tasks:**
- [ ] Install Puppeteer:
  ```bash
  npm install puppeteer
  ```
- [ ] Create HTML template for PDF rendering:
  - Cover page with title, logo, date, version, author
  - Table of contents with page numbers
  - Each step on separate section with annotated screenshot
  - Footer with doc ID, page number, watermark
- [ ] Build PDF generation endpoint:
  ```typescript
  POST /api/docs/:id/export/pdf
  // Triggers async job via BullMQ
  // Returns: { jobId }
  
  GET /api/export/jobs/:jobId
  // Polls job status
  // When complete: { status: 'done', downloadUrl: '...' }
  ```
- [ ] Configure Puppeteer for consistent rendering:
  ```javascript
  await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:10px">Confidential</div>',
    footerTemplate: '<span class="pageNumber"></span> / <span class="totalPages"></span>'
  });
  ```
- [ ] Add custom branding options (company logo, colors)
- [ ] Implement watermark for free tier users

**Alternative:** Use `pdfmake` for client-side generation if server resources constrained.

#### Sprint 4.2: DOCX Export (Week 18)
```
Priority: 🟢 MEDIUM
Complexity: Medium
Dependencies: 4.1 complete
```

**Tasks:**
- [ ] Install docx library:
  ```bash
  npm install docx
  ```
- [ ] Create DOCX generation service:
  ```typescript
  import { Document, Packer, Paragraph, HeadingLevel, ImageRun } from 'docx';
  
  async function generateDocx(document: DocumentModel) {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: document.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: document.summary }),
          ...document.steps.map(step => [
            new Paragraph({ 
              text: `Step ${step.order}: ${step.title}`,
              heading: HeadingLevel.HEADING_2
            }),
            new Paragraph({ text: step.description }),
            // Add image run for screenshot
          ])
        ]
      }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }
  ```
- [ ] Ensure Word navigation pane compatibility (proper heading styles)
- [ ] Make all text fully editable after export
- [ ] Add export endpoint similar to PDF flow

#### Sprint 4.3: Version History & Diff Viewer (Week 19-20)
```
Priority: 🟢 MEDIUM
Complexity: High
Dependencies: 2.1 complete
```

**Tasks:**
- [ ] Implement version creation on each save:
  ```typescript
  // On document update
  const newVersion = await db.insert(documentVersions).values({
    documentId: doc.id,
    versionNumber: latestVersion + 1,
    versionLabel: `v${latestVersion + 1}`,
    createdByUserId: user.id,
  });
  
  // Clone steps to new version
  await db.insert(steps).values(
    updatedSteps.map(s => ({ ...s, versionId: newVersion.id }))
  );
  ```
- [ ] Build version history UI at `/doc/:id/history`:
  - Timeline view with version cards
  - Click to preview specific version
  - Restore button to revert
- [ ] Implement diff algorithm:
  ```typescript
  import { diffLines } from 'diff';
  
  function compareSteps(oldSteps, newSteps) {
    return oldSteps.map((oldStep, idx) => {
      const newStep = newSteps[idx];
      const descDiff = diffLines(oldStep.description, newStep?.description || '');
      return { stepNumber: idx + 1, descDiff, added: !oldStep, removed: !newStep };
    });
  }
  ```
- [ ] Add named versions feature ("Published v1", "Post-review v2")
- [ ] Show visual diff highlighting (green for additions, red for deletions)

**Deliverable:** Professional export formats and complete version control system.

---

## Phase 5: Search, Integrations & Automation (Weeks 21-26)

### 5.1 Full-Text Search (Week 21-22)
```
Priority: 🟢 MEDIUM
Complexity: Medium
Dependencies: 2.1 complete
```

**Tasks:**
- [ ] Enable PostgreSQL full-text search:
  ```sql
  ALTER TABLE documents ADD COLUMN search_vector tsvector;
  
  CREATE INDEX documents_search_idx ON documents USING GIN(search_vector);
  
  CREATE FUNCTION documents_search_update() RETURNS trigger AS $$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(NEW.tags::text, '')), 'C');
    RETURN NEW;
  END
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER documents_search_update
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION documents_search_update();
  ```
- [ ] Add search endpoint:
  ```typescript
  GET /api/search?q=password+reset&filters[status]=published
  ```
- [ ] Implement semantic search with AI embeddings (future enhancement):
  - Generate embeddings for each document
  - Store in pgvector extension
  - Enable similarity search: "find docs about resetting passwords"
- [ ] Build search UI with filters (status, date range, tags, creator)
- [ ] Add search result ranking by relevance + recency + view count

#### Sprint 5.2: Staleness Detection & Alerts (Week 23)
```
Priority: 🟢 MEDIUM
Complexity: Low-Medium
Dependencies: 2.1 complete
```

**Tasks:**
- [ ] Create background job with BullMQ + Redis:
  ```bash
  npm install bullmq ioredis
  ```
- [ ] Implement daily staleness check:
  ```typescript
  // jobs/stalenessChecker.ts
  const staleDocs = await db.query.documents.findMany({
    where: sql`NOW() - last_reviewed_at > (review_interval_days || ' days')::INTERVAL`
  });
  
  for (const doc of staleDocs) {
    await sendEmail({
      to: doc.owner.email,
      subject: `Action Required: "${doc.title}" needs review`,
      template: 'stale-document-alert',
      data: { doc, reviewLink: `https://app.ronflow.io/doc/${doc.id}` }
    });
    
    await db.update(documents)
      .set({ status: 'needs_review' })
      .where(eq(documents.id, doc.id));
  }
  ```
- [ ] Add "Mark as Reviewed" button in UI (resets clock without edits)
- [ ] Send weekly digest emails for upcoming reviews
- [ ] Track review compliance metrics in analytics

#### Sprint 5.3: Third-Party Integrations (Week 24-26)
```
Priority: 🟢 LOW-MEDIUM (Enterprise Feature)
Complexity: High
Dependencies: 3.1, 4.1 complete
```

**Tasks:**
- [ ] Slack integration:
  - Post document updates to configured channel
  - Receive commands: `/ronflow create`, `/ronflow share`
- [ ] Notion sync:
  - Push SOPs as Notion pages
  - Two-way sync for edits
- [ ] Confluence integration:
  - Export as Confluence pages
  - Maintain version history mapping
- [ ] Google Drive export:
  - Save PDFs/DOCX directly to Drive folders
- [ ] HR Systems (BambooHR, Workday):
  - Auto-detect employee departures
  - Flag their documents for immediate review
- [ ] Build integration marketplace UI in settings

**Deliverable:** Automated workflows, proactive maintenance, and ecosystem connectivity.

---

## Phase 6: Desktop App & Polish (Weeks 27-30)

### 6.1 Electron Desktop Companion (Week 27-29)
```
Priority: 🟢 LOW (Nice-to-Have)
Complexity: Very High
Dependencies: 1.4 complete
```

**Tasks:**
- [ ] Set up Electron project:
  ```bash
  npm install electron electron-builder
  ```
- [ ] Implement OS-level accessibility capture:
  - Windows: UI Automation API
  - macOS: Accessibility API (requires user permission)
  - Linux: AT-SPI (limited support)
- [ ] Fallback to screenshot-only mode when element metadata unavailable
- [ ] Sync captured sessions to same web dashboard
- [ ] Add system tray icon with recording controls
- [ ] Handle offline mode with local queue sync

**Note:** This is complex and may be deferred post-MVP launch.

#### Sprint 6.2: Performance Optimization & Monitoring (Week 30)
```
Priority: 🟡 HIGH
Complexity: Medium
Dependencies: All previous phases
```

**Tasks:**
- [ ] Add Sentry for error tracking
- [ ] Integrate PostHog for product analytics
- [ ] Implement rate limiting (100 req/min standard, 10 req/min AI endpoints)
- [ ] Add response caching for frequently accessed documents
- [ ] Optimize image delivery with Cloudflare CDN
- [ ] Set up uptime monitoring (UptimeRobot or Pingdom)
- [ ] Create performance dashboards (response times, error rates)
- [ ] Load testing with k6 or Artillery

**Deliverable:** Production-hardened platform with desktop capture option.

---

## Technical Debt & Refactoring Priorities

### Immediate (Before Phase 2)
1. **Replace in-memory storage** - Critical blocker for multi-user support
2. **Add proper error handling** - Currently many silent failures
3. **Implement request validation** - Use Zod or Joi for API input validation
4. **Add comprehensive logging** - Winston or Pino for structured logs

### Short-Term (Phase 3-4)
5. **Type safety across API** - Share types between frontend/backend
6. **Component library extraction** - Reusable UI components
7. **Test coverage** - Jest + React Testing Library (target: 70% coverage)
8. **E2E testing** - Playwright for critical user flows

### Long-Term (Phase 5-6)
9. **Microservices architecture** - Separate AI processing, export, capture services
10. **GraphQL API** - For complex frontend data requirements
11. **WebSocket implementation** - Real-time collaborative editing
12. **Multi-region deployment** - For global enterprise customers

---

## Resource Requirements

### Development Team
- **1 Full-stack Lead** (Phases 1-6 oversight)
- **1 Frontend Specialist** (Extension UI, Dashboard, Editor)
- **1 Backend Engineer** (Database, Auth, API design)
- **1 DevOps Engineer** (Part-time, Phases 2, 6)

### Infrastructure Costs (Monthly Estimate)
| Service | Tier | Cost |
|---------|------|------|
| PostgreSQL (Railway) | Pro | $29 |
| Redis (Upstash) | Pay-as-you-go | $10 |
| S3/R2 Storage | 100GB | $10 |
| Sentry | Team | $29 |
| PostHog | Scale | $0 (open-source) |
| Resend (Email) | Pro | $30 |
| **Total** | | **~$108/month** |

### Third-Party Services
- **Google Gemini API**: ~$0.50 per 1M tokens (estimate $50-200/month based on usage)
- **Chrome Web Store Developer Fee**: $5 one-time
- **Domain & SSL**: $15/year

---

## Success Metrics (KPIs)

### MVP Launch (End of Phase 2)
- [ ] 100% of core capture flow works with real browser extension
- [ ] Zero data loss incidents
- [ ] < 2 second average AI response time
- [ ] Successful auth for 100% of test users

### Production Ready (End of Phase 4)
- [ ] PDF/DOCX exports match design specs exactly
- [ ] Version history preserves 100% of changes
- [ ] < 500ms page load time (cached)
- [ ] 99.9% uptime SLA met

### Enterprise Scale (End of Phase 6)
- [ ] Support 1000+ concurrent users
- [ ] Process 10,000+ SOP documents
- [ ] SOC 2 Type I compliance achieved
- [ ] Integration marketplace with 5+ partners

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Chrome extension rejected from store | High | Low | Follow guidelines strictly, prepare appeal |
| AI costs exceed budget | Medium | Medium | Implement caching, usage quotas, fallback to mock mode |
| PostgreSQL migration data loss | Critical | Low | Multiple backups, dry-run migrations, rollback plan |
| Security breach (auth bypass) | Critical | Low | Security audit before launch, bug bounty program |
| Extension breaks with Chrome updates | Medium | Medium | Monitor Chrome release notes, automated E2E tests |

---

## Appendix A: File Structure After Revamp

```
ronflow/
├── extension/                    # NEW: Chrome Extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup/
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── styles.css
│   └── icons/
│
├── src/                          # Frontend (enhanced)
│   ├── components/
│   │   ├── auth/                 # NEW: Login/Signup forms
│   │   ├── team/                 # NEW: Team management
│   │   ├── editor/
│   │   ├── library/
│   │   └── export/               # NEW: Export modals
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DocumentEditor.tsx
│   │   ├── TeamSettings.tsx
│   │   └── PublicView.tsx        # NEW: Shareable link page
│   └── lib/
│       ├── auth.ts               # NEW: Auth utilities
│       └── api.ts
│
├── server/                       # REORGANIZED: Backend
│   ├── index.ts                  # Main entry
│   ├── routes/
│   │   ├── auth.ts               # NEW
│   │   ├── docs.ts
│   │   ├── sessions.ts           # NEW
│   │   ├── team.ts               # NEW
│   │   ├── export.ts             # NEW
│   │   └── ai.ts
│   ├── db/
│   │   ├── schema.ts             # NEW: Drizzle schema
│   │   ├── index.ts
│   │   └── migrations/
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── export.service.ts     # NEW
│   │   └── email.service.ts      # NEW
│   ├── jobs/                     # NEW: BullMQ queues
│   │   ├── export.worker.ts
│   │   └── staleness.worker.ts
│   └── middleware/
│       ├── auth.ts
│       └── validation.ts
│
├── desktop/                      # NEW: Electron App (Phase 6)
│   ├── main.js
│   ├── preload.js
│   └── renderer/
│
├── package.json
├── tsconfig.json
├── drizzle.config.ts             # NEW
└── .env.example                  # UPDATED
```

---

## Appendix B: Environment Variables Checklist

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/ronflow

# Authentication
JWT_SECRET=min-32-random-characters-here
JWT_REFRESH_SECRET=another-32-char-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# AI
GEMINI_API_KEY=your-key-here

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxx
FROM_EMAIL=noreply@ronflow.io

# Storage
S3_BUCKET=ronflow-screenshots
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Redis (for queues)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# OAuth (Optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://app.ronflow.io
```

---

## Conclusion

This blueprint transforms Ronflow from a **simulation-based MVP** into a **production-ready enterprise platform** matching the original Prompt-Master vision. The phased approach ensures steady progress with clear milestones, allowing for iterative feedback and course correction.

**Key Transformation Points:**
1. **Real capture replaces simulation** - Actual browser extension capturing live workflows
2. **Database persistence replaces in-memory** - Scalable, multi-user architecture
3. **Authentication enables teams** - Secure collaboration and access control
4. **Professional exports** - PDF/DOCX ready for corporate distribution
5. **Automation reduces maintenance** - Staleness detection, integrations, alerts

**Estimated Timeline:** 30 weeks (~7 months) for full implementation  
**Recommended Starting Point:** Phase 1.1 (Browser Extension) - highest impact, foundational

---

*Prepared by: AI Code Expert*  
*Date: December 2025*  
*Based on: Prompt-Master Full Development Specification*
