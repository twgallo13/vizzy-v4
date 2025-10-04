import type { Role, Tier } from '@/models/core';

/**
 * Seed roles per SPS baseline specification
 */
export const SEED_ROLES: Role[] = [
  {
    roleId: 'role_admin',
    name: 'Admin',
    permissions: [
      'users:read',
      'users:write',
      'stores:write',
      'planner:write',
      'planner:approve',
      'export:write',
      'roles:write',
      'roles:read',
      'tiers:write',
      'tiers:read',
      'rules:write',
      'audit:read'
    ],
    description: 'Full system access with governance and configuration rights'
  },
  {
    roleId: 'role_manager',
    name: 'Manager',
    permissions: [
      'users:read',
      'stores:write',
      'planner:write',
      'planner:approve',
      'export:write',
      'audit:read'
    ],
    description: 'Regional manager with approval rights and store management'
  },
  {
    roleId: 'role_planner',
    name: 'Planner',
    permissions: [
      'planner:write'
    ],
    description: 'Campaign planning and activity creation'
  },
  {
    roleId: 'role_contributor',
    name: 'Contributor',
    permissions: [
      'planner:draft'
    ],
    description: 'Content creation for campaigns (drafts only)'
  },
  {
    roleId: 'role_viewer',
    name: 'Viewer',
    permissions: [
      'users:read',
      'stores:read',
      'planner:read'
    ],
    description: 'Read-only access to dashboards and reports'
  }
];

/**
 * Seed tiers per SPS baseline specification
 */
export const SEED_TIERS: Tier[] = [
  {
    tierId: 'tier_local',
    name: 'Local',
    permissions: [],
    description: 'Single store or program scope'
  },
  {
    tierId: 'tier_regional',
    name: 'Regional',
    permissions: [
      'export:write'
    ],
    description: 'Multiple stores or programs in defined region'
  },
  {
    tierId: 'tier_global',
    name: 'Global',
    permissions: [
      'roles:read',
      'tiers:read',
      'audit:read'
    ],
    description: 'Cross-program and enterprise-wide access'
  }
];

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'users:read': 'View user profiles and accounts',
  'users:write': 'Create, edit, and delete user accounts',
  'stores:read': 'View store information',
  'stores:write': 'Manage store data and locations',
  'planner:read': 'View campaign plans and activities',
  'planner:write': 'Create and edit campaign activities',
  'planner:draft': 'Create draft activities only',
  'planner:approve': 'Approve campaign activities',
  'export:write': 'Export data to external systems',
  'roles:read': 'View role configurations',
  'roles:write': 'Manage roles and permissions',
  'tiers:read': 'View tier configurations',
  'tiers:write': 'Manage tiers and scopes',
  'rules:write': 'Set governance rules (Admin only)',
  'audit:read': 'Access audit logs and system events'
};

/**
 * Get all available permissions from roles and tiers
 */
export function getAllPermissions(): string[] {
  const rolePerms = SEED_ROLES.flatMap(role => role.permissions);
  const tierPerms = SEED_TIERS.flatMap(tier => tier.permissions);
  return Array.from(new Set([...rolePerms, ...tierPerms])).sort();
}