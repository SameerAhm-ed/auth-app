export const ROLES = {
  ADMIN:     'admin',
  AM4_USER:  'am4_user',
  AM5_USER:  'am5_user',
  AM14_USER: 'am14_user',
  AM15_USER: 'am15_user',
  MULTI_USER:'multi_user',
  MANAGER:   'manager',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production'
export const COOKIE_NAME = 'auth-token'
export const TOKEN_EXPIRY = '7d'

// Which roles can access which site — add new site = one new line
export const SITE_PERMISSIONS: Record<string, Role[]> = {
  am4:  ['admin', 'am4_user', 'multi_user', 'manager'],
  am5:  ['admin', 'am5_user', 'multi_user', 'manager'],
  am14: ['admin', 'am14_user', 'manager'],
  am15: ['admin', 'am15_user', 'manager'],
}

// Which sites each role can see (overview cards + sidebar switcher)
export const ROLE_SITES: Record<string, string[]> = {
  admin:     ['am4', 'am5', 'am14', 'am15'],
  am4_user:  ['am4'],
  am5_user:  ['am5'],
  am14_user: ['am14'],
  am15_user: ['am15'],
  multi_user:['am4', 'am5'],
  manager:   ['am4', 'am5', 'am14', 'am15'],
}

// Single-site roles go straight into their site after login
export const SINGLE_SITE_ROLES: Record<string, string> = {
  am4_user:  'am4',
  am5_user:  'am5',
  am14_user: 'am14',
  am15_user: 'am15',
}
