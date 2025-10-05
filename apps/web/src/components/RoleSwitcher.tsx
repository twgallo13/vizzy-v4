import React from 'react';
import { getDevRole, setDevRole } from '@/app/roleBootstrap';

const ROLES = ['admin','manager','planner','analyst','viewer'] as const;

export default function RoleSwitcher() {
  const [role, setRole] = React.useState<string>(getDevRole() || 'admin');
  
  React.useEffect(() => { 
    setDevRole(role); 
  }, [role]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
        DEV ROLE
      </span>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}
