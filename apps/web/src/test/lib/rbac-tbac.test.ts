import { describe, it, expect, vi, beforeEach } from 'vitest';
import { can, hasRole, hasPermission, getUserPermissions } from '@/lib/rbac-tbac';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
}));

vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      roles: {
        admin: true,
        editor: true,
      },
      permissions: {
        'campaigns:create': true,
        'campaigns:read': true,
      },
      teams: ['team1', 'team2'],
    }),
  })),
}));

describe('RBAC/TBAC', () => {
  const mockUser = {
    uid: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    roles: {
      admin: true,
      editor: true,
      viewer: false,
    },
    permissions: {
      'campaigns:create': true,
      'campaigns:read': true,
      'campaigns:delete': false,
    },
    teams: ['team1', 'team2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hasRole', () => {
    it('returns true for user with role', () => {
      expect(hasRole(mockUser, 'admin')).toBe(true);
      expect(hasRole(mockUser, 'editor')).toBe(true);
    });

    it('returns false for user without role', () => {
      expect(hasRole(mockUser, 'viewer')).toBe(false);
      expect(hasRole(mockUser, 'reviewer')).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('returns true for user with explicit permission', () => {
      expect(hasPermission(mockUser, 'campaigns:create')).toBe(true);
      expect(hasPermission(mockUser, 'campaigns:read')).toBe(true);
    });

    it('returns false for user without permission', () => {
      expect(hasPermission(mockUser, 'campaigns:delete')).toBe(false);
      expect(hasPermission(mockUser, 'users:admin')).toBe(false);
    });

    it('returns false for null user', () => {
      expect(hasPermission(null, 'campaigns:create')).toBe(false);
    });
  });

  describe('can', () => {
    const resource = {
      type: 'campaigns',
      id: 'campaign1',
      ownerId: 'user1',
      teamId: 'team1',
    };

    const record = {
      id: 'record1',
      type: 'campaign',
      ownerId: 'user1',
      teamId: 'team1',
      status: 'draft',
    };

    it('allows admin to perform any action', () => {
      expect(can(mockUser, 'create', resource, record)).toBe(true);
      expect(can(mockUser, 'delete', resource, record)).toBe(true);
    });

    it('allows owner to update their own resources', () => {
      expect(can(mockUser, 'update', resource, record)).toBe(true);
    });

    it('denies non-owner from updating others resources', () => {
      const otherRecord = { ...record, ownerId: 'user2' };
      expect(can(mockUser, 'update', resource, otherRecord)).toBe(false);
    });

    it('respects team-based access control', () => {
      const teamRecord = { ...record, teamId: 'team3' };
      expect(can(mockUser, 'read', resource, teamRecord)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(can(null, 'create', resource, record)).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('returns all permissions for user', () => {
      const permissions = getUserPermissions(mockUser);
      expect(permissions).toContain('campaigns:create');
      expect(permissions).toContain('campaigns:read');
      expect(permissions).toContain('campaigns:update');
      expect(permissions).toContain('campaigns:approve');
    });

    it('returns empty array for null user', () => {
      expect(getUserPermissions(null)).toEqual([]);
    });
  });
});
