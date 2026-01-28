// Auth utility functions
// Placeholder for future auth utilities

/**
 * Check if a user has a specific role
 */
export function hasRole(
  user: { role: string } | null | undefined,
  role: string
): boolean {
  return user?.role === role
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: { role: string } | null | undefined): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if a user is a groomer
 */
export function isGroomer(user: { role: string } | null | undefined): boolean {
  return hasRole(user, 'groomer') || hasRole(user, 'admin')
}
