// src/lib/audit.ts

export const AUDIT_ACTIONS = {
  STORE_IMPORTED_SUMMARY: 'STORE_IMPORTED_SUMMARY',
  EXPORT_FAILURE: 'EXPORT_FAILURE',
  PLANNER_ACTIVITY_EXPORTED: 'PLANNER_ACTIVITY_EXPORTED',
  AI_SIMULATE_RUN: 'AI_SIMULATE_RUN',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED'
} as const;

export interface AuditEntry {
  userId: string;
  action: string;
  targetId: string;
  source: string;
  before?: any;
  after?: any;
}

interface StoredAuditEntry extends AuditEntry {
  id: string;
  timestamp: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const auditEntry: StoredAuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };

  // Get existing audit logs
  const existingLogs = await window.spark.kv.get<StoredAuditEntry[]>('audit_logs') || [];
  
  // Add new entry
  const updatedLogs = [auditEntry, ...existingLogs];
  
  // Keep only the last 1000 entries
  const trimmedLogs = updatedLogs.slice(0, 1000);
  
  await window.spark.kv.set('audit_logs', trimmedLogs);
}

export async function getRecentAuditLogs(limit: number = 100): Promise<StoredAuditEntry[]> {
  const allLogs = await window.spark.kv.get<StoredAuditEntry[]>('audit_logs') || [];
  return allLogs.slice(0, limit);
}

export function useAuditLog() {
  return {
    writeAuditLog,
    getRecentAuditLogs
  };
}