export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  authProvider: 'google' | 'password';
  avatarUrl?: string;
  roleId: string;
  tierId: string;
  strengths?: string[];
  skills?: Record<string, number>;
  availability?: { weeklyHours: number };
  wrikeName: string; // MUST equal `${firstName} ${lastName}`
  wrikeSync: boolean;
  phone?: string;
  timezone?: string;
  mfaEnabled: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  status: 'active' | 'suspended';
}

export interface Store {
  storeId: string; // doc id
  storeNumber: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  status: 'open' | 'closed' | 'comingSoon';
  storeType: 'mall' | 'street' | 'outlet' | 'popUp' | string;
  phone?: string;
  website?: string;
  hours?: Record<string, { open: string; close: string }>;
  managerUid?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Role {
  roleId: string;
  name: string; // e.g., "Admin", "Manager", "Planner"
  permissions: string[]; // granular gates; joined with tier permissions
  description?: string;
}

export interface Tier {
  tierId: string;
  name: string; // "Local" | "Regional" | "Global"
  permissions: string[]; // scope-related grants
  description?: string;
}

export interface AuditLog {
  logId: string;
  timestamp: any;
  userId: string; // actor uid
  action: string; // e.g., CREATE_USER, UPDATE_STORE, EXPORT_WRIKE
  targetId: string; // uid or store/activity id
  source: 'ui' | 'chat' | 'backend';
  diff: {
    before: object;
    after: object;
  };
}