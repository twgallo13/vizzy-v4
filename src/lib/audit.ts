// src/lib/audit.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AuditSource = 'ui' | 'chat' | 'backend';

export interface AuditEntry {
  userId: string;
  action: string;      // e.g., 'AI_SIMULATE_RUN'
  targetId: string;    // entity id or logical target
  source: AuditSource; // 'ui' | 'chat' | 'backend'
  before?: object;
  after?: object;
}

export async function writeAuditLog(entry: AuditEntry) {
  await addDoc(collection(db, 'audit_logs'), {
    userId: entry.userId,
    action: entry.action,
    targetId: entry.targetId,
    source: entry.source,
    diff: {
      before: entry.before ?? {},
      after: entry.after ?? {},
    },
    timestamp: serverTimestamp(),
  });
}