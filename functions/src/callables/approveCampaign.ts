import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auditHash } from '../lib/auditHash';

const ApproveCampaignSchema = z.object({
  campaignId: z.string().min(1),
  reviewId: z.string().min(1),
  approvalType: z.enum(['approve', 'reject']),
  reason: z.string().min(1, 'Reason is required for approval/rejection'),
});

export const approveCampaign = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request): Promise<{ success: boolean; newStatus: string }> => {
    try {
      // Validate input
      const { campaignId, reviewId, approvalType, reason } = ApproveCampaignSchema.parse(request.data);

      // Check authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const uid = request.auth.uid;

      // Check if user has permission to approve/reject
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data();
      const userRoles = userData?.roles || {};
      
      if (!userRoles.reviewer && !userRoles.admin) {
        throw new HttpsError('permission-denied', 'User does not have permission to approve campaigns');
      }

      // Get review record
      const reviewDoc = await admin.firestore().collection('governance').doc(reviewId).get();
      if (!reviewDoc.exists) {
        throw new HttpsError('not-found', 'Review record not found');
      }

      const reviewData = reviewDoc.data();
      
      // Check if review is still pending
      if (reviewData!.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Review has already been processed');
      }

      // Update review record
      await admin.firestore().collection('governance').doc(reviewId).update({
        status: approvalType === 'approve' ? 'approved' : 'rejected',
        reviewedBy: uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason,
      });

      // Update campaign status
      const newStatus = approvalType === 'approve' ? 'approved' : 'rejected';
      await admin.firestore().collection('campaigns').doc(campaignId).update({
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastReviewDecision: admin.firestore.FieldValue.serverTimestamp(),
        reviewDecision: approvalType,
        reviewReason: reason,
      });

      // Log approval/rejection
      await admin.firestore().collection('telemetry').add({
        event: `campaign_${approvalType}`,
        userId: uid,
        campaignId,
        reviewId,
        reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      const auditEntry = {
        action: `campaign_${approvalType}`,
        resourceId: campaignId,
        userId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reviewId,
          reason,
          previousStatus: reviewData!.status,
          newStatus,
        },
        hash: auditHash({
          action: `campaign_${approvalType}`,
          resourceId: campaignId,
          userId: uid,
          timestamp: new Date().toISOString(),
        }),
      };

      await admin.firestore().collection('governance').add(auditEntry);

      // If approved, trigger any post-approval workflows
      if (approvalType === 'approve') {
        // TODO: Trigger automated workflows like notifications, status updates, etc.
        console.log(`Campaign ${campaignId} approved, triggering post-approval workflows`);
      }

      return {
        success: true,
        newStatus,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpsError('invalid-argument', 'Invalid input data', error.errors);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      console.error('Campaign approval error:', error);
      throw new HttpsError('internal', 'Internal server error during approval');
    }
  }
);
