/**
 * IAAA · Admin 1 · Admin API client
 *
 * Client-side fetches for admin pages.
 * All requests use credentials: 'include' — httpOnly cookie auth.
 * Backend returns 403 if is_admin=false.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export interface AdminStats {
  users_total: number
  users_by_tier: Record<string, number>
  cards_total: number
  cards_public: number
  generate_calls_7d: number
  generate_cost_7d_usd: number | null
  last_updated: string
}

export interface AdminUserRow {
  id:                 string
  email:              string
  tier:               string
  is_admin:           boolean
  is_active:          boolean
  account_expires_at: string | null
  created_at:         string
  card_count:         number
}

export interface AdminUsersResponse {
  users: AdminUserRow[]
  total: number
  offset: number
  limit: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API}/admin/stats`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Admin stats failed: ${res.status}`)
  return res.json()
}

export async function getAdminUsers(
  offset = 0,
  limit = 50,
  tier?: string,
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  })
  if (tier) params.set('tier', tier)

  const res = await fetch(`${API}/admin/users?${params}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Admin users failed: ${res.status}`)
  return res.json()
}
