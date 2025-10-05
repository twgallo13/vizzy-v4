import type { Role, Tier } from '@/models/core';

export type Permission = string;

/**
 * Calculate effective permissions as union of role and tier permissions
 * @param role - User's role object
 * @param tier - User's tier object
 * @returns Set of all effective permissions
 */
export function getEffectivePermissions(role: Role, tier: Tier): Set<Permission> {
  const rolePerms = role.permissions || [];
  const tierPerms = tier.permissions || [];
  
  // Union of both permission arrays
  return new Set([...rolePerms, ...tierPerms]);
}

/**
 * Check if effective permissions include needed permission(s)
 * @param effective - Set of effective permissions
 * @param needed - Single permission or array of permissions (ALL required)
 * @returns true if all needed permissions are present
 */
export function hasPerm(effective: Set<Permission>, needed: Permission | Permission[]): boolean {
  const requiredPerms = Array.isArray(needed) ? needed : [needed];
  return requiredPerms.every(perm => effective.has(perm));
}

/**
 * Check if user has any of the specified permissions
 * @param effective - Set of effective permissions
 * @param needed - Array of permissions (ANY sufficient)
 * @returns true if at least one needed permission is present
 */
export function hasAnyPerm(effective: Set<Permission>, needed: Permission[]): boolean {
  return needed.some(perm => effective.has(perm));
}

/**
 * Convenience function to get effective permissions from role and tier IDs
 * @param roleId - Role identifier
 * @param tierId - Tier identifier
 * @param roles - Available roles lookup
 * @param tiers - Available tiers lookup
 * @returns Set of effective permissions or empty set if role/tier not found
 */
export function getEffectivePermissionsById(
  roleId: string,
  tierId: string,
  roles: Role[],
  tiers: Tier[]
): Set<Permission> {
  const role = roles.find(r => r.roleId === roleId);
  const tier = tiers.find(t => t.tierId === tierId);
  
  if (!role || !tier) {
    return new Set();
  }
  
  return getEffectivePermissions(role, tier);
}