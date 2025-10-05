import { useMemo } from 'react';
import type { User, Role, Tier } from '@/models/core';
import { getEffectivePermissions, hasPerm, hasAnyPerm, type Permission } from '@/lib/perm';

export interface UsePermissionsResult {
  effective: Set<Permission>;
  hasPerm: (needed: Permission | Permission[]) => boolean;
  hasAnyPerm: (needed: Permission[]) => boolean;
  canRead: (resource: string) => boolean;
  canWrite: (resource: string) => boolean;
}

/**
 * Hook to check user permissions based on role ∪ tier union
 * @param user - Current user object
 * @param role - User's role object
 * @param tier - User's tier object
 * @returns Permission checking utilities
 */
export function usePermissions(
  user: User | null,
  role: Role | null,
  tier: Tier | null
): UsePermissionsResult {
  const effective = useMemo(() => {
    if (!user || !role || !tier) {
      return new Set<Permission>();
    }
    return getEffectivePermissions(role, tier);
  }, [user, role, tier]);

  const checkPerm = useMemo(() => 
    (needed: Permission | Permission[]) => hasPerm(effective, needed),
    [effective]
  );

  const checkAnyPerm = useMemo(() => 
    (needed: Permission[]) => hasAnyPerm(effective, needed),
    [effective]
  );

  const canRead = useMemo(() => 
    (resource: string) => hasPerm(effective, [`${resource}:read`]),
    [effective]
  );

  const canWrite = useMemo(() => 
    (resource: string) => hasPerm(effective, [`${resource}:write`]),
    [effective]
  );

  return {
    effective,
    hasPerm: checkPerm,
    hasAnyPerm: checkAnyPerm,
    canRead,
    canWrite
  };
}

/**
 * Hook for current user permissions (convenience wrapper)
 * @param user - Current user
 * @param roles - Available roles array
 * @param tiers - Available tiers array
 * @returns Permission checking utilities for current user
 */
export function useCurrentUserPermissions(
  user: User | null,
  roles: Role[],
  tiers: Tier[]
): UsePermissionsResult {
  const role = useMemo(() => 
    user ? roles.find(r => r.roleId === user.roleId) || null : null,
    [user, roles]
  );

  const tier = useMemo(() => 
    user ? tiers.find(t => t.tierId === user.tierId) || null : null,
    [user, tiers]
  );

  return usePermissions(user, role, tier);
}