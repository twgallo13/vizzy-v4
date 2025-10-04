import { useKV } from '@github/spark/hooks';
import type { AuditLog } from '@/models/core';

export interface WriteAuditLogParams {
  userId: string;
  action: string;
  targetId: string;
  source: 'ui' | 'chat' | 'backend';
  before?: object;
  after?: object;
}

/**
 * Hook for writing audit logs with persistence
 */
export function useAuditLog() {
  const [auditLogs, setAuditLogs] = useKV<AuditLog[]>('audit_logs', []);
  
  const writeAuditLog = async (params: WriteAuditLogParams) => {
    const logEntry: AuditLog = {
      logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: params.userId,
      action: params.action,
      targetId: params.targetId,
      source: params.source,
      diff: {
        before: params.before || {},
        after: params.after || {}
      }
    };
    
    setAuditLogs((currentLogs) => [...(currentLogs || []), logEntry]);
    
    return logEntry;
  };
  
  const getAuditLogs = () => {
    return auditLogs || [];
  };
  
  const getAuditLogsForTarget = (targetId: string) => {
    return (auditLogs || []).filter(log => log.targetId === targetId);
  };
  
  const getAuditLogsByUser = (userId: string) => {
    return (auditLogs || []).filter(log => log.userId === userId);
  };
  
  const getAuditLogsByAction = (action: string) => {
    return (auditLogs || []).filter(log => log.action === action);
  };
  
  const getRecentAuditLogs = (limit: number = 10) => {
    return (auditLogs || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };
  
  return {
    writeAuditLog,
    getAuditLogs,
    getAuditLogsForTarget,
    getAuditLogsByUser,
    getAuditLogsByAction,
    getRecentAuditLogs,
    auditLogs: auditLogs || []
  };
}

/**
 * Standard audit actions for consistency
 */
export const AUDIT_ACTIONS = {
  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  
  // Store management
  STORE_CREATED: 'STORE_CREATED',
  STORE_UPDATED: 'STORE_UPDATED',
  STORE_DELETED: 'STORE_DELETED',
  STORE_IMPORTED_SUMMARY: 'STORE_IMPORTED_SUMMARY',
  STORE_IMPORT_ROW_SKIPPED: 'STORE_IMPORT_ROW_SKIPPED',
  
  // Planner activities
  PLANNER_ACTIVITY_CREATED: 'PLANNER_ACTIVITY_CREATED',
  PLANNER_ACTIVITY_UPDATED: 'PLANNER_ACTIVITY_UPDATED',
  PLANNER_ACTIVITY_APPROVED: 'PLANNER_ACTIVITY_APPROVED',
  PLANNER_ACTIVITY_EXPORTED: 'PLANNER_ACTIVITY_EXPORTED',
  
  // AI/Chat interactions
  AI_SIMULATE_RUN: 'AI_SIMULATE_RUN',
  AI_SIMULATE_APPROVED: 'AI_SIMULATE_APPROVED',
  AI_RULE_SET: 'AI_RULE_SET',
  AI_STATUS_REQUESTED: 'AI_STATUS_REQUESTED',
  AI_EXPORT_TRIGGERED: 'AI_EXPORT_TRIGGERED',
  
  // System failures
  EXPORT_FAILURE: 'EXPORT_FAILURE',
  IMPORT_FAILURE: 'IMPORT_FAILURE',
  
  // Role/Permission changes
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  TIER_ASSIGNED: 'TIER_ASSIGNED',
  
  // Theme/Settings
  THEME_UPDATED: 'THEME_UPDATED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

/**
 * Helper function to create audit log entries with proper typing
 */
export function createAuditLogEntry(
  action: AuditAction,
  params: Omit<WriteAuditLogParams, 'action'>
): WriteAuditLogParams {
  return {
    action,
    ...params
  };
}

/**
 * Format audit log for display
 */
export function formatAuditLogForDisplay(log: AuditLog) {
  const timestamp = new Date(log.timestamp).toLocaleString();
  const actionName = log.action.replace(/_/g, ' ').toLowerCase();
  
  return {
    id: log.logId,
    timestamp,
    action: actionName,
    user: log.userId,
    target: log.targetId,
    source: log.source,
    hasChanges: Object.keys(log.diff.before).length > 0 || Object.keys(log.diff.after).length > 0,
    changes: log.diff
  };
}

/**
 * Mock current user for audit logging - in real app this would come from auth
 */
export function getCurrentUserId(): string {
  // In a real implementation, this would get the current authenticated user
  return 'u_1'; // Default to admin user
}