// ============================================
// ADD THIS CODE TO server.ts TO INTEGRATE PHASE 4 ROUTES
// Add these imports at the top of server.ts after existing imports:
// ============================================

import exportRoutes from './routes/export';
import shareRoutes from './routes/share';
import authRoutes from './routes/auth';
import { authenticateToken } from './middleware/auth';

// ============================================
// ADD THESE ROUTE REGISTRATIONS
// Place this section after the AI pipeline endpoints (~line 600) 
// and before the SESSION CAPTURE section
// ============================================

// Mount Auth Routes
app.use('/api/auth', authRoutes);

// Mount Export Routes (requires authentication)
app.use('/api/docs', authenticateToken, exportRoutes);

// Mount Share Routes (public view endpoints don't require auth)
app.use('/api', shareRoutes);

// ============================================
// END OF PATCH
// ============================================
