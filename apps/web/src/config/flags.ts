// Feature flags for Vizzy v4
export const FLAGS = {
  // AI Features
  AI_SUGGESTIONS: true,
  AI_AUTO_COMPLETE: false,
  AI_CONTENT_GENERATION: true,
  AI_SENTIMENT_ANALYSIS: false,
  
  // Governance Features
  TBAC_ENABLED: true,
  AUTO_APPROVAL: false,
  AUDIT_LOGGING: true,
  IMMUTABLE_LOGS: true,
  
  // Integration Features
  WRIKE_EXPORT: true,
  WRIKE_SYNC: false,
  SLACK_NOTIFICATIONS: false,
  EMAIL_NOTIFICATIONS: true,
  
  // UI Features
  COMMAND_PALETTE: true,
  DARK_MODE: false,
  SIDEBAR_COLLAPSIBLE: true,
  ANIMATIONS: true,
  
  // Analytics Features
  TELEMETRY_ENABLED: true,
  PERFORMANCE_MONITORING: true,
  ERROR_TRACKING: true,
  USER_ANALYTICS: true,
  
  // Development Features
  MOCK_DATA: false,
  DEBUG_MODE: false,
  PERFORMANCE_LOGGING: false,
} as const;

export type FeatureFlag = keyof typeof FLAGS;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag];
}

// Helper function to get all enabled features
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.keys(FLAGS).filter(flag => FLAGS[flag as FeatureFlag]) as FeatureFlag[];
}

// Environment-specific flag overrides
if (import.meta.env.DEV) {
  // Development overrides
  Object.assign(FLAGS, {
    DEBUG_MODE: true,
    PERFORMANCE_LOGGING: true,
    MOCK_DATA: true,
  });
}

if (import.meta.env.MODE === 'staging') {
  // Staging overrides
  Object.assign(FLAGS, {
    AI_AUTO_COMPLETE: true,
    SLACK_NOTIFICATIONS: true,
  });
}
