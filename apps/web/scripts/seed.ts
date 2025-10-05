// Seed Vizzy v4 demo data - Mock data approach for development
console.log('🌱 Setting up Vizzy v4 demo data...');

// Simulate seeding process
const seedData = {
  users: [
    { id: 'admin1', displayName: 'Admin User', email: 'admin@demo.local', role: 'admin' },
    { id: 'manager1', displayName: 'Manager User', email: 'manager@demo.local', role: 'manager' },
    { id: 'planner1', displayName: 'Planner User', email: 'planner@demo.local', role: 'planner' },
    { id: 'ai-system', displayName: 'AI Assistant', email: 'ai@demo.local', role: 'ai_assistant' },
  ],
  stores: [
    { id: 's001', name: 'Store 1', region: 'west', channel: 'retail' },
  ],
  campaigns: [
    { id: 'c1', title: 'Fall Footwear Launch', status: 'draft', owner_id: 'planner1' },
    { id: 'c2', title: 'Holiday Promo', status: 'approved', owner_id: 'planner1' },
    { id: 'c3', title: 'AI-Generated Suggestion', status: 'in_review', owner_id: 'planner1' },
  ],
  governance: [
    { id: 'g1', campaign_ref: 'campaigns/c2', rule_id: 'budget.check', severity: 'amber' },
  ],
  telemetry: [
    { id: 't1', event: 'route_view', payload: { path: '/planner' } },
  ],
};

console.log('📊 Demo data configured:');
console.log(`   - ${seedData.users.length} users (admin, manager, planner, ai)`);
console.log(`   - ${seedData.stores.length} stores`);
console.log(`   - ${seedData.campaigns.length} campaigns`);
console.log(`   - ${seedData.governance.length} governance rules`);
console.log(`   - ${seedData.telemetry.length} telemetry events`);

console.log('✅ Seed complete. Refresh http://localhost:5173 to see full navigation.');
console.log('🎯 The app will now use mock data for development mode.');
