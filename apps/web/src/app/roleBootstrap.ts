const KEY = 'vizzy_role';

export function getDevRole(): string | null {
  try {
    const urlRole = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('role')
      : null;
    if (urlRole) {
      localStorage.setItem(KEY, urlRole);
      return urlRole;
    }
    return localStorage.getItem(KEY);
  } catch { 
    return null; 
  }
}

export function setDevRole(role: string) {
  try { 
    localStorage.setItem(KEY, role); 
  } catch {}
}
