import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const governanceBackfill = onSchedule(
  {
    schedule: '0 3 * * 0', // Run weekly on Sunday at 3 AM
    timeZone: 'UTC',
    memory: '512MiB',
  },
  async (event) => {
    console.log('Starting governanceBackfill job:', event.scheduleTime);
    
    try {
      const db = admin.firestore();
      
      // Find campaigns without proper audit trails
      const campaignsSnapshot = await db
        .collection('campaigns')
        .where('auditTrailComplete', '==', false)
        .limit(100)
        .get();

      console.log(`Found ${campaignsSnapshot.docs.length} campaigns needing audit backfill`);

      let processedCount = 0;
      let errorCount = 0;

      for (const campaignDoc of campaignsSnapshot.docs) {
        try {
          const campaignData = campaignDoc.data();
          
          // Create audit trail for the campaign
          await createAuditTrail(campaignDoc.id, campaignData);
          
          // Mark campaign as having complete audit trail
          await campaignDoc.ref.update({
            auditTrailComplete: true,
            auditTrailBackfilled: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing campaign ${campaignDoc.id}:`, error);
          errorCount++;
        }
      }

      // Find governance records without proper audit hashes
      const governanceSnapshot = await db
        .collection('governance')
        .where('hash', '==', null)
        .limit(50)
        .get();

      console.log(`Found ${governanceSnapshot.docs.length} governance records needing hash backfill`);

      for (const governanceDoc of governanceSnapshot.docs) {
        try {
          const governanceData = governanceDoc.data();
          
          // Generate audit hash
          const hash = generateAuditHash(governanceData);
          
          // Update record with hash
          await governanceDoc.ref.update({
            hash,
            hashGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing governance record ${governanceDoc.id}:`, error);
          errorCount++;
        }
      }

      // Log job completion
      await db.collection('telemetry').add({
        event: 'governance_backfill_completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processedCount,
        errorCount,
        campaignsProcessed: campaignsSnapshot.docs.length,
        governanceProcessed: governanceSnapshot.docs.length,
      });

      console.log(`governanceBackfill job completed: ${processedCount} processed, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in governanceBackfill job:', error);
      
      // Log error for monitoring
      await admin.firestore().collection('telemetry').add({
        event: 'job_error',
        jobName: 'governanceBackfill',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

async function createAuditTrail(campaignId: string, campaignData: Record<string, unknown>): Promise<void> {
  const db = admin.firestore();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  
  // Create audit entries for campaign lifecycle
  const auditEntries = [
    {
      action: 'campaign_created',
      resourceId: campaignId,
      userId: campaignData.createdBy || 'system',
      timestamp,
      metadata: {
        title: campaignData.title,
        status: campaignData.status,
      },
    },
  ];

  // Add status change audit entries
  if (campaignData.status !== 'draft') {
    auditEntries.push({
      action: 'campaign_status_changed',
      resourceId: campaignId,
      userId: campaignData.updatedBy || 'system',
      timestamp,
      metadata: {
        previousStatus: 'draft',
        newStatus: campaignData.status,
      },
    });
  }

  // Add assignment audit entry
  if (campaignData.assignedTo) {
    auditEntries.push({
      action: 'campaign_assigned',
      resourceId: campaignId,
      userId: campaignData.assignedBy || 'system',
      timestamp,
      metadata: {
        assignedTo: campaignData.assignedTo,
      },
    });
  }

  // Store audit entries
  for (const entry of auditEntries) {
    const hash = generateAuditHash(entry);
    await db.collection('governance').add({
      ...entry,
      hash,
    });
  }
}

function generateAuditHash(data: Record<string, unknown>): string {
  // Simple hash generation (in real implementation, use crypto)
  const hashInput = JSON.stringify({
    action: data.action,
    resourceId: data.resourceId,
    userId: data.userId,
    timestamp: data.timestamp,
  });
  
  // This is a simplified hash - in production, use proper crypto hashing
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}
