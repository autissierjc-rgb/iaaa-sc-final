/**
 * IAAA · Admin 1 · /admin/users — User list (read only)
 *
 * Server component — fetches users at request time.
 * Supports tier filter and offset pagination via searchParams.
 * Write actions (tier change, disable) come in Admin 2.
 */

import Link from 'next/link'
import { serverFetch } from '@/lib/serverApi'
import type { AdminUsersResponse } from '@/lib/adminApi'
import AdminUserActions from '@/components/admin/AdminUserActions'

const LIMIT = 50
const TIERS = ['free', 'clarity', 'sis', 'plus']

async function getUsers(
  offset: number,
  tier?: string,
): Promise<AdminUsersResponse | null> {
  try {
    const params = new URLSearchParams({ offset: String(offset), limit: String(LIMIT) })
    if (tier) params.set('tier', tier)
    const res = await serverFetch(`/api/admin/users?${params}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const TIER_BADGE: Record<string, string> = {
  free:    'bg-gray-800 text-gray-400',
  clarity: 'bg-blue-950 text-blue-300',
  sis:     'bg-violet-950 text-violet-300',
  plus:    'bg-amber-950 text-amber-300',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { offset?: string; tier?: string }
}) {
  const offset = Math.max(0, parseInt(searchParams.offset ?? '0', 10))
  const tier   = searchParams.tier ?? undefined
  const data   = await getUsers(offset, tier)

  if (!data) {
    return (
      <div className="text-gray-500 text-sm">
        Failed to load users. Check backend logs.
      </div>
    )
  }

  const hasPrev = offset > 0
  const hasNext = offset + LIMIT < data.total

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Users</h1>
          <p className="text-xs text-gray-500 mt-1">
            {data.total} total · showing {offset + 1}–
            {Math.min(offset + LIMIT, data.total)}
          </p>
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              !tier
                ? 'border-gray-500 text-white bg-gray-800'
                : 'border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            All
          </Link>
          {TIERS.map((t) => (
            <Link
              key={t}
              href={`/admin/users?tier=${t}`}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                tier === t
                  ? 'border-gray-500 text-white bg-gray-800'
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Email
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Tier
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Cards
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Admin
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-200 font-mono text-xs">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      TIER_BADGE[user.tier] ?? 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {user.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {user.card_count}
                </td>
                <td className="px-4 py-3 text-xs">
                  {user.is_admin ? (
                    <span className="text-amber-400">admin</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {!user.is_active ? (
                    <span className="text-red-400">disabled</span>
                  ) : user.account_expires_at ? (
                    <span className="text-yellow-400">
                      exp {new Date(user.account_expires_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-600">active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  { /* @ts-ignore */ }<AdminUserActions
                    userId={String(user.id)}
                    email={user.email}
                    tier={user.tier}
                    isActive={user.is_active}
                    isAdmin={user.is_admin}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.users.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            No users found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          {hasPrev ? (
            <Link
              href={`/admin/users?offset=${offset - LIMIT}${tier ? `&tier=${tier}` : ''}`}
              className="hover:text-white transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link
              href={`/admin/users?offset=${offset + LIMIT}${tier ? `&tier=${tier}` : ''}`}
              className="hover:text-white transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
