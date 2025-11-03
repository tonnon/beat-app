const RAW_ROLE_DESTINATIONS: Record<string, string> = {
  Employee: '/daily',
  Manager: '/dashboard',
  Administrator: '/admin',
  Editor: '/admin',
};

const normalizeRole = (role: string): string => {
  return role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const ROLE_DESTINATIONS: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_ROLE_DESTINATIONS).map(([role, destination]) => [normalizeRole(role), destination]),
) as Record<string, string>;

export function getDestinationForRole(role?: string | number | null): string {
  if (!role) {
    return '/';
  }

  const rawRole = typeof role === 'number' ? `${role}` : role;
  const trimmedRole = rawRole.trim();

  const normalizedRole = normalizeRole(trimmedRole);

  if (ROLE_DESTINATIONS[normalizedRole]) {
    return ROLE_DESTINATIONS[normalizedRole];
  }

  return '/';
}
