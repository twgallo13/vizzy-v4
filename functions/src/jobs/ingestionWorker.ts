import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const ingestionWorker = onSchedule(
  {
    schedule: '*/15 * * * *', // Run every 15 minutes
    timeZone: 'UTC',
    memory: '256MiB',
  },
  async (event) => {
    console.log('Starting ingestionWorker job:', event.scheduleTime);
    
    try {
      const db = admin.firestore();
      
      // Process pending data ingestion tasks
      const pendingTasks = await db
        .collection('ingestionQueue')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', admin.firestore.FieldValue.serverTimestamp())
        .limit(10)
        .get();

      console.log(`Found ${pendingTasks.docs.length} pending ingestion tasks`);

      let processedCount = 0;
      let errorCount = 0;

      for (const taskDoc of pendingTasks.docs) {
        try {
          const taskData = taskDoc.data();
          
          // Mark task as processing
          await taskDoc.ref.update({
            status: 'processing',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Process the ingestion task
          const result = await processIngestionTask(taskData);
          
          // Mark task as completed
          await taskDoc.ref.update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            result,
          });
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing ingestion task ${taskDoc.id}:`, error);
          
          // Mark task as failed
          await taskDoc.ref.update({
            status: 'failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            error: error.message,
            retryCount: admin.firestore.FieldValue.increment(1),
          });
          
          errorCount++;
        }
      }

      // Clean up old completed tasks (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldTasks = await db
        .collection('ingestionQueue')
        .where('status', 'in', ['completed', 'failed'])
        .where('completedAt', '<', sevenDaysAgo)
        .limit(50)
        .get();

      console.log(`Found ${oldTasks.docs.length} old tasks to clean up`);

      for (const taskDoc of oldTasks.docs) {
        await taskDoc.ref.delete();
      }

      // Log job completion
      await db.collection('telemetry').add({
        event: 'ingestion_worker_completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processedCount,
        errorCount,
        cleanedUpCount: oldTasks.docs.length,
      });

      console.log(`ingestionWorker job completed: ${processedCount} processed, ${errorCount} errors, ${oldTasks.docs.length} cleaned up`);
    } catch (error) {
      console.error('Error in ingestionWorker job:', error);
      
      // Log error for monitoring
      await admin.firestore().collection('telemetry').add({
        event: 'job_error',
        jobName: 'ingestionWorker',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

async function processIngestionTask(taskData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { type, source, data } = taskData;
  
  switch (type) {
    case 'wrike_sync':
      return await processWrikeSync(data as Record<string, unknown>);
    
    case 'user_import':
      return await processUserImport(data as Record<string, unknown>);
    
    case 'campaign_bulk_import':
      return await processCampaignBulkImport(data as Record<string, unknown>);
    
    case 'analytics_data':
      return await processAnalyticsData(data as Record<string, unknown>);
    
    default:
      throw new Error(`Unknown ingestion task type: ${type}`);
  }
}

async function processWrikeSync(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  // TODO: Implement Wrike API sync
  console.log('Processing Wrike sync:', data);
  
  // Mock implementation
  return {
    type: 'wrike_sync',
    recordsProcessed: 5,
    recordsUpdated: 3,
    recordsCreated: 2,
  };
}

async function processUserImport(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  // TODO: Implement user import from external systems
  console.log('Processing user import:', data);
  
  // Mock implementation
  return {
    type: 'user_import',
    usersProcessed: 10,
    usersCreated: 8,
    usersUpdated: 2,
  };
}

async function processCampaignBulkImport(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  // TODO: Implement bulk campaign import
  console.log('Processing campaign bulk import:', data);
  
  // Mock implementation
  return {
    type: 'campaign_bulk_import',
    campaignsProcessed: 25,
    campaignsCreated: 20,
    campaignsUpdated: 5,
  };
}

async function processAnalyticsData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  // TODO: Implement analytics data processing
  console.log('Processing analytics data:', data);
  
  // Mock implementation
  return {
    type: 'analytics_data',
    recordsProcessed: 1000,
    metricsCalculated: 50,
    reportsGenerated: 5,
  };
}
