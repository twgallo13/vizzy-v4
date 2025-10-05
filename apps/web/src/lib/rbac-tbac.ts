import { auth, db } from '@/app/init';
import { doc, getDoc } from 'firebase/firestore';
import { getDevRole } from '@/app/roleBootstrap';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  roles: Record<string, boolean>;
  permissions: Record<string, boolean>;
  teams: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  type: string;
  id: string;
  ownerId?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
}

export interface Record {
  id: string;
  type: string;
  ownerId?: string;
  teamId?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export type Verb = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'approve' 
  | 'reject' 
  | 'assign' 
  | 'export'
  | 'admin';

export type Role = 'admin' | 'manager' | 'planner' | 'analyst' | 'viewer' | 'ai-system';

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'campaigns:create',
    'campaigns:read',
    'campaigns:update',
    'campaigns:delete',
    'campaigns:approve',
    'campaigns:reject',
    'campaigns:assign',
    'campaigns:export',
    'ai-suggestions:create',
    'ai-suggestions:read',
    'ai-suggestions:update',
    'ai-suggestions:delete',
    'governance:read',
    'governance:create',
    'governance:update',
    'governance:delete',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'system:admin',
  ],
  manager: [
    'campaigns:read',
    'campaigns:update',
    'campaigns:approve',
    'campaigns:reject',
    'campaigns:assign',
    'ai-suggestions:read',
    'governance:read',
    'governance:update',
  ],
  planner: [
    'campaigns:create',
    'campaigns:read',
    'campaigns:update',
    'ai-suggestions:read',
    'ai-suggestions:create',
  ],
  analyst: [
    'campaigns:read',
    'ai-suggestions:read',
    'governance:read',
  ],
  viewer: [
    'campaigns:read',
    'ai-suggestions:read',
  ],
  'ai-system': [
    'campaigns:read',
    'ai-suggestions:create',
    'ai-suggestions:update',
    'telemetry:create',
  ],
};

let currentUser: User | null = null;

export function initializeRBAC(): void {
  // Listen for auth state changes to update current user
  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          currentUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            roles: userData.roles || {},
            permissions: userData.permissions || {},
            teams: userData.teams || [],
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          };
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        currentUser = null;
      }
    } else {
      currentUser = null;
    }
  });
}

export function getCurrentUser(): User | null {
  // In dev mode, return a demo user based on the selected role
  if (import.meta.env.VITE_ENV === 'dev') {
    const role = getDevRole() || 'admin';
    return {
      uid: 'demo-user',
      email: `${role}@demo.local`,
      displayName: `Demo (${role})`,
      roles: { [role]: true },
      permissions: {},
      teams: ['team-west'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return currentUser;
}

export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false;
  return Boolean(user.roles[role]);
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  // Check explicit permissions first
  if (user.permissions[permission]) return true;
  
  // Check role-based permissions
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (user.roles[role] && permissions.includes(permission)) {
      return true;
    }
  }
  
  return false;
}

export function can(
  user: User | null,
  verb: Verb,
  resource: Resource,
  record?: Record
): boolean {
  if (!user) return false;
  
  const permission = `${resource.type}:${verb}`;
  
  // Check basic permission
  if (!hasPermission(user, permission)) {
    return false;
  }
  
  // Team-based access control (TBAC)
  if (record?.teamId && user.teams.length > 0) {
    if (!user.teams.includes(record.teamId)) {
      return false;
    }
  }
  
  // Ownership checks for certain operations
  if (['update', 'delete'].includes(verb)) {
    // Admin can do anything
    if (hasRole(user, 'admin')) {
      return true;
    }
    
    // Check ownership
    if (record?.ownerId && record.ownerId !== user.uid) {
      return false;
    }
    
    if (resource.ownerId && resource.ownerId !== user.uid) {
      return false;
    }
  }
  
  // Special rules for AI system
  if (hasRole(user, 'ai-system')) {
    // AI system has limited permissions
    return ['read', 'create', 'update'].includes(verb) && 
           ['campaigns', 'ai-suggestions', 'telemetry'].includes(resource.type);
  }
  
  return true;
}

export function canAccessRoute(user: User | null, routePath: string): boolean {
  if (!user) return false;
  
  // In dev mode, allow access to all routes for testing
  if (import.meta.env.VITE_ENV === 'dev') {
    return true;
  }
  
  // Admin routes
  if (routePath.startsWith('/admin/')) {
    return hasRole(user, 'admin');
  }
  
  // Governance routes
  if (routePath === '/governance') {
    return hasRole(user, 'admin') || hasRole(user, 'manager');
  }
  
  // All other routes require basic authentication
  return true;
}

export function getUserPermissions(user: User | null): string[] {
  if (!user) return [];
  
  const permissions = new Set<string>();
  
  // Add explicit permissions
  Object.entries(user.permissions).forEach(([permission, granted]) => {
    if (granted) permissions.add(permission);
  });
  
  // Add role-based permissions
  Object.entries(user.roles).forEach(([role, hasRole]) => {
    if (hasRole && ROLE_PERMISSIONS[role as Role]) {
      ROLE_PERMISSIONS[role as Role].forEach(permission => {
        permissions.add(permission);
      });
    }
  });
  
  return Array.from(permissions);
}

export function getUserRoles(user: User | null): Role[] {
  if (!user) return [];
  
  return Object.entries(user.roles)
    .filter(([, hasRole]) => hasRole)
    .map(([role]) => role as Role);
}
