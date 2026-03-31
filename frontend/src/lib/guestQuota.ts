/**
 * IAAA · guestQuota
 * Compteur de SC pour visiteurs non-inscrits.
 * Stocké en localStorage (cookie-like, côté client).
 * Limite : 3 SC sans inscription.
 */

const KEY   = 'iaaa_guest_count'
const LIMIT = 3

export function getGuestCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(KEY) || '0', 10)
}

export function incrementGuestCount(): number {
  const next = getGuestCount() + 1
  localStorage.setItem(KEY, String(next))
  return next
}

export function guestLimitReached(): boolean {
  return getGuestCount() >= LIMIT
}

export function resetGuestCount(): void {
  localStorage.removeItem(KEY)
}

export const GUEST_LIMIT = LIMIT
