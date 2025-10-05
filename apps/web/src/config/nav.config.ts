import type { LucideIcon } from 'lucide-react';
import { 
  Calendar, 
  Brain, 
  Shield, 
  Calendar as CalendarIcon, 
  UserCheck,
  Settings,
  FileText,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  requiresAuth?: boolean;
  roles?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV = {
  sections: [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'planner',
          label: 'Planner',
          path: '/planner',
          icon: Calendar,
          description: 'Campaign planning and management',
          requiresAuth: true,
        },
        {
          id: 'ai',
          label: 'AI Control',
          path: '/ai',
          icon: Brain,
          description: 'AI-powered suggestions and automation',
          requiresAuth: true,
        },
        {
          id: 'governance',
          label: 'Governance',
          path: '/governance',
          icon: Shield,
          description: 'Review and approval workflows',
          requiresAuth: true,
          roles: ['admin', 'reviewer'],
        },
      ],
    },
    {
      id: 'workflow',
      label: 'Workflow',
      items: [
        {
          id: 'calendar',
          label: 'Calendar',
          path: '/calendar',
          icon: CalendarIcon,
          description: 'Schedule and timeline management',
          requiresAuth: true,
        },
        {
          id: 'assignment',
          label: 'Assignments',
          path: '/assignments',
          icon: UserCheck,
          description: 'Task and resource assignments',
          requiresAuth: true,
        },
      ],
    },
    {
      id: 'admin',
      label: 'Administration',
      items: [
        {
          id: 'data',
          label: 'Data',
          path: '/data',
          icon: BarChart3,
          description: 'Analytics & exports (demo)',
          requiresAuth: true,
          roles: ['admin', 'manager', 'analyst'],
        },
        {
          id: 'wrike-schema',
          label: 'Wrike Schema',
          path: '/admin/wrike-schema',
          icon: FileText,
          description: 'Wrike integration configuration',
          requiresAuth: true,
          roles: ['admin'],
        },
        {
          id: 'analytics',
          label: 'Analytics',
          path: '/admin/analytics',
          icon: BarChart3,
          description: 'Usage analytics and insights',
          requiresAuth: true,
          roles: ['admin'],
        },
        {
          id: 'users',
          label: 'User Management',
          path: '/admin/users',
          icon: Users,
          description: 'Manage users and permissions',
          requiresAuth: true,
          roles: ['admin'],
        },
        {
          id: 'settings',
          label: 'Settings',
          path: '/admin/settings',
          icon: Settings,
          description: 'System configuration',
          requiresAuth: true,
          roles: ['admin'],
        },
      ],
    },
  ],
  
  // Flattened routes for router
  get routes(): NavItem[] {
    const items: NavItem[] = [];
    this.sections.forEach((section) => {
      section.items.forEach((item) => items.push(item as NavItem));
    });
    return items;
  },
  
  // Quick actions for command palette
  quickActions: [
    {
      id: 'create-campaign',
      label: 'Create Campaign',
      description: 'Start a new campaign',
      icon: Zap,
      action: 'create-campaign',
      shortcut: 'c',
    },
    {
      id: 'ai-suggest',
      label: 'Get AI Suggestions',
      description: 'Request AI assistance',
      icon: Brain,
      action: 'ai-suggest',
      shortcut: 'a',
    },
    {
      id: 'review-queue',
      label: 'Review Queue',
      description: 'View pending reviews',
      icon: Shield,
      action: 'review-queue',
      shortcut: 'r',
    },
  ],
  
  // Keyboard shortcuts
  shortcuts: {
    'cmd+k': 'open-command-palette',
    'cmd+shift+p': 'open-command-palette',
    'ctrl+k': 'open-command-palette',
    'ctrl+shift+p': 'open-command-palette',
    'cmd+1': 'navigate-to-planner',
    'cmd+2': 'navigate-to-ai',
    'cmd+3': 'navigate-to-governance',
    'cmd+4': 'navigate-to-calendar',
    'cmd+5': 'navigate-to-assignment',
    'cmd+shift+1': 'navigate-to-admin',
  },
} as const;

export type NavAction = typeof NAV.quickActions[number]['action'];
export type NavShortcut = keyof typeof NAV.shortcuts;
