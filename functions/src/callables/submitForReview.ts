import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { governanceEngine } from '../lib/governanceEngine';
import { auditHash } from '../lib/auditHash';

const SubmitForReviewSchema = z.object({
  campaignId: z.string().min(1),
  reviewType: z.enum(['content', 'compliance', 'strategy']).default('content'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional(),
});

export const submitForReview = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<{ success: boolean; reviewId: string }> => {
    try {
      // Validate input
      const { campaignId, reviewType, priority, notes } = SubmitForReviewSchema.parse(request.data);

      // Check authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const uid = request.auth.uid;

      // Check if user has permission to submit for review
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data();
      const userRoles = userData?.roles || {};
      
      if (!userRoles.editor && !userRoles.admin) {
        throw new HttpsError('permission-denied', 'User does not have permission to submit for review');
      }

      // Get campaign data
      const campaignDoc = await admin.firestore().collection('campaigns').doc(campaignId).get();
      if (!campaignDoc.exists) {
        throw new HttpsError('not-found', 'Campaign not found');
      }

      const campaignData = campaignDoc.data();
      
      // Validate campaign before submission
      const validationResult = await governanceEngine.validateCampaign({
        campaignId,
        campaignData: campaignData!,
        validationType: 'publish',
        userId: uid,
      });

      if (validationResult.errors.length > 0) {
        throw new HttpsError(
          'failed-precondition',
          'Campaign validation failed',
          { errors: validationResult.errors }
        );
      }

      // Create review record
      const reviewId = admin.firestore().collection('governance').doc().id;
      
      const reviewData = {
        id: reviewId,
        type: 'campaign_review',
        title: `Review: ${campaignData!.title}`,
        description: `Campaign submitted for ${reviewType} review`,
        status: 'pending',
        submittedBy: uid,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        campaignId,
        reviewType,
        priority,
        notes: notes || '',
        metadata: {
          campaignTitle: campaignData!.title,
          campaignStatus: campaignData!.status,
        },
      };

      await admin.firestore().collection('governance').doc(reviewId).set(reviewData);

      // Update campaign status
      await admin.firestore().collection('campaigns').doc(campaignId).update({
        status: 'in-review',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastReviewSubmission: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log submission
      await admin.firestore().collection('telemetry').add({
        event: 'campaign_submitted_for_review',
        userId: uid,
        campaignId,
        reviewId,
        reviewType,
        priority,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      const auditEntry = {
        action: 'submit_for_review',
        resourceId: campaignId,
        userId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reviewId,
          reviewType,
          priority,
        },
        hash: auditHash({
          action: 'submit_for_review',
          resourceId: campaignId,
          userId: uid,
          timestamp: new Date().toISOString(),
        }),
      };

      await admin.firestore().collection('governance').add(auditEntry);

      return {
        success: true,
        reviewId,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpsError('invalid-argument', 'Invalid input data', error.errors);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      console.error('Submit for review error:', error);
      throw new HttpsError('internal', 'Internal server error during submission');
    }
  }
);
