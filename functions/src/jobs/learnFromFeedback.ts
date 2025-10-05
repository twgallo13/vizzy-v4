import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const learnFromFeedback = onSchedule(
  {
    schedule: '0 2 * * *', // Run daily at 2 AM
    timeZone: 'UTC',
    memory: '1GiB',
  },
  async (event) => {
    console.log('Starting learnFromFeedback job:', event.scheduleTime);
    
    try {
      const db = admin.firestore();
      
      // Get feedback data from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const feedbackSnapshot = await db
        .collection('telemetry')
        .where('event', 'in', [
          'ai_suggestion_accepted',
          'ai_suggestion_rejected',
          'campaign_approved',
          'campaign_rejected',
          'user_feedback'
        ])
        .where('timestamp', '>=', yesterday)
        .get();

      console.log(`Found ${feedbackSnapshot.docs.length} feedback records`);

      // Process feedback to improve AI suggestions
      const feedbackData = [];
      for (const doc of feedbackSnapshot.docs) {
        const data = doc.data();
        feedbackData.push({
          id: doc.id,
          ...data,
        });
      }

      // Analyze feedback patterns
      const analysis = await analyzeFeedbackPatterns(feedbackData);
      
      // Update AI learning model (mock implementation)
      await updateAIModel(analysis);
      
      // Store learning results
      await db.collection('aiLearning').add({
        type: 'feedback_analysis',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        analysis,
        recordCount: feedbackData.length,
      });

      console.log('learnFromFeedback job completed successfully');
    } catch (error) {
      console.error('Error in learnFromFeedback job:', error);
      
      // Log error for monitoring
      await admin.firestore().collection('telemetry').add({
        event: 'job_error',
        jobName: 'learnFromFeedback',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

async function analyzeFeedbackPatterns(feedbackData: any[]): Promise<Record<string, unknown>> {
  const analysis = {
    totalFeedback: feedbackData.length,
    acceptanceRate: 0,
    rejectionRate: 0,
    commonReasons: {},
    suggestionTypes: {},
    userPatterns: {},
  };

  let acceptedCount = 0;
  let rejectedCount = 0;
  const reasons: Record<string, number> = {};
  const suggestionTypes: Record<string, number> = {};
  const userPatterns: Record<string, number> = {};

  for (const feedback of feedbackData) {
    if (feedback.event === 'ai_suggestion_accepted') {
      acceptedCount++;
    } else if (feedback.event === 'ai_suggestion_rejected') {
      rejectedCount++;
      
      // Track rejection reasons
      if (feedback.reason) {
        reasons[feedback.reason] = (reasons[feedback.reason] || 0) + 1;
      }
    }

    // Track suggestion types
    if (feedback.suggestionType) {
      suggestionTypes[feedback.suggestionType] = (suggestionTypes[feedback.suggestionType] || 0) + 1;
    }

    // Track user patterns
    if (feedback.userId) {
      userPatterns[feedback.userId] = (userPatterns[feedback.userId] || 0) + 1;
    }
  }

  analysis.acceptanceRate = feedbackData.length > 0 ? acceptedCount / feedbackData.length : 0;
  analysis.rejectionRate = feedbackData.length > 0 ? rejectedCount / feedbackData.length : 0;
  analysis.commonReasons = reasons;
  analysis.suggestionTypes = suggestionTypes;
  analysis.userPatterns = userPatterns;

  return analysis;
}

async function updateAIModel(analysis: Record<string, unknown>): Promise<void> {
  // TODO: Implement actual AI model updating logic
  // This would typically involve:
  // 1. Analyzing feedback patterns
  // 2. Updating suggestion algorithms
  // 3. Adjusting confidence thresholds
  // 4. Retraining models if necessary
  
  console.log('Updating AI model with analysis:', analysis);
  
  // For now, we'll just log the analysis
  // In a real implementation, this would update the AI service
  await admin.firestore().collection('aiModelUpdates').add({
    type: 'feedback_learning',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    analysis,
    modelVersion: '1.0.0',
  });
}
