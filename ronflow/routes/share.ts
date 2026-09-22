import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { documents, documentVersions, steps, shareLinks, auditLogs, viewEvents } from '../db/schema';
import { db } from '../db';
import { eq, desc, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/docs/:id/share - Create or update shareable link
router.post('/:id/share', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { password, expiresAt } = req.body;

    // Verify document exists and user has access
    const docRecords = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    
    if (docRecords.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const doc = docRecords[0];

    // Check if share link already exists
    const existingLinks = await db.select()
      .from(shareLinks)
      .where(and(eq(shareLinks.documentId, id), eq(shareLinks.isActive, true)))
      .limit(1);

    let shareToken: string;
    let shareLink;

    if (existingLinks.length > 0) {
      // Update existing link
      shareLink = existingLinks[0];
      shareToken = shareLink.shareToken;

      const updateData: any = {
        updatedAt: new Date()
      };

      if (password !== undefined) {
        if (password) {
          const saltRounds = 10;
          updateData.passwordHash = await bcrypt.hash(password, saltRounds);
        } else {
          updateData.passwordHash = null;
        }
      }

      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }

      await db.update(shareLinks).set(updateData).where(eq(shareLinks.id, shareLink.id));
    } else {
      // Create new share link
      shareToken = uuidv4().replace(/-/g, ''); // 32-char token without dashes
      
      const passwordHash = password ? await bcrypt.hash(password, saltRounds) : null;

      const newLink = await db.insert(shareLinks).values({
        id: uuidv4(),
        documentId: id,
        shareToken,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        createdByUserId: userId || null
      }).returning();

      shareLink = newLink[0];
    }

    // Log audit event
    await db.insert(auditLogs).values({
      id: uuidv4(),
      orgId: doc.orgId,
      userId: userId || null,
      action: 'document.share.create',
      entityType: 'document',
      entityId: id,
      metadata: { shareToken, hasPassword: !!password }
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/view/${shareToken}`;

    res.json({
      success: true,
      shareToken,
      shareUrl,
      hasPassword: !!shareLink.passwordHash,
      expiresAt: shareLink.expiresAt
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ error: 'Failed to create shareable link' });
  }
});

// DELETE /api/docs/:id/share - Deactivate shareable link
router.delete('/:id/share', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get document
    const docRecords = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    
    if (docRecords.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const doc = docRecords[0];

    // Deactivate all active share links for this document
    await db.update(shareLinks)
      .set({ 
        isActive: false,
        deactivatedAt: new Date()
      })
      .where(and(eq(shareLinks.documentId, id), eq(shareLinks.isActive, true)));

    // Log audit event
    await db.insert(auditLogs).values({
      id: uuidv4(),
      orgId: doc.orgId,
      userId: userId || null,
      action: 'document.share.deactivate',
      entityType: 'document',
      entityId: id
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Deactivate share link error:', error);
    res.status(500).json({ error: 'Failed to deactivate shareable link' });
  }
});

// GET /api/view/:shareToken - Public read-only document access (no auth required)
router.get('/view/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

    // Find active share link
    const linkRecords = await db.select()
      .from(shareLinks)
      .where(and(eq(shareLinks.shareToken, shareToken), eq(shareLinks.isActive, true)))
      .limit(1);

    if (linkRecords.length === 0) {
      res.status(404).json({ error: 'Share link not found or inactive' });
      return;
    }

    const shareLink = linkRecords[0];

    // Check if expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      res.status(410).json({ error: 'Share link has expired' });
      return;
    }

    // Get document
    const docRecords = await db.select().from(documents).where(eq(documents.id, shareLink.documentId)).limit(1);
    
    if (docRecords.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const doc = docRecords[0];

    // Get current version
    const versions = await db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, doc.id))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);

    const currentVersion = versions[0];

    // Get all steps
    const docSteps = await db.select()
      .from(steps)
      .where(eq(steps.versionId, currentVersion.id))
      .orderBy(steps.order);

    // Return document data (without sensitive fields)
    res.json({
      document: {
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        prerequisites: doc.prerequisites,
        estimatedTime: doc.estimatedTime,
        status: doc.status,
        tags: doc.tags,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      },
      version: {
        number: currentVersion.versionNumber,
        label: currentVersion.versionLabel
      },
      steps: docSteps.map(step => ({
        id: step.id,
        order: step.order,
        title: step.title,
        description: step.description,
        actionType: step.actionType,
        notes: step.notes,
        screenshotUrl: step.screenshotUrl,
        annotationMetadata: step.annotationMetadata
      }))
    });
  } catch (error) {
    console.error('Get shared document error:', error);
    res.status(500).json({ error: 'Failed to retrieve shared document' });
  }
});

// POST /api/view/:shareToken/track - Track view event
router.post('/view/:shareToken/track', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { viewerEmail, userAgent, ipAddress, timeSpentPerStep } = req.body;

    // Find share link
    const linkRecords = await db.select()
      .from(shareLinks)
      .where(and(eq(shareLinks.shareToken, shareToken), eq(shareLinks.isActive, true)))
      .limit(1);

    if (linkRecords.length === 0) {
      res.status(404).json({ error: 'Share link not found or inactive' });
      return;
    }

    const shareLink = linkRecords[0];

    // Create view event
    const viewEvent = await db.insert(viewEvents).values({
      id: uuidv4(),
      shareLinkId: shareLink.id,
      viewerEmail: viewerEmail || null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      viewedAt: new Date(),
      timeSpentPerStep: timeSpentPerStep || null
    }).returning();

    // Update share link last viewed at
    await db.update(shareLinks)
      .set({ lastViewedAt: new Date() })
      .where(eq(shareLinks.id, shareLink.id));

    res.json({ success: true, viewId: viewEvent[0].id });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// GET /api/docs/:id/shares - List all share links for a document
router.get('/:id/shares', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const shares = await db.select({
      id: shareLinks.id,
      shareToken: shareLinks.shareToken,
      createdAt: shareLinks.createdAt,
      updatedAt: shareLinks.updatedAt,
      expiresAt: shareLinks.expiresAt,
      isActive: shareLinks.isActive,
      lastViewedAt: shareLinks.lastViewedAt,
      deactivatedAt: shareLinks.deactivatedAt,
      hasPassword: shareLinks.passwordHash
    })
      .from(shareLinks)
      .where(eq(shareLinks.documentId, id))
      .orderBy(desc(shareLinks.createdAt));

    res.json(shares.map(s => ({
      ...s,
      hasPassword: !!s.hasPassword,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/view/${s.shareToken}`
    })));
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({ error: 'Failed to get share links' });
  }
});

export default router;
