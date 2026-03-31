/**
 * IAAA · Admin 1 · /admin — Dashboard summary
 *
 * Server component — fetches stats at request time (no-store).
 * Shows: users by tier, cards total/public, generate calls + cost last 7 days.
 */

import { serverFetch } from '@/lib/serverApi'
import type { AdminStats } from '@/lib/adminApi'

async function getStats(): Promise<AdminStats | null> {
  try {
    const res = await serverFetch('/api/admin/stats')
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const TIER_ORDER = ['free', 'clarity', 'sis', 'plus']
const TIER_LABELS: Record<string, string> = {
  free:    'Free',
  clarity: 'Clarity',
  sis:     'SIS',
  plus:    'Plus',
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  const stats = await getStats()

  if (!stats) {
    return (
      <div className="text-gray-500 text-sm">
        Failed to load stats. Check backend logs.
      </div>
    )
  }

  const costDisplay =
    stats.generate_cost_7d_usd !== null
      ? `$${stats.generate_cost_7d_usd.toFixed(4)}`
      : 'N/A'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {new Date(stats.last_updated).toLocaleString()}
        </p>
      </div>

      {/* Users by tier */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.users_total} />
          {TIER_ORDER.map((tier) => (
            <StatCard
              key={tier}
              label={TIER_LABELS[tier] ?? tier}
              value={stats.users_by_tier[tier] ?? 0}
            />
          ))}
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Situation Cards
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.cards_total} />
          <StatCard
            label="Public"
            value={stats.cards_public}
            sub={
              stats.cards_total > 0
                ? `${Math.round((stats.cards_public / stats.cards_total) * 100)}% of total`
                : undefined
            }
          />
          <StatCard
            label="Private"
            value={stats.cards_total - stats.cards_public}
          />
        </div>
      </section>

      {/* AI usage */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          AI Usage — last 7 days
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Generate calls"
            value={stats.generate_calls_7d}
          />
          <StatCard
            label="Estimated cost"
            value={costDisplay}
            sub={stats.generate_cost_7d_usd === null ? 'No usage data yet' : undefined}
          />
        </div>
      </section>
    </div>
  )
}
