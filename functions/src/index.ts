import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export callable functions
export { validateCampaign } from './callables/validateCampaign';
export { submitForReview } from './callables/submitForReview';
export { approveCampaign } from './callables/approveCampaign';
export { exportToWrike } from './callables/exportToWrike';
export { aiSuggest } from './callables/aiSuggest';

// Export scheduled jobs
export { learnFromFeedback } from './jobs/learnFromFeedback';
export { governanceBackfill } from './jobs/governanceBackfill';
export { ingestionWorker } from './jobs/ingestionWorker';

// Export utility functions
export { auditHash } from './lib/auditHash';
export { governanceEngine } from './lib/governanceEngine';
export { wrikeMapper } from './lib/wrikeMapper';

// Export integrations
export { wrikeSync } from './integrations/wrike';
