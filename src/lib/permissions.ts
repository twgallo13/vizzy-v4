import type { Role, Tier } from '@/models/core';

export type Permission = string;

export function getEffectivePermissions(role: Role, tier: Tier): Set<Permission> {
  const rolePerms = new Set(role.permissions);
  const tierPerms = new Set(tier.permissions);
  
  // Union of role and tier permissions
  return new Set([...rolePerms, ...tierPerms]);
}

export function hasPermission(
  effectivePerms: Set<Permission>, 
  needed: Permission | Permission[]
): boolean {
  const neededPerms = Array.isArray(needed) ? needed : [needed];
  return neededPerms.every(perm => effectivePerms.has(perm));
}

export function validateWrikeName(firstName: string, lastName: string, wrikeName: string): boolean {
  return wrikeName === `${firstName} ${lastName}`;
}