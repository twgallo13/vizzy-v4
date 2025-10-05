import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { wrikeMapper } from '../lib/wrikeMapper';
import { auditHash } from '../lib/auditHash';

const ExportToWrikeSchema = z.object({
  campaignId: z.string().min(1),
  exportType: z.enum(['campaign', 'tasks', 'timeline']).default('campaign'),
  wrikeProjectId: z.string().optional(),
  includeMetadata: z.boolean().default(true),
});

export const exportToWrike = onCall(
  {
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request): Promise<{ success: boolean; wrikeId?: string; exportUrl?: string }> => {
    try {
      // Validate input
      const { campaignId, exportType, wrikeProjectId, includeMetadata } = ExportToWrikeSchema.parse(request.data);

      // Check authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const uid = request.auth.uid;

      // Check if user has permission to export to Wrike
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data();
      const userRoles = userData?.roles || {};
      
      if (!userRoles.admin && !userRoles.editor) {
        throw new HttpsError('permission-denied', 'User does not have permission to export to Wrike');
      }

      // Get campaign data
      const campaignDoc = await admin.firestore().collection('campaigns').doc(campaignId).get();
      if (!campaignDoc.exists) {
        throw new HttpsError('not-found', 'Campaign not found');
      }

      const campaignData = campaignDoc.data();
      
      // Check if campaign is approved or active
      if (!['approved', 'active'].includes(campaignData!.status)) {
        throw new HttpsError('failed-precondition', 'Campaign must be approved or active to export to Wrike');
      }

      // Map campaign data to Wrike format
      const wrikeData = await wrikeMapper.mapCampaignToWrike({
        campaign: campaignData!,
        exportType,
        includeMetadata,
      });

      // TODO: Implement actual Wrike API integration
      // For now, we'll simulate the export
      const wrikeId = `wrike_${campaignId}_${Date.now()}`;
      
      // Store export record
      await admin.firestore().collection('wrike').add({
        campaignId,
        wrikeId,
        exportType,
        exportedBy: uid,
        exportedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        data: wrikeData,
      });

      // Update campaign with Wrike reference
      await admin.firestore().collection('campaigns').doc(campaignId).update({
        wrikeId,
        lastWrikeExport: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log export
      await admin.firestore().collection('telemetry').add({
        event: 'campaign_exported_to_wrike',
        userId: uid,
        campaignId,
        wrikeId,
        exportType,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      const auditEntry = {
        action: 'export_to_wrike',
        resourceId: campaignId,
        userId: uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          wrikeId,
          exportType,
          includeMetadata,
        },
        hash: auditHash({
          action: 'export_to_wrike',
          resourceId: campaignId,
          userId: uid,
          timestamp: new Date().toISOString(),
        }),
      };

      await admin.firestore().collection('governance').add(auditEntry);

      return {
        success: true,
        wrikeId,
        exportUrl: `https://wrike.com/project/${wrikeId}`, // Mock URL
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpsError('invalid-argument', 'Invalid input data', error.errors);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      console.error('Wrike export error:', error);
      throw new HttpsError('internal', 'Internal server error during Wrike export');
    }
  }
);
