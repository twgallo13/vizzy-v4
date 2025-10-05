import { useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import type { User, Store, Role, Tier, AuditLog } from '@/models/core';
import type { Activity, Program } from '@/models/planner';
import { SEED_ROLES, SEED_TIERS } from '@/data/seed';

export function useInitialData() {
  const [users, setUsers] = useKV<User[]>('users', []);
  const [stores, setStores] = useKV<Store[]>('stores', []);
  const [roles, setRoles] = useKV<Role[]>('roles', []);
  const [tiers, setTiers] = useKV<Tier[]>('tiers', []);
  const [activities, setActivities] = useKV<Activity[]>('activities', []);
  const [programs, setPrograms] = useKV<Program[]>('programs', []);
  const [auditLogs, setAuditLogs] = useKV<AuditLog[]>('audit_logs', []);

  useEffect(() => {
    // Initialize roles if empty
    if (!roles || roles.length === 0) {
      setRoles(SEED_ROLES);
    }

    // Initialize tiers if empty
    if (!tiers || tiers.length === 0) {
      setTiers(SEED_TIERS);
    }

    // Initialize users if empty
    if (!users || users.length === 0) {
      const initialUsers: User[] = [
        {
          uid: 'u_1',
          firstName: 'Maggie',
          lastName: 'Chan',
          displayName: 'Maggie C.',
          email: 'maggie@vizzy.app',
          authProvider: 'google',
          roleId: 'role_admin',
          tierId: 'tier_global',
          strengths: ['copy', 'creative'],
          skills: { copy: 3, ops: 2 },
          availability: { weeklyHours: 35 },
          wrikeName: 'Maggie Chan',
          wrikeSync: true,
          mfaEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        },
        {
          uid: 'u_2',
          firstName: 'Alex',
          lastName: 'Rivera',
          displayName: 'Alex Rivera',
          email: 'alex@vizzy.app',
          authProvider: 'password',
          roleId: 'role_manager',
          tierId: 'tier_regional',
          strengths: ['strategy', 'analysis'],
          skills: { strategy: 4, analysis: 3 },
          availability: { weeklyHours: 40 },
          wrikeName: 'Alex Rivera',
          wrikeSync: true,
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        },
        {
          uid: 'u_3',
          firstName: 'Jordan',
          lastName: 'Smith',
          displayName: 'Jordan Smith',
          email: 'jordan@vizzy.app',
          authProvider: 'google',
          roleId: 'role_planner',
          tierId: 'tier_local',
          strengths: ['creative', 'social'],
          skills: { creative: 4, social: 3 },
          wrikeName: 'Jordan Smith',
          wrikeSync: false,
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }
      ];
      setUsers(initialUsers);
    }

    // Initialize stores if empty
    if (!stores || stores.length === 0) {
      const initialStores: Store[] = [
        {
          storeId: 's_1',
          storeNumber: '1007',
          name: 'Foothill Plaza',
          address1: '123 Foothill Rd',
          city: 'Pasadena',
          state: 'CA',
          zip: '91101',
          status: 'open',
          storeType: 'mall',
          phone: '626-555-0199',
          website: 'https://foothill.example',
          managerUid: 'u_2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          storeId: 's_2',
          storeNumber: '2001',
          name: 'Downtown Center',
          address1: '456 Main Street',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90012',
          status: 'open',
          storeType: 'street',
          phone: '213-555-0100',
          managerUid: 'u_2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          storeId: 's_3',
          storeNumber: '3005',
          name: 'Beach Outlet',
          address1: '789 Ocean Ave',
          city: 'Santa Monica',
          state: 'CA',
          zip: '90401',
          status: 'open',
          storeType: 'outlet',
          phone: '310-555-0150',
          managerUid: 'u_2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setStores(initialStores);
    }

    // Initialize programs if empty
    if (!programs || programs.length === 0) {
      const initialPrograms: Program[] = [
        {
          programId: 'p_1',
          name: 'Holiday 2024',
          seasonTag: 'Holiday',
          status: 'active'
        },
        {
          programId: 'p_2',
          name: 'Spring Launch',
          seasonTag: 'Spring',
          status: 'active'
        }
      ];
      setPrograms(initialPrograms);
    }

    // Initialize activities if empty
    if (!activities || activities.length === 0) {
      const initialActivities: Activity[] = [
        {
          activityId: 'a_1',
          channel: 'Email',
          contentPacket: {
            subjectLine: 'Sneakerheads VIP Drop',
            hashtags: ['#sneakerheads', '#vip', '#exclusive'],
          },
          ownerUid: 'u_1',
          status: 'approved'
        },
        {
          activityId: 'a_2',
          channel: 'Social',
          contentPacket: {
            subjectLine: 'Holiday Collection Preview',
            hashtags: ['#holiday', '#newcollection', '#preview'],
          },
          ownerUid: 'u_3',
          status: 'draft'
        },
        {
          activityId: 'a_3',
          channel: 'Banner',
          contentPacket: {
            subjectLine: 'Black Friday Sale',
            hashtags: ['#blackfriday', '#sale', '#discount'],
            bannerUrl: '/banner-blackfriday.jpg'
          },
          ownerUid: 'u_2',
          status: 'approved'
        },
        {
          activityId: 'a_4',
          channel: 'Push',
          contentPacket: {
            subjectLine: 'Flash Sale Alert',
            hashtags: ['#flashsale', '#limited'],
          },
          ownerUid: 'u_3',
          status: 'exported'
        },
        {
          activityId: 'a_5',
          channel: 'Email',
          contentPacket: {
            subjectLine: 'Member Exclusive Access',
            hashtags: ['#members', '#exclusive', '#early'],
          },
          ownerUid: 'u_1',
          status: 'draft'
        }
      ];
      setActivities(initialActivities);
    }

  }, [(roles?.length || 0), (tiers?.length || 0), (users?.length || 0), (stores?.length || 0), (programs?.length || 0), (activities?.length || 0), setRoles, setTiers, setUsers, setStores, setPrograms, setActivities]);

  return {
    users,
    stores,
    roles,
    tiers,
    activities,
    programs,
    auditLogs,
    setUsers,
    setStores,
    setRoles,
    setTiers,
    setActivities,
    setPrograms,
    setAuditLogs
  };
}