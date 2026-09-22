import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ORGANIZATIONS
// ============================================
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  plan: text('plan').default('free').notNull(), // free, pro, team, enterprise
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('org_name_idx').on(table.name)
}));

// ============================================
// USERS
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('member').notNull(), // admin, member
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  orgIdx: index('users_org_idx').on(table.orgId)
}));

// ============================================
// TEAM MEMBERSHIPS (for cross-org access)
// ============================================
export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  role: text('role').default('viewer').notNull(), // admin, editor, viewer
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  status: text('status').default('pending').notNull() // pending, active, revoked
}, (table) => ({
  userOrgIdx: index('team_user_org_idx').on(table.userId, table.orgId),
  statusIdx: index('team_status_idx').on(table.status)
}));

// ============================================
// DOCUMENTS
// ============================================
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  prerequisites: jsonb('prerequisites').default([]),
  status: text('status').default('draft').notNull(), // draft, published, needs_review, archived
  shareToken: text('share_token').unique(),
  sharePasswordHash: text('share_password_hash'),
  reviewIntervalDays: integer('review_interval_days').default(90).notNull(),
  lastReviewedAt: timestamp('last_reviewed_at').defaultNow().notNull(),
  tags: jsonb('tags').default([]),
  currentVersionId: uuid('current_version_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at')
}, (table) => ({
  orgIdx: index('docs_org_idx').on(table.orgId),
  statusIdx: index('docs_status_idx').on(table.status),
  creatorIdx: index('docs_creator_idx').on(table.creatorId),
  shareTokenIdx: index('docs_share_token_idx').on(table.shareToken)
}));

// ============================================
// DOCUMENT VERSIONS
// ============================================
export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  versionLabel: text('version_label'),
  changeDescription: text('change_description'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  docIdx: index('doc_versions_doc_idx').on(table.documentId),
  versionIdx: index('doc_versions_number_idx').on(table.documentId, table.versionNumber)
}));

// ============================================
// STEPS
// ============================================
export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  actionType: text('action_type').notNull(), // click, type, navigate, submit, select, scroll, manual
  rawEventMetadata: jsonb('raw_event_metadata').default({}),
  screenshotUrl: text('screenshot_url'),
  annotationMetadata: jsonb('annotation_metadata').default({}),
  aiGenerated: boolean('ai_generated').default(true).notNull(),
  aiGeneratedAt: timestamp('ai_generated_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  docIdx: index('steps_doc_idx').on(table.documentId),
  versionIdx: index('steps_version_idx').on(table.versionId),
  orderIdx: index('steps_order_idx').on(table.documentId, table.order)
}));

// ============================================
// RECORDING SESSIONS
// ============================================
export const recordingSessions = pgTable('recording_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  extensionSessionId: text('extension_session_id').unique(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  stoppedAt: timestamp('stopped_at'),
  status: text('status').default('in_progress').notNull(), // in_progress, processing, complete, failed
  rawEventsJson: jsonb('raw_events_json').default([]),
  stepCount: integer('step_count').default(0),
  targetDocumentId: uuid('target_document_id').references(() => documents.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  statusIdx: index('sessions_status_idx').on(table.status),
  extensionIdx: index('sessions_extension_idx').on(table.extensionSessionId)
}));

// ============================================
// AUDIT LOGS
// ============================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  orgIdx: index('audit_org_idx').on(table.orgId),
  userIdx: index('audit_user_idx').on(table.userId),
  entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt)
}));

// ============================================
// SHARE LINKS (for public document sharing)
// ============================================
export const shareLinks = pgTable('share_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  shareToken: text('share_token').notNull().unique(),
  passwordHash: text('password_hash'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastViewedAt: timestamp('last_viewed_at'),
  deactivatedAt: timestamp('deactivated_at')
}, (table) => ({
  docIdx: index('share_links_doc_idx').on(table.documentId),
  tokenIdx: index('share_links_token_idx').on(table.shareToken),
  activeIdx: index('share_links_active_idx').on(table.isActive)
}));

// ============================================
// VIEW EVENTS (tracking shared document views)
// ============================================
export const viewEvents = pgTable('view_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shareLinkId: uuid('share_link_id').references(() => shareLinks.id, { onDelete: 'cascade' }).notNull(),
  viewerEmail: text('viewer_email'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  timeSpentPerStep: jsonb('time_spent_per_step').default([])
}, (table) => ({
  shareLinkIdx: index('view_events_share_link_idx').on(table.shareLinkId),
  viewedAtIdx: index('view_events_viewed_at_idx').on(table.viewedAt)
}));

// ============================================
// RELATIONS
// ============================================
export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  documents: many(documents),
  recordingSessions: many(recordingSessions),
  auditLogs: many(auditLogs),
  teamMemberships: many(teamMemberships)
}));

export const userRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id]
  }),
  createdDocuments: many(documents, { relationName: 'creator' }),
  ownedDocuments: many(documents, { relationName: 'owner' }),
  teamMemberships: many(teamMemberships),
  auditLogs: many(auditLogs)
}));

export const documentRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.orgId],
    references: [organizations.id]
  }),
  creator: one(users, {
    fields: [documents.creatorId],
    references: [users.id],
    relationName: 'creator'
  }),
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
    relationName: 'owner'
  }),
  versions: many(documentVersions),
  steps: many(steps)
}));

export const documentVersionRelations = relations(documentVersions, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  }),
  creator: one(users, {
    fields: [documentVersions.createdByUserId],
    references: [users.id]
  }),
  steps: many(steps)
}));

export const stepRelations = relations(steps, ({ one }) => ({
  document: one(documents, {
    fields: [steps.documentId],
    references: [documents.id]
  }),
  version: one(documentVersions, {
    fields: [steps.versionId],
    references: [documentVersions.id]
  })
}));

export const recordingSessionRelations = relations(recordingSessions, ({ one }) => ({
  user: one(users, {
    fields: [recordingSessions.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [recordingSessions.orgId],
    references: [organizations.id]
  }),
  targetDocument: one(documents, {
    fields: [recordingSessions.targetDocumentId],
    references: [documents.id]
  })
}));

export const teamMembershipRelations = relations(teamMemberships, ({ one }) => ({
  user: one(users, {
    fields: [teamMemberships.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [teamMemberships.orgId],
    references: [organizations.id]
  }),
  inviter: one(users, {
    fields: [teamMemberships.invitedBy],
    references: [users.id]
  })
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));

export const shareLinkRelations = relations(shareLinks, ({ one, many }) => ({
  document: one(documents, {
    fields: [shareLinks.documentId],
    references: [documents.id]
  }),
  creator: one(users, {
    fields: [shareLinks.createdByUserId],
    references: [users.id]
  }),
  viewEvents: many(viewEvents)
}));

export const viewEventRelations = relations(viewEvents, ({ one }) => ({
  shareLink: one(shareLinks, {
    fields: [viewEvents.shareLinkId],
    references: [shareLinks.id]
  })
}));
