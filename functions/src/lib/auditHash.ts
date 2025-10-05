import * as crypto from 'crypto';

export interface AuditData {
  action: string;
  resourceId: string;
  userId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function auditHash(data: AuditData): string {
  // Create a deterministic hash from audit data
  const hashInput = JSON.stringify({
    action: data.action,
    resourceId: data.resourceId,
    userId: data.userId,
    timestamp: data.timestamp,
    metadata: data.metadata || {},
  });

  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

export function verifyAuditHash(data: AuditData, hash: string): boolean {
  const expectedHash = auditHash(data);
  return expectedHash === hash;
}

export function createAuditEntry(
  action: string,
  resourceId: string,
  userId: string,
  metadata?: Record<string, unknown>
): { hash: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  const hash = auditHash({
    action,
    resourceId,
    userId,
    timestamp,
    metadata,
  });

  return { hash, timestamp };
}
