// src/lib/audit.ts

export const AUDIT_ACTIONS = {
  STORE_IMPORTED_SUMMARY: 'STORE_IMPORTED_SUMMARY',
  AI_SIMULATE_RUN: 'AI_SIMULATE_RUN',
  USER_UPDATED: 'USER_UPDATED',
} as const;

export interface AuditEntry {
  userId: string;
  action: string;
  targetId: string;
  id: string;
}

export async function addAuditLog(entry: Omit<AuditEntry, 'id'>) {
  const existingLogs: AuditEntry[] = await window.spark.kv.get('audit_logs') || [];
  
  // Add new entry
  const newEntry: AuditEntry = {
    ...entry,
    id: crypto.randomUUID()
  };
  
  const allLogs = [newEntry, ...existingLogs];
  
  // Keep only last 100 entries
  const trimmedLogs = allLogs.slice(0, 100);
  
  await window.spark.kv.set('audit_logs', trimmedLogs);
}

// Export writeAuditLog as an alias for compatibility
export const writeAuditLog = addAuditLog;

export function useAuditLog() {
  return {
    writeAuditLog: addAuditLog
  };
}
