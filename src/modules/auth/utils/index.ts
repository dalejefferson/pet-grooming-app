// Auth utility functions

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
 * Check if a user is the owner
 */
export function isOwner(user: { role: string } | null | undefined): boolean {
  return hasRole(user, 'owner')
}

/**
 * Check if a user is an admin (includes owner)
 */
export function isAdmin(user: { role: string } | null | undefined): boolean {
  return hasRole(user, 'admin') || hasRole(user, 'owner')
}

/**
 * Check if a user is a groomer (includes admin and owner for scheduling purposes)
 */
export function isGroomer(user: { role: string } | null | undefined): boolean {
  return hasRole(user, 'groomer') || isAdmin(user)
}
