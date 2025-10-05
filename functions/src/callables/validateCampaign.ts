import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { governanceEngine } from '../lib/governanceEngine';
import { auditHash } from '../lib/auditHash';

const ValidateCampaignSchema = z.object({
  campaignId: z.string().min(1),
  campaignData: z.record(z.unknown()),
  validationType: z.enum(['draft', 'preview', 'publish']).default('draft'),
});

export const validateCampaign = onCall(
  {
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request): Promise<{ success: boolean; errors: string[]; warnings: string[] }> => {
    try {
      // Validate input
      const { campaignId, campaignData, validationType } = ValidateCampaignSchema.parse(request.data);

      // Check authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const uid = request.auth.uid;

      // Validate campaign data using governance engine
      const validationResult = await governanceEngine.validateCampaign({
        campaignId,
        campaignData,
        validationType,
        userId: uid,
      });

      // Log validation attempt
      await admin.firestore().collection('telemetry').add({
        event: 'campaign_validation',
        userId: uid,
        campaignId,
        validationType,
        success: validationResult.errors.length === 0,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      const auditEntry = {
        action: 'validate_campaign',
        resourceId: campaignId,
        userId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          validationType,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
        },
        hash: auditHash({
          action: 'validate_campaign',
          resourceId: campaignId,
          userId: uid,
          timestamp: new Date().toISOString(),
        }),
      };

      await admin.firestore().collection('governance').add(auditEntry);

      return {
        success: validationResult.errors.length === 0,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpsError('invalid-argument', 'Invalid input data', error.errors);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      console.error('Campaign validation error:', error);
      throw new HttpsError('internal', 'Internal server error during validation');
    }
  }
);
