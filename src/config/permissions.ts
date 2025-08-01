// Centralized permissions configuration

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  OPERATOR: 'operator',
  USER: 'user'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Feature permissions by role
export const FEATURE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.OWNER]: ['*'], // Access to everything
  [ROLES.ADMIN]: ['*'], // Access to everything
  
  [ROLES.MANAGER]: [
    'dashboard',
    'products',
    'customers',
    'suppliers',
    'orders',
    'deliveries',
    'operators',
    'reports',
    'journey-product',
    'journey-order',
    'journey-delivery'
  ],
  
  [ROLES.SUPERVISOR]: [
    'dashboard',
    'products',
    'customers',
    'suppliers',
    'orders',
    'deliveries',
    'reports',
    'journey-product',
    'journey-order',
    'journey-delivery'
  ],
  
  [ROLES.OPERATOR]: [
    'dashboard',
    'products',
    'customers',
    'orders',
    'deliveries',
    'journey-delivery'
  ],
  
  [ROLES.USER]: [
    'dashboard',
    'products',
    'orders'
  ]
};

// API endpoint permissions by role
export const API_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.OWNER]: ['*'], // Access to all APIs
  [ROLES.ADMIN]: ['*'], // Access to all APIs
  
  [ROLES.MANAGER]: [
    '/api/auth/**',
    '/api/products/**',
    '/api/customers/**',
    '/api/orders/**',
    '/api/delivery/**',
    '/api/users/me',
    '/api/logs/**'
  ],
  
  [ROLES.SUPERVISOR]: [
    '/api/auth/**',
    '/api/products/**',
    '/api/customers/**',
    '/api/orders/**',
    '/api/delivery/**',
    '/api/users/me'
  ],
  
  [ROLES.OPERATOR]: [
    '/api/auth/**',
    '/api/products/**',
    '/api/customers/**',
    '/api/orders/**',
    '/api/delivery/**',
    '/api/users/me'
  ],
  
  [ROLES.USER]: [
    '/api/auth/**',
    '/api/products/**',
    '/api/orders/**',
    '/api/users/me'
  ]
};

// Helper functions
export function hasPermission(userRole: Role, feature: string): boolean {
  const permissions = FEATURE_PERMISSIONS[userRole] || [];
  
  // Check for wildcard permission
  if (permissions.includes('*')) return true;
  
  // Check specific permission
  return permissions.includes(feature);
}

export function hasApiPermission(userRole: Role, endpoint: string): boolean {
  const permissions = API_PERMISSIONS[userRole] || [];
  
  // Check for wildcard permission
  if (permissions.includes('*')) return true;
  
  // Check if any permission pattern matches the endpoint
  return permissions.some(pattern => {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/');
    return new RegExp(`^${regex}$`).test(endpoint);
  });
}

export function isAdminRole(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.OWNER;
}

export function isManagerialRole(role: Role): boolean {
  return isAdminRole(role) || role === ROLES.MANAGER || role === ROLES.SUPERVISOR;
}

// Role hierarchy for comparisons
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 90,
  [ROLES.MANAGER]: 70,
  [ROLES.SUPERVISOR]: 50,
  [ROLES.OPERATOR]: 30,
  [ROLES.USER]: 10
};

export function hasHigherRole(userRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function hasEqualOrHigherRole(userRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}