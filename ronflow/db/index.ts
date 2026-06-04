import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://ronflow:ronflow_password@localhost:5432/ronflow';

// Create PostgreSQL client
const client = postgres(connectionString, { prepare: false });

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });

// Export schema tables for easy access
export const { users, organizations, documents, documentVersions, steps, recordingSessions, auditLogs, teamMemberships } = schema;
