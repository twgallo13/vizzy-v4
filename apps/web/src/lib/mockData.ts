// Mock data for Vizzy v4 demo - used when Firebase is not available
export const mockUsers = [
  {
    id: 'admin1',
    displayName: 'Admin User',
    email: 'admin@demo.local',
    role: 'admin',
    status: 'active',
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'manager1',
    displayName: 'Manager User',
    email: 'manager@demo.local',
    role: 'manager',
    status: 'active',
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'planner1',
    displayName: 'Planner User',
    email: 'planner@demo.local',
    role: 'planner',
    status: 'active',
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'ai-system',
    displayName: 'AI Assistant',
    email: 'ai@demo.local',
    role: 'ai_assistant',
    status: 'active',
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

export const mockStores = [
  {
    id: 's001',
    name: 'Store 1',
    region: 'west',
    channel: 'retail',
    status: 'active',
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

export const mockCampaigns = [
  {
    id: 'c1',
    title: 'Fall Footwear Launch',
    description: 'Launch campaign for new fall footwear collection targeting young adults',
    owner_id: 'planner1',
    team_id: 'team-west',
    store_id: 's001',
    status: 'draft',
    governance: { hits: 0, overrides: [] },
    wrike_task_id: null,
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
    dueDate: '2025-11-01',
  },
  {
    id: 'c2',
    title: 'Holiday Promo',
    description: 'Holiday season promotional campaign with special offers and discounts',
    owner_id: 'planner1',
    team_id: 'team-west',
    store_id: 's001',
    status: 'approved',
    governance: { hits: 1, overrides: [] },
    wrike_task_id: null,
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
    dueDate: '2025-12-10',
  },
  {
    id: 'c3',
    title: 'AI-Generated Suggestion',
    description: 'AI-suggested campaign based on market trends and customer behavior analysis',
    owner_id: 'planner1',
    team_id: 'team-west',
    store_id: 's001',
    status: 'in_review',
    governance: { hits: 0, overrides: [] },
    wrike_task_id: null,
    schema_version: 'v4',
    created_at: Date.now(),
    updated_at: Date.now(),
    suggested_by: 'ai-system',
    dueDate: '2025-11-15',
  },
];

export const mockGovernance = [
  {
    id: 'g1',
    campaign_ref: 'campaigns/c2',
    rule_id: 'budget.check',
    severity: 'amber',
    evidence: { plannedSpend: 12000, limit: 10000 },
    created_at: Date.now(),
  },
];

export const mockTelemetry = [
  {
    id: 't1',
    event: 'route_view',
    payload: { path: '/planner' },
    ts: Date.now(),
    actor: { id: 'admin1', role: 'admin' },
    outcome: 'ok',
    hash: 'demo-hash',
  },
];

// Mock API functions
export const mockApi = {
  getUsers: () => Promise.resolve(mockUsers),
  getStores: () => Promise.resolve(mockStores),
  getCampaigns: () => Promise.resolve(mockCampaigns),
  getGovernance: () => Promise.resolve(mockGovernance),
  getTelemetry: () => Promise.resolve(mockTelemetry),
};
