// src/lib/audit.ts

export type AuditSource = 'ui' | 'chat' | 'backend';

export const AUDIT_ACTIONS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED', 
  USER_DELETED: 'USER_DELETED',
  STORE_IMPORTED_SUMMARY: 'STORE_IMPORTED_SUMMARY',
  EXPORT_FAILURE: 'EXPORT_FAILURE',
  PLANNER_ACTIVITY_EXPORTED: 'PLANNER_ACTIVITY_EXPORTED',
  AI_SIMULATE_RUN: 'AI_SIMULATE_RUN'
} as const;

export interface AuditEntry {
  userId: string;
  action: string;           // e.g., 'AI_SIMULATE_RUN'
  targetId: string;         // e.g., 'simulation' or an entity id
  source: AuditSource;      // 'ui' | 'chat' | 'backend'
  before?: object;          // optional
  after?: object;           // optional
}

interface StoredAuditEntry extends AuditEntry {
  id: string;
  timestamp: string;
  diff: {
    before: object;
    after: object;
  };
}

export async function writeAuditLog(entry: AuditEntry) {
  const auditEntry: StoredAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: entry.userId,
    action: entry.action,
    targetId: entry.targetId,
    source: entry.source,
    diff: {
      before: entry.before ?? {},
      after: entry.after ?? {},
    },
    timestamp: new Date().toISOString(),
  };

  // Get existing audit logs
  const existingLogs = await window.spark.kv.get<StoredAuditEntry[]>('audit_logs') || [];
  
  // Add new entry
  const updatedLogs = [...existingLogs, auditEntry];
  
  // Keep only the last 1000 entries to prevent storage bloat
  const trimmedLogs = updatedLogs.slice(-1000);
  
  // Save back to storage
  await window.spark.kv.set('audit_logs', trimmedLogs);
}

export async function getAuditLogs(): Promise<StoredAuditEntry[]> {
  return await window.spark.kv.get<StoredAuditEntry[]>('audit_logs') || [];
}

export async function getRecentAuditLogs(limit: number = 10): Promise<StoredAuditEntry[]> {
  const allLogs = await window.spark.kv.get<StoredAuditEntry[]>('audit_logs') || [];
  return allLogs.slice(-limit).reverse(); // Get most recent entries
}

export function useAuditLog() {
  return {
    writeAuditLog,
    getAuditLogs,
    getRecentAuditLogs
  };
}